
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { audioUtils } from '../services/gemini';

const LiveView: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

  const stopSession = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close?.();
      sessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
    setIsActive(false);
    setIsConnecting(false);
  }, []);

  const startSession = async () => {
    setIsConnecting(true);
    try {
      // Correctly initialize with process.env.API_KEY as per the guidelines
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      }
      if (!outputAudioContextRef.current) {
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            console.log('Live session opened');
            setIsActive(true);
            setIsConnecting(false);
            
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: audioUtils.encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              
              // CRITICAL: Solely rely on sessionPromise resolution before calling sendRealtimeInput
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              setTranscript(prev => [...prev.slice(-4), `Model: ${text}`]);
            } else if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              setTranscript(prev => [...prev.slice(-4), `You: ${text}`]);
            }

            // Extract audio data from the server message
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
              const ctx = outputAudioContextRef.current;
              // Precise audio scheduling logic
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const buffer = await audioUtils.decodeAudioData(
                audioUtils.decode(base64Audio),
                ctx,
                24000,
                1
              );
              
              const sourceNode = ctx.createBufferSource();
              sourceNode.buffer = buffer;
              sourceNode.connect(ctx.destination);
              sourceNode.addEventListener('ended', () => sourcesRef.current.delete(sourceNode));
              sourceNode.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(sourceNode);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error('Live error:', e);
            stopSession();
          },
          onclose: () => {
            console.log('Live session closed');
            stopSession();
          }
        },
        config: {
          // Modality MUST be exactly one element: Modality.AUDIO
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          },
          systemInstruction: 'You are a helpful and charismatic AI assistant in a real-time voice conversation. Keep your responses naturally conversational and relatively brief.',
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        }
      });
      
      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error('Failed to start live session:', err);
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    return () => stopSession();
  }, [stopSession]);

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 space-y-12">
      <div className="text-center">
        <h2 className="text-4xl font-bold mb-4">Gemini <span className="gradient-text">Live</span></h2>
        <p className="text-slate-400 max-w-md mx-auto">
          Experience natural, low-latency voice conversation. Real-time audio processing with zero-delay responses.
        </p>
      </div>

      <div className="relative">
        {/* Pulsing visualizer */}
        <div className={`w-48 h-48 rounded-full flex items-center justify-center transition-all duration-700 ${
          isActive ? 'bg-blue-600 shadow-[0_0_50px_rgba(37,99,235,0.6)] scale-110' : 'bg-slate-800'
        }`}>
          {isActive ? (
            <div className="flex items-end space-x-1 h-12">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="w-2 bg-white rounded-full animate-bounce" style={{ animationDelay: `${i*0.1}s`, height: `${30 + Math.random() * 70}%` }} />
              ))}
            </div>
          ) : (
            <svg className="w-16 h-16 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
          )}
        </div>
        
        {isActive && (
          <div className="absolute -inset-4 rounded-full border border-blue-500/30 animate-ping" />
        )}
      </div>

      <div className="space-y-4 w-full max-w-md">
        <button
          onClick={isActive ? stopSession : startSession}
          disabled={isConnecting}
          className={`w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-xl flex items-center justify-center space-x-3 ${
            isActive 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-blue-600 hover:bg-blue-500 text-white'
          }`}
        >
          {isConnecting ? (
            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : isActive ? (
            <>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              <span>End Conversation</span>
            </>
          ) : (
            <>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>Start Speaking</span>
            </>
          )}
        </button>

        {transcript.length > 0 && (
          <div className="glass p-4 rounded-2xl space-y-2 text-sm text-slate-300">
            {transcript.map((line, i) => (
              <p key={i} className={line.startsWith('You:') ? 'text-blue-400' : 'text-slate-100'}>{line}</p>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500">Requires microphone permissions. Audio is processed securely via Gemini Live API.</p>
    </div>
  );
};

export default LiveView;
