
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { MODEL_LIVE, MODEL_THINKING, TOOLS_DECLARATION, getSystemInstruction } from "../constants";
import { arrayBufferToBase64, decodeAudioData, float32ToPCM16, base64ToUint8Array, downsampleTo16k } from "./audioUtils";
import { StudentProfile } from "../types";

interface LiveClientCallbacks {
  onToolCall: (name: string, args: any) => Promise<any>;
  onClose: () => void;
  onError: (error: Error) => void;
  onCaption?: (text: string) => void;
}

export class GeminiLiveClient {
  private client: GoogleGenAI;
  private sessionPromise: Promise<any> | null = null;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  
  // Connection State
  private isActive = false;
  private isReconnecting = false;
  
  // Audio Analysis & Gain
  private inputAnalyser: AnalyserNode | null = null;
  private outputAnalyser: AnalyserNode | null = null;
  private outputGain: GainNode | null = null;

  // Playback Scheduling
  private nextStartTime = 0;
  private scheduledSources: AudioBufferSourceNode[] = [];

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async connect(
    callbacks: LiveClientCallbacks, 
    config: {
      user: StudentProfile,
      boardDims: { width: number, height: number },
      topic?: string,
      pdfBase64?: string,
      isReconnect?: boolean
    }
  ) {
    const { user, boardDims, topic, pdfBase64, isReconnect } = config;

    console.log("[GeminiService] Initializing connection flow...");
    this.isReconnecting = !!isReconnect;
    
    // 1. Initialize Audio Contexts IMMEDIATELY (User Gesture Context)
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    
    try {
      this.inputAudioContext = new AudioContextClass({ sampleRate: 16000 });
      console.log(`[GeminiService] Input AudioContext created at ${this.inputAudioContext.sampleRate}Hz`);
    } catch (e) {
      console.warn("[GeminiService] Could not set sampleRate for input context, falling back to default");
      this.inputAudioContext = new AudioContextClass();
    }

    try {
      this.outputAudioContext = new AudioContextClass({ sampleRate: 24000 });
      console.log("[GeminiService] Output AudioContext created");
      
      // Setup Output Analysis Graph
      this.outputAnalyser = this.outputAudioContext.createAnalyser();
      this.outputAnalyser.fftSize = 256;
      this.outputAnalyser.smoothingTimeConstant = 0.1;
      
      this.outputGain = this.outputAudioContext.createGain();
      
      // Connect: Gain -> Analyser -> Destination
      this.outputGain.connect(this.outputAnalyser);
      this.outputAnalyser.connect(this.outputAudioContext.destination);

    } catch (e) {
      console.warn("[GeminiService] Could not set sampleRate for output context, falling back to default");
      this.outputAudioContext = new AudioContextClass();
    }

    // 2. Validate and Start Microphone IMMEDIATELY
    console.log("[GeminiService] Requesting microphone access...");
    try {
      await this.startMicrophone();
      console.log("[GeminiService] Microphone started successfully");
    } catch (e: any) {
      console.error("[GeminiService] Microphone access failed", e);
      throw new Error(`Microphone access failed: ${e.message}. Please check permissions.`);
    }

    // Reset playback scheduler
    this.nextStartTime = 0;
    this.scheduledSources = [];

    // 3. Build System Instruction with Dimensions and Context
    let finalSystemInstruction = getSystemInstruction(user, boardDims.width, boardDims.height);
    
    if (isReconnect) {
      finalSystemInstruction += `\n\n**CRITICAL: NETWORK RECOVERY MODE**\nSTATUS: The connection was lost and restored.\nACTION: The previous board state is potentially lost or overlapping. CALL \`create_new_board\` IMMEDIATELY as your first action.\nCONTEXT: We were discussing "${topic || 'the previous topic'}". Briefly recap the last point and continue on the new board.`;
    } else if (topic) {
      finalSystemInstruction += `\n\n**SESSION CONTEXT:**\nThe user wants to learn about: "${topic}".\n\n**PROTOCOL:**\n1. Greet the user briefly and confirm the topic.\n2. **STOP** and wait for the user to speak or ask a question.\n3. DO NOT start teaching, lecturing, or drawing immediately. Let the user lead the start of the conversation.`;
    } else {
      finalSystemInstruction += `\n\n**PROTOCOL:**\nGreet the user and ask what they would like to learn today. Wait for their response.`;
    }
    
    if (pdfBase64) {
       finalSystemInstruction += `\n\n**REFERENCE MATERIAL:**\nThe user has provided a PDF document. Acknowledge this and ask the user how they would like to use it (e.g., summarize it, quiz them, etc).`;
    }

    // 4. Configure Live API
    const liveConfig = {
      systemInstruction: { parts: [{ text: finalSystemInstruction }] },
      tools: [{ functionDeclarations: TOOLS_DECLARATION }],
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
      },
      outputAudioTranscription: {}, 
    };

