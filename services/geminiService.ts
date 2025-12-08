
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { MODEL_LIVE, MODEL_THINKING, TOOLS_DECLARATION } from "../constants";
import { arrayBufferToBase64, decodeAudioData, float32ToPCM16, base64ToUint8Array } from "./audioUtils";

interface LiveClientCallbacks {
  onAudioData: (audioBuffer: AudioBuffer) => void;
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
  
  // Audio Analysis & Gain
  private inputAnalyser: AnalyserNode | null = null;
  private outputAnalyser: AnalyserNode | null = null;
  private outputGain: GainNode | null = null;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async connect(callbacks: LiveClientCallbacks, systemInstruction: string) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    
    // Initialize input context safely
    try {
      this.inputAudioContext = new AudioContextClass({ sampleRate: 16000 });
    } catch (e) {
      console.warn("Could not set sampleRate for input context, falling back to default");
      this.inputAudioContext = new AudioContextClass();
    }

    // Initialize output context safely
    try {
      this.outputAudioContext = new AudioContextClass({ sampleRate: 24000 });
      
      // Setup Output Analysis Graph
      this.outputAnalyser = this.outputAudioContext.createAnalyser();
      this.outputAnalyser.fftSize = 256;
      this.outputAnalyser.smoothingTimeConstant = 0.1;
      
      this.outputGain = this.outputAudioContext.createGain();
      
      // Connect: Gain -> Analyser -> Destination
      this.outputGain.connect(this.outputAnalyser);
      this.outputAnalyser.connect(this.outputAudioContext.destination);

    } catch (e) {
      console.warn("Could not set sampleRate for output context, falling back to default");
      this.outputAudioContext = new AudioContextClass();
    }

    const config = {
      model: MODEL_LIVE,
      systemInstruction: systemInstruction, // Use passed instruction
      tools: [{ functionDeclarations: TOOLS_DECLARATION }],
      responseModalities: [Modality.AUDIO],
    };

    this.sessionPromise = this.client.live.connect({
      model: MODEL_LIVE,
      config,
      callbacks: {
        onopen: async () => {
          console.log("Gemini Live Session Opened");
          try {
            await this.startMicrophone();
          } catch (e: any) {
             callbacks.onError(new Error("Microphone access failed: " + e.message));
          }
        },
        onmessage: async (message: LiveServerMessage) => {
          // Handle Audio
          const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audioData && this.outputAudioContext && this.outputGain) {
             const buffer = await decodeAudioData(
               base64ToUint8Array(audioData), 
               this.outputAudioContext
             );
             callbacks.onAudioData(buffer);
          }

          // Handle Tool Calls
          const toolCall = message.toolCall;
          if (toolCall) {
            const functionResponses = [];
            for (const fc of toolCall.functionCalls) {
              console.log("Tool call received:", fc.name, fc.args);
              try {
                // Execute the tool on the frontend (draw)
                const result = await callbacks.onToolCall(fc.name, fc.args);
                functionResponses.push({
                  id: fc.id,
                  name: fc.name,
                  response: { result: result || "ok" }
                });
              } catch (e) {
                console.error("Tool execution error", e);
                functionResponses.push({
                  id: fc.id,
                  name: fc.name,
                  response: { error: "Failed to execute drawing command" }
                });
              }
            }
            
            // Send response back to model
            if (functionResponses.length > 0 && this.sessionPromise) {
               const session = await this.sessionPromise;
               session.sendToolResponse({ functionResponses });
            }
          }
        },
        onclose: () => {
          console.log("Session Closed");
          this.cleanup();
          callbacks.onClose();
        },
        onerror: (err) => {
          console.error("Session Error", err);
          this.cleanup();
          callbacks.onError(new Error(err.message));
        }
      }
    });

    await this.sessionPromise;
  }

  // Send a text message to the AI (useful for context updates)
  async sendText(text: string) {
    if (this.sessionPromise) {
      const session = await this.sessionPromise;
      session.send({ parts: [{ text }] }, true); // true = end of turn? or just stream. Usually no param needed for stream updates.
      // NOTE: The Live API send method usually takes (parts, endOfTurn).
      // We want to send an update without necessarily yielding the floor if the AI is speaking, 
      // but for "User drew something", we might want the AI to react.
    }
  }

  private async startMicrophone() {
    if (!this.inputAudioContext) return;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.source = this.inputAudioContext.createMediaStreamSource(this.mediaStream);
      
      // Setup Input Analysis
      this.inputAnalyser = this.inputAudioContext.createAnalyser();
      this.inputAnalyser.fftSize = 256;
      this.inputAnalyser.smoothingTimeConstant = 0.1;

      this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        // Downsample/Convert float32 to PCM16
        const pcm16 = float32ToPCM16(inputData);
        const pcmBlob = new Uint8Array(pcm16.buffer);
        const base64Data = arrayBufferToBase64(pcmBlob.buffer);

        if (this.sessionPromise) {
          this.sessionPromise.then(session => {
            session.sendRealtimeInput({
              media: {
                mimeType: `audio/pcm;rate=${this.inputAudioContext?.sampleRate || 16000}`,
                data: base64Data
              }
            });
          });
        }
      };

      // Connect: Source -> Analyser -> Processor -> Destination
      this.source.connect(this.inputAnalyser);
      this.inputAnalyser.connect(this.processor);
      this.processor.connect(this.inputAudioContext.destination);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      throw error;
    }
  }

  // Toggle Microphone Mute
  toggleMute(muted: boolean) {
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
    }
  }

  // Get current volume levels (0.0 to 1.0)
  getVolumeLevels() {
    return {
      input: this.calculateVolume(this.inputAnalyser),
      inputLevel: this.calculateVolume(this.inputAnalyser)
    };
  }

  private calculateVolume(analyser: AnalyserNode | null) {
    if (!analyser) return 0;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);
    
    // Calculate RMS-like average
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const average = sum / dataArray.length;
    return average / 255; // Normalize to 0-1
  }

  async disconnect() {
    this.cleanup();
  }

  private cleanup() {
    this.mediaStream?.getTracks().forEach(track => track.stop());
    this.processor?.disconnect();
    this.source?.disconnect();
    this.inputAnalyser?.disconnect();
    this.outputAnalyser?.disconnect();
    this.outputGain?.disconnect();
    this.inputAudioContext?.close();
    this.outputAudioContext?.close();
    
    this.mediaStream = null;
    this.processor = null;
    this.source = null;
    this.inputAnalyser = null;
    this.outputAnalyser = null;
    this.outputGain = null;
    this.inputAudioContext = null;
    this.outputAudioContext = null;
    this.sessionPromise = null;
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
