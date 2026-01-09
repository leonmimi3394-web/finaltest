import React, { useState, useRef, useEffect } from 'react';
import { Transaction, ChatMessage } from '../types';
import { analyzeBusinessData, ai, createBlob, decodeAudioData, decode } from '../services/geminiService';
import { Send, Bot, User, BrainCircuit, Mic, MicOff, Volume2, ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { LiveServerMessage, Modality } from '@google/genai';

interface AIChatProps {
  transactions: Transaction[];
  onBack: () => void;
}

export const AIChat: React.FC<AIChatProps> = ({ transactions, onBack }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      id: 'welcome', 
      role: 'model', 
      content: 'Hello! I am Leon, your adbfc AI Business Manager. Ask me about your sales, profit margins, or how to optimize your replacement costs. I can speak Bengali and English.' 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [useThinking, setUseThinking] = useState(false);
  
  // Live Voice State
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Live Audio Refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopLiveSession();
    };
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const responseText = await analyzeBusinessData(userMsg.content, transactions, useThinking);

    const modelMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'model',
      content: responseText,
      isThinking: useThinking
    };

    setMessages(prev => [...prev, modelMsg]);
    setLoading(false);
  };

  // --- Live API Implementation ---

  const startLiveSession = async () => {
    try {
      setIsLiveActive(true);
      
      // Prepare contexts
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 16000});
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      nextStartTimeRef.current = 0;

      // Get Microphone Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Prepare Context for AI
      const context = JSON.stringify(transactions.slice(0, 50));
      const systemInstruction = `
        You are Leon, a voice assistant for 'adbfc', an LED bulb business. 
        You are talking to the business owner.
        Key Terms: Munafa (Profit), Replace Cost (Warranty cost).
        Data Context: ${context}.
        Keep answers concise and conversational.
      `;

      // Connect to Gemini Live
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            console.log('Gemini Live Connected');
            setIsLiveConnected(true);
            
            // Start processing microphone audio
            if (!inputAudioContextRef.current) return;
            
            const source = inputAudioContextRef.current.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              
              sessionPromise.then((session: any) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const outputCtx = outputAudioContextRef.current;
            if (!outputCtx) return;

            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
               try {
                // Sync playback time
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);

                const audioBuffer = await decodeAudioData(
                  decode(base64Audio),
                  outputCtx,
                  24000,
                  1
                );

                const source = outputCtx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputCtx.destination);
                
                source.addEventListener('ended', () => {
                  sourcesRef.current.delete(source);
                });

                source.start(nextStartTimeRef.current);
                sourcesRef.current.add(source);
                nextStartTimeRef.current += audioBuffer.duration;
               } catch (e) {
                 console.error("Audio decode error", e);
               }
            }
            
            // Handle Interruptions
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => {
            console.log('Gemini Live Closed');
            setIsLiveConnected(false);
            setIsLiveActive(false);
          },
          onerror: (err) => {
            console.error('Gemini Live Error', err);
            stopLiveSession();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: systemInstruction,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } // Kore, Puck, Charon, Fenrir, Zephyr
          }
        }
      });

      sessionPromiseRef.current = sessionPromise;

    } catch (error) {
      console.error("Failed to start live session", error);
      setIsLiveActive(false);
    }
  };

  const stopLiveSession = () => {
    setIsLiveActive(false);
    setIsLiveConnected(false);

    // Stop Mic Stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    // Close Audio Contexts
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }

    // Stop playback sources
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();

    // Close Session if possible
    sessionPromiseRef.current?.then((session: any) => {
        if (session.close) session.close();
    });
    sessionPromiseRef.current = null;
  };

  const toggleLiveMode = () => {
    if (isLiveActive) {
      stopLiveSession();
    } else {
      startLiveSession();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white h-screen">
      
      {/* Live Mode Overlay */}
      {isLiveActive && (
        <div className="absolute inset-0 bg-indigo-900/95 z-20 flex flex-col items-center justify-center text-white animate-fade-in">
          <div className="mb-8 relative">
            <div className="w-24 h-24 bg-indigo-500 rounded-full flex items-center justify-center animate-pulse">
               <Mic size={40} className="text-white" />
            </div>
            {isLiveConnected && (
              <div className="absolute -right-2 -top-2 bg-green-500 rounded-full p-1.5 border-4 border-indigo-900"></div>
            )}
          </div>
          
          <h3 className="text-2xl font-bold mb-2">Voice Chat Active</h3>
          <p className="text-indigo-200 mb-8 text-center max-w-xs">
            {isLiveConnected ? "Listening... Speak naturally to ask Leon about business." : "Connecting to Gemini Live..."}
          </p>
          
          <button 
            onClick={toggleLiveMode}
            className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full font-semibold flex items-center gap-2 transition transform hover:scale-105"
          >
            <MicOff size={20} /> End Voice Chat
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-indigo-600 p-3 sm:p-4 text-white flex justify-between items-center z-10 shadow-md">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-2 hover:bg-indigo-500 rounded-full transition -ml-1">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Bot size={24} />
            <h2 className="font-semibold text-base sm:text-lg">Leon (AI)</h2>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Live Button */}
          <button
             onClick={toggleLiveMode}
             className={`p-2 rounded-full transition flex items-center gap-2 px-3 ${
               isLiveActive 
                 ? 'bg-red-500 text-white hover:bg-red-600' 
                 : 'bg-indigo-500 hover:bg-indigo-400 text-white'
             }`}
             title="Start Voice Chat"
          >
             {isLiveActive ? <Volume2 size={18} className="animate-pulse" /> : <Mic size={18} />}
             <span className="text-xs font-medium hidden sm:inline">Voice</span>
          </button>

          {/* Thinking Mode Toggle */}
          <div className="flex items-center gap-2 bg-indigo-700 px-3 py-1 rounded-full border border-indigo-500">
            <BrainCircuit size={16} className={useThinking ? "text-green-400 animate-pulse" : "text-gray-300"} />
            <label className="text-xs cursor-pointer select-none flex items-center gap-2">
              <input 
                type="checkbox" 
                checked={useThinking} 
                onChange={(e) => setUseThinking(e.target.checked)}
                className="form-checkbox h-3 w-3 text-green-500 rounded focus:ring-0"
              />
              <span className="hidden sm:inline">Thinking</span>
            </label>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 pb-20">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-br-none' 
                : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
            }`}>
              <div className="flex items-center gap-2 mb-1 opacity-70 text-xs">
                {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                <span>{msg.role === 'user' ? 'You' : msg.isThinking ? 'Leon (Thinking)' : 'Leon'}</span>
              </div>
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 rounded-bl-none">
              <div className="flex items-center gap-2">
                <Bot size={16} className="text-indigo-600" />
                <span className="text-sm text-gray-500 animate-pulse">
                  {useThinking ? 'Thinking deeply...' : 'Leon is typing...'}
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 sm:p-4 bg-white border-t border-gray-100 safe-area-bottom w-full">
        <div className="flex gap-2 max-w-4xl mx-auto w-full">
          <input
            type="text"
            className="flex-1 border border-gray-300 rounded-full px-4 sm:px-6 py-2 sm:py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm text-sm sm:text-base"
            placeholder="Ask Leon..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={loading || isLiveActive}
          />
          <button 
            onClick={handleSend}
            disabled={loading || isLiveActive}
            className="bg-indigo-600 text-white p-2 sm:p-3 rounded-full hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm flex-shrink-0"
          >
            <Send size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