    // 5. Connect to Websocket
    console.log("[GeminiService] Connecting to Gemini Live API...");
    // NOTE: We do NOT set isActive = true here. We wait for onopen.
    
    try {
      this.sessionPromise = this.client.live.connect({
        model: MODEL_LIVE,
        config: liveConfig,
        callbacks: {
          onopen: async () => {
            console.log("[GeminiService] Session Opened");
            this.isActive = true; // START SENDING AUDIO NOW
            this.isReconnecting = false;
          },
          onmessage: async (message: LiveServerMessage) => {
            if (!this.isActive) return;

            // Handle Audio
            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && this.outputAudioContext) {
               try {
                 const buffer = await decodeAudioData(
                   base64ToUint8Array(audioData), 
                   this.outputAudioContext
                 );
                 this.playAudio(buffer);
               } catch (e) {
                 console.error("[GeminiService] Error decoding audio", e);
               }
            }

            // Handle Captions / Transcription
            const transcriptionText = message.serverContent?.outputTranscription?.text;
            if (transcriptionText) {
                callbacks.onCaption?.(transcriptionText);
            }

            // Handle Tool Calls
            const toolCall = message.toolCall;
            if (toolCall) {
              const functionResponses = [];
              for (const fc of toolCall.functionCalls) {
                console.log("[GeminiService] Tool call received:", fc.name, fc.args);
                try {
                  const result = await callbacks.onToolCall(fc.name, fc.args);
                  functionResponses.push({
                    id: fc.id,
                    name: fc.name,
                    response: { result: result || "ok" }
                  });
                } catch (e) {
                  console.error("[GeminiService] Tool execution error", e);
                  functionResponses.push({
                    id: fc.id,
                    name: fc.name,
                    response: { error: "Failed to execute drawing command" }
                  });
                }
              }
              
              if (functionResponses.length > 0 && this.sessionPromise && this.isActive) {
                 console.log("[GeminiService] Sending tool response back to model");
                 this.sessionPromise.then(session => {
                   if (!this.isActive) return;
                   try {
                     session.sendToolResponse({ functionResponses });
                   } catch (e) {
                     console.error("[GeminiService] Failed to send tool response", e);
                   }
                 }).catch(e => {
                    // Session promise failed, ignore
                 });
              }
            }
          },
          onclose: () => {
            console.log("[GeminiService] Session Closed");
            if (this.isActive) {
                this.isActive = false;
                this.cleanup();
                callbacks.onClose();
            }
          },
          onerror: (err) => {
            console.error("[GeminiService] Session Error", err);
            if (this.isReconnecting && err.message.includes("Internal error")) {
                return;
            }
            if (this.isActive) {
                this.isActive = false;
                this.cleanup();
                callbacks.onError(new Error(err.message));
            }
          }
        }
      });
      
