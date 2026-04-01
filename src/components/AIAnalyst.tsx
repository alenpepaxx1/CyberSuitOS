/* COPYRIGHT ALEN PEPA */
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Bot, Send, User, ShieldCheck, AlertCircle, Terminal, Sparkles, X } from 'lucide-react';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIAnalystProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AIAnalyst({ isOpen, onClose }: AIAnalystProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "CyberSuite AI Analyst online. How can I assist with your security operations today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'undefined' || apiKey === '') {
      setTimeout(() => {
        const responses = [
          "I've analyzed the system logs. No immediate threats detected in the current sector.",
          "Vulnerability scan complete. Recommendation: Update firewall rules for port 443.",
          "Neural core processing... The requested security protocol is currently being simulated.",
          "System optimization suggested. Memory usage is at 78% capacity.",
          "Warning: Potential brute-force attempt detected on SSH node. IP has been blacklisted.",
          "Security audit finished. All encryption modules are operating within normal parameters.",
          "Analyzing threat vectors... The most likely attack surface is the legacy API gateway.",
          "Heuristic analysis suggests a 94% probability of system integrity. Proceed with caution."
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        const assistantMessage: Message = {
          role: 'assistant',
          content: `[OFFLINE_MODE] ${randomResponse}`,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
        setIsLoading(false);
      }, 1500);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: input,
        config: {
          systemInstruction: `You are a world-class cybersecurity analyst and AI assistant for the CyberSuite OS. 
          Your goal is to provide expert security advice, analyze potential threats, explain vulnerabilities, 
          and suggest remediation steps. Be professional, concise, and technical. 
          Use markdown for formatting. If asked about code, provide secure alternatives. 
          You have access to simulated tools like port scanners, fuzzers, and exploit databases.`,
        }
      });

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.text || "I'm sorry, I couldn't process that request.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Error connecting to AI core. Please check your connection.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 400 }}
          animate={{ x: 0 }}
          exit={{ x: 400 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed right-0 top-16 bottom-10 w-[400px] bg-black/80 backdrop-blur-2xl border-l border-white/10 z-40 flex flex-col shadow-2xl"
        >
          <div className="p-4 border-b border-white/10 bg-black/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Bot className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h2 className="text-sm font-mono font-bold text-white uppercase tracking-widest">AI Security Analyst</h2>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-mono text-emerald-500/60 uppercase">Neural Core Active</span>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
          >
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className={`flex items-center gap-2 mb-1 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {msg.role === 'user' ? (
                    <User className="w-3 h-3 text-[#555]" />
                  ) : (
                    <ShieldCheck className="w-3 h-3 text-blue-500" />
                  )}
                  <span className="text-[9px] font-mono text-[#555] uppercase">
                    {msg.role === 'user' ? 'Operator' : 'CyberSuite AI'}
                  </span>
                  <span className="text-[8px] font-mono text-[#333]">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className={`max-w-[90%] p-3 rounded-lg text-[11px] leading-relaxed font-sans ${
                  msg.role === 'user' 
                    ? 'bg-blue-600/10 border border-blue-500/30 text-blue-100' 
                    : 'bg-[#151619] border border-[#333] text-[#ccc]'
                }`}>
                  <div className="markdown-body prose prose-invert prose-xs max-w-none">
                    <Markdown>{msg.content}</Markdown>
                  </div>
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-[10px] font-mono text-[#555] animate-pulse">
                <Terminal className="w-3 h-3" />
                <span>ANALYZING THREAT VECTORS...</span>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-white/10 bg-black/40">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask AI Analyst..."
                className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-4 pr-12 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-all"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-blue-500 disabled:opacity-50 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-3 flex justify-between items-center">
              <div className="flex gap-1.5">
                <div className="w-1 h-1 bg-blue-500 rounded-full" />
                <div className="w-1 h-1 bg-blue-500/50 rounded-full" />
                <div className="w-1 h-1 bg-blue-500/20 rounded-full" />
              </div>
              <span className="text-[8px] font-mono text-gray-600 uppercase tracking-widest">Neural Core v4.2.0-stable</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
