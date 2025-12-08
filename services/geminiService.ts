
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { MODEL_LIVE, MODEL_THINKING, TOOLS_DECLARATION, getSystemInstruction } from "../constants";
import { arrayBufferToBase64, decodeAudioData, float32ToPCM16, base64ToUint8Array } from "./audioUtils";
import { StudentProfile } from "../types";

interface LiveClientCallbacks {
  onToolCall: (name: string, args: any) => Promise<any>;
  onClose: () => void;
  onError: (error: Error) => void;
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
    userProfile: StudentProfile,
    boardDims: { width: number, height: number },
    context?: { topic?: string, pdfBase64?: string, isReconnect?: boolean }
  ) {
    console.log("[GeminiService] Initializing connection flow...");
    this.isReconnecting = !!context?.isReconnect;
    
    // 1. Initialize Audio Contexts IMMEDIATELY (User Gesture Context)
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    
    try {
      this.inputAudioContext = new AudioContextClass({ sampleRate: 16000 });
      console.log("[GeminiService] Input AudioContext created");
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
    let finalSystemInstruction = getSystemInstruction(userProfile, boardDims.width, boardDims.height);
    
    if (context?.isReconnect) {
      // STRONG RESUME INSTRUCTION
      finalSystemInstruction += `\n\n**CRITICAL CONTEXT RESTORATION:**\nSTATUS: The connection dropped and we are resuming.\nTOPIC: "${context.topic || 'Unknown'}".\nACTION: Apologize briefly for the glitch, then IMMEDIATELY continue explaining the topic from where you likely left off. Do NOT restart the lesson or say "Hello" again.`;
    } else if (context?.topic) {
      finalSystemInstruction += `\n\n**SESSION CONTEXT:**\nThe user wants to learn about: "${context.topic}".\n\n**PROTOCOL:**\n1. Greet the user briefly and confirm the topic.\n2. **STOP** and wait for the user to speak or ask a question.\n3. DO NOT start teaching, lecturing, or drawing immediately. Let the user lead the start of the conversation.`;
    } else {
      finalSystemInstruction += `\n\n**PROTOCOL:**\nGreet the user and ask what they would like to learn today. Wait for their response.`;
    }
    
    if (context?.pdfBase64) {
       finalSystemInstruction += `\n\n**REFERENCE MATERIAL:**\nThe user has provided a PDF document. Acknowledge this and ask the user how they would like to use it (e.g., summarize it, quiz them, etc).`;
    }

    // 4. Configure Live API
    const config = {
      systemInstruction: { parts: [{ text: finalSystemInstruction }] },
      tools: [{ functionDeclarations: TOOLS_DECLARATION }],
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
      },
    };

    // 5. Connect to Websocket
    console.log("[GeminiService] Connecting to Gemini Live API...");
    this.isActive = true; // Set active before connecting to allow callbacks to function
    
    try {
      this.sessionPromise = this.client.live.connect({
        model: MODEL_LIVE,
        config,
        callbacks: {
          onopen: async () => {
            console.log("[GeminiService] Session Opened");
            this.isReconnecting = false;
          },
          onmessage: async (message: LiveServerMessage) => {
            if (!this.isActive) return;

            // Handle Audio
            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && this.outputAudioContext) {
               console.log("[GeminiService] Received audio chunk from model");
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

            // Handle Tool Calls
            const toolCall = message.toolCall;
            if (toolCall) {
              const functionResponses = [];
              for (const fc of toolCall.functionCalls) {
                console.log("[GeminiService] Tool call received:", fc.name, fc.args);
                try {
                  // Execute the tool on the frontend (draw)
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
              
              // Send response back to model
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
            // Ignore internal errors if we are reconnecting or cleaning up
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

  private playAudio(buffer: AudioBuffer) {
    if (!this.outputAudioContext || !this.outputGain) return;

    const source = this.outputAudioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.outputGain); // Connect to Gain -> Analyser -> Dest

    const now = this.outputAudioContext.currentTime;
    // Schedule next chunk at the end of the previous one, or now if we are lagging
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

    // FORCE RESUME AudioContexts (Crucial for mobile/first-interaction)
    if (this.inputAudioContext.state === 'suspended') {
      console.log("[GeminiService] Resuming Input AudioContext...");
      await this.inputAudioContext.resume();
    }
    if (this.outputAudioContext.state === 'suspended') {
      console.log("[GeminiService] Resuming Output AudioContext...");
      await this.outputAudioContext.resume();
    }

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("[GeminiService] MediaStream acquired");
      
      this.source = this.inputAudioContext.createMediaStreamSource(this.mediaStream);
      
      // Setup Input Analysis
      this.inputAnalyser = this.inputAudioContext.createAnalyser();
      this.inputAnalyser.fftSize = 256;
      this.inputAnalyser.smoothingTimeConstant = 0.1;

      this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (e) => {
        if (!this.isActive) return;

        const inputData = e.inputBuffer.getChannelData(0);
        
        // Downsample/Convert float32 to PCM16
        const pcm16 = float32ToPCM16(inputData);
        const pcmBlob = new Uint8Array(pcm16.buffer);
        const base64Data = arrayBufferToBase64(pcmBlob.buffer);

        if (this.sessionPromise) {
          this.sessionPromise.then(session => {
            if (!this.isActive) return;
            try {
              session.sendRealtimeInput({
                media: {
                  mimeType: `audio/pcm;rate=${this.inputAudioContext?.sampleRate || 16000}`,
                  data: base64Data
                }
              });
            } catch (err) {
              // Gracefully handle send errors if connection dropped
              // console.warn("[GeminiService] Send failed (likely closed):", err);
            }
          }).catch(() => {
             // Promise rejection (connection failed), ignore
          });
        }
      };

      // Connect: Source -> Analyser -> Processor -> Destination
      this.source.connect(this.inputAnalyser);
      this.inputAnalyser.connect(this.processor);
      this.processor.connect(this.inputAudioContext.destination);
      
      console.log("[GeminiService] Audio processing pipeline connected");
    } catch (error) {
      console.error("[GeminiService] Error accessing microphone:", error);
      throw error;
    }
  }

  toggleMute(muted: boolean) {
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
      console.log(`[GeminiService] Microphone ${muted ? 'muted' : 'unmuted'}`);
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