      await this.sessionPromise;
      console.log("[GeminiService] Connection established.");

    } catch (e: any) {
      this.isActive = false;
      this.cleanup();
      throw e;
    }
  }

  async sendImageFrame(base64Data: string) {
    if (!this.sessionPromise || !this.isActive) return;
    try {
      const session = await this.sessionPromise;
      session.sendRealtimeInput({
        media: {
          mimeType: 'image/jpeg',
          data: base64Data
        }
      });
    } catch (e) {
       // Silent fail for frame drops
    }
  }

  private playAudio(buffer: AudioBuffer) {
    if (!this.outputAudioContext || !this.outputGain) return;

    const source = this.outputAudioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.outputGain);

    const now = this.outputAudioContext.currentTime;
    const startTime = Math.max(now, this.nextStartTime);
    
    source.start(startTime);
    this.nextStartTime = startTime + buffer.duration;
    
    this.scheduledSources.push(source);
    
    source.onended = () => {
        const index = this.scheduledSources.indexOf(source);
        if (index > -1) this.scheduledSources.splice(index, 1);
    };
  }

  private async startMicrophone() {
    if (!this.inputAudioContext || !this.outputAudioContext) return;

    if (this.inputAudioContext.state === 'suspended') {
      await this.inputAudioContext.resume();
    }
    if (this.outputAudioContext.state === 'suspended') {
      await this.outputAudioContext.resume();
    }

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.source = this.inputAudioContext.createMediaStreamSource(this.mediaStream);
      
      this.inputAnalyser = this.inputAudioContext.createAnalyser();
      this.inputAnalyser.fftSize = 256;
      this.inputAnalyser.smoothingTimeConstant = 0.1;

      this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (e) => {
        // Drop packets if the socket is not yet open
        if (!this.isActive) return;

        const inputData = e.inputBuffer.getChannelData(0);
        
        // 1. DOWNSAMPLE to 16kHz (Standardize input)
        const currentRate = this.inputAudioContext?.sampleRate || 48000;
        const downsampled = downsampleTo16k(inputData, currentRate);

        // 2. Convert to PCM16
        const pcm16 = float32ToPCM16(downsampled);
        const pcmBlob = new Uint8Array(pcm16.buffer);
        const base64Data = arrayBufferToBase64(pcmBlob.buffer);

        if (this.sessionPromise) {
          this.sessionPromise.then(session => {
            if (!this.isActive) return;
            try {
              session.sendRealtimeInput({
                media: {
                  mimeType: 'audio/pcm;rate=16000', // STRICTLY 16000
                  data: base64Data
                }
              });
            } catch (err) {
              // Ignore closed session errors
            }
          }).catch(() => {
             // Ignore promise rejections
          });
        }
      };

      this.source.connect(this.inputAnalyser);
      this.inputAnalyser.connect(this.processor);
      this.processor.connect(this.inputAudioContext.destination);
      
    } catch (error: any) {
      console.error("[GeminiService] Error accessing microphone:", error);
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          throw new Error("Microphone permission denied. Please allow access in browser settings.");
      }
      throw error;
    }
  }

  toggleMute(muted: boolean) {
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
    }
  }

  getVolumeLevels() {
    return {
      input: this.calculateVolume(this.inputAnalyser),
      output: this.calculateVolume(this.outputAnalyser)
    };
  }

  private calculateVolume(analyser: AnalyserNode | null) {
    if (!analyser) return 0;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);
    
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const average = sum / dataArray.length;
    return average / 255; 
  }

  async disconnect() {
    console.log("[GeminiService] Disconnecting...");
    this.isActive = false;
    this.cleanup();
  }

  isConnectionActive() {
    return this.isActive;
  }

  private cleanup() {
    this.scheduledSources.forEach(source => {
      try { source.stop(); } catch(e){}
    });
    this.scheduledSources = [];
    this.nextStartTime = 0;

    this.mediaStream?.getTracks().forEach(track => track.stop());
    try { this.processor?.disconnect(); } catch(e){}
    try { this.source?.disconnect(); } catch(e){}
    try { this.inputAnalyser?.disconnect(); } catch(e){}
    try { this.outputAnalyser?.disconnect(); } catch(e){}
    try { this.outputGain?.disconnect(); } catch(e){}
    try { this.inputAudioContext?.close(); } catch(e){}
    try { this.outputAudioContext?.close(); } catch(e){}
    
    this.mediaStream = null;
    this.processor = null;
    this.source = null;
    this.inputAnalyser = null;
    this.outputAnalyser = null;
    this.outputGain = null;
    this.inputAudioContext = null;
    this.outputAudioContext = null;
    this.sessionPromise = null;
    console.log("[GeminiService] Cleanup complete");
  }
}

export async function askThinkingBrain(prompt: string, apiKey: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: MODEL_THINKING,
    contents: [{ role: 'user', parts: [{ text: prompt }]}],
    config: {
      thinkingConfig: { thinkingBudget: 32768 },
    }
  });

  return response.text || "";
}
