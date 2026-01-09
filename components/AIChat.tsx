import React, { useState, useRef, useEffect } from 'react';
import { Transaction, ChatMessage } from '../types';
import { analyzeBusinessData } from '../services/geminiService';
import { Send, Bot, User, BrainCircuit, Mic, MicOff, Volume2, ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AIChatProps {
  transactions: Transaction[];
  onBack: () => void;
}

export const AIChat: React.FC<AIChatProps> = ({ transactions, onBack }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      id: 'welcome', 
      role: 'model', 
      content: 'AI features are currently disabled.' 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [useThinking, setUseThinking] = useState(false);
  
  // Live Voice State - Disabled
  const isLiveActive = false;
  const isLiveConnected = false;
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const toggleLiveMode = () => {
    alert("Voice chat is disabled in this version.");
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white h-screen">
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
          <button
             onClick={toggleLiveMode}
             className="p-2 rounded-full transition flex items-center gap-2 px-3 bg-indigo-500 hover:bg-indigo-400 text-white opacity-50 cursor-not-allowed"
             title="Voice Chat Disabled"
          >
             <Mic size={18} />
             <span className="text-xs font-medium hidden sm:inline">Voice</span>
          </button>

          <div className="flex items-center gap-2 bg-indigo-700 px-3 py-1 rounded-full border border-indigo-500 opacity-50">
            <BrainCircuit size={16} className="text-gray-300" />
            <label className="text-xs cursor-pointer select-none flex items-center gap-2">
              <input 
                type="checkbox" 
                checked={useThinking} 
                onChange={(e) => setUseThinking(e.target.checked)}
                className="form-checkbox h-3 w-3 text-green-500 rounded focus:ring-0"
                disabled
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
                  Leon is typing...
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
            placeholder="AI disabled..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={true}
          />
          <button 
            onClick={handleSend}
            disabled={true}
            className="bg-indigo-600 text-white p-2 sm:p-3 rounded-full hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm flex-shrink-0"
          >
            <Send size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};