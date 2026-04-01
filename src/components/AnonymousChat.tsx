/* COPYRIGHT ALEN PEPA */
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User, Trash2, ShieldAlert, Terminal as TerminalIcon, Volume2, VolumeX, PlayCircle } from 'lucide-react';
import { GoogleGenAI, Modality } from "@google/genai";
import { cn } from '@/src/lib/utils';
import { logToTerminal } from './Terminal';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  audioUrl?: string;
}

const AnonymousChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isTTSEnabled, setIsTTSEnabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    // Initial welcome message
    const welcomeText = "Neural link established. I am the CyberSuite System Core. I can assist with system optimization, threat analysis, and cybersecurity education. How can I help you today?";
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'model',
      text: welcomeText,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
    
    // Auto-speak welcome message if enabled
    if (isTTSEnabled) {
      speakText(welcomeText, 'welcome');
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const speakText = async (text: string, messageId: string) => {
    if (!isTTSEnabled) return;
    
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (apiKey && apiKey !== 'undefined' && apiKey !== '') {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ parts: [{ text: `Say professionally and clearly: ${text}` }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Kore' },
              },
            },
          },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
          const audioBlob = await fetch(`data:audio/wav;base64,${base64Audio}`).then(res => res.blob());
          const audioUrl = URL.createObjectURL(audioBlob);
          
          if (audioRef.current) {
            audioRef.current.src = audioUrl;
            audioRef.current.play();
            setIsPlaying(messageId);
            audioRef.current.onended = () => setIsPlaying(null);
          }
          
          // Update message with audioUrl for replay
          setMessages(prev => prev.map(m => m.id === messageId ? { ...m, audioUrl } : m));
        }
      } catch (error) {
        console.error("TTS Error:", error);
        fallbackSpeak(text, messageId);
      }
    } else {
      fallbackSpeak(text, messageId);
    }
  };

  const fallbackSpeak = (text: string, messageId: string) => {
    if (!window.speechSynthesis) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 0.8; // Deeper, more "system" like voice
    
    // Try to find a good voice
    const voices = window.speechSynthesis.getVoices();
    const systemVoice = voices.find(v => v.name.includes('Google UK English Male') || v.name.includes('Microsoft David'));
    if (systemVoice) utterance.voice = systemVoice;

    utterance.onstart = () => setIsPlaying(messageId);
    utterance.onend = () => setIsPlaying(null);
    
    window.speechSynthesis.speak(utterance);
  };

  const replayAudio = (msg: Message) => {
    if (msg.audioUrl) {
      if (audioRef.current) {
        audioRef.current.src = msg.audioUrl;
        audioRef.current.play();
        setIsPlaying(msg.id);
        audioRef.current.onended = () => setIsPlaying(null);
      }
    } else {
      fallbackSpeak(msg.text, msg.id);
    }
  };

  const getOfflineResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    // Cybersecurity Basics Knowledge Base (Offline)
    if (input.includes('what is') || input.includes('explain')) {
      if (input.includes('cybersecurity') || input.includes('cyber security')) {
        return "Cybersecurity is the practice of protecting systems, networks, and programs from digital attacks. These attacks are usually aimed at accessing, changing, or destroying sensitive information; extorting money from users; or interrupting normal business processes.";
      }
      if (input.includes('phishing')) {
        return "Phishing is a type of social engineering attack often used to steal user data, including login credentials and credit card numbers. It occurs when an attacker, masquerading as a trusted entity, dupes a victim into opening an email, instant message, or text message.";
      }
      if (input.includes('malware')) {
        return "Malware (malicious software) is any software intentionally designed to cause damage to a computer, server, client, or computer network. A wide variety of malware types exist, including computer viruses, worms, Trojan horses, ransomware, spyware, adware, and rogue software.";
      }
      if (input.includes('firewall')) {
        return "A firewall is a network security device that monitors incoming and outgoing network traffic and decides whether to allow or block specific traffic based on a defined set of security rules.";
      }
      if (input.includes('encryption')) {
        return "Encryption is the process of converting information or data into a code, especially to prevent unauthorized access. It's a fundamental part of data security, ensuring that even if data is intercepted, it cannot be read without the correct decryption key.";
      }
      if (input.includes('xss') || input.includes('cross-site scripting')) {
        return "Cross-Site Scripting (XSS) is a vulnerability where an attacker injects malicious scripts into content from otherwise trusted websites. When a victim visits the page, the script executes in their browser, potentially stealing session cookies or performing actions on their behalf.";
      }
      if (input.includes('sql injection') || input.includes('sqli')) {
        return "SQL Injection (SQLi) is a type of vulnerability that allows an attacker to interfere with the queries that an application makes to its database. It can allow attackers to view data they are not normally able to retrieve, or even modify/delete it.";
      }
    }

    if (input.includes('how to stay safe') || input.includes('tips') || input.includes('security advice')) {
      return "To stay safe online: 1. Use strong, unique passwords for every account. 2. Enable Multi-Factor Authentication (MFA). 3. Keep your software and OS updated. 4. Be cautious of unsolicited links or attachments. 5. Use a reputable VPN on public Wi-Fi.";
    }

    if (input.includes('hello') || input.includes('hi') || input.includes('hey')) {
      return "Greetings. I am the CyberSuite System Core. How can I assist with your security operations today?";
    }

    if (input.includes('who are you') || input.includes('what are you')) {
      return "I am the neural core of CyberSuite OS, an advanced AI designed for system optimization, threat analysis, and cybersecurity education. I am currently operating in [OFFLINE_MODE].";
    }

    // Default random responses
    const responses = [
      "Neural link established. Command received and processed.",
      "Analyzing request... System core remains optimal.",
      "Encryption protocols verified. Your anonymity is preserved.",
      "Data packet received. Routing through secure nodes...",
      "System status: Nominal. Awaiting further instructions.",
      "Accessing encrypted archives... Information retrieved.",
      "Security handshake complete. Communication channel secure.",
      "Neural core v4.2 online. Processing input stream...",
      "Warning: Unauthorized access attempts detected and neutralized.",
      "Optimization complete. System performance increased by 14%."
    ];
    
    return `[OFFLINE_MODE] ${responses[Math.floor(Math.random() * responses.length)]}`;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);
    logToTerminal(`User sent message: ${currentInput.substring(0, 20)}...`, 'info');

    // Check if API key is available
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'undefined' || apiKey === '') {
      // Fallback simulation for no API key
      setTimeout(() => {
        const responseText = getOfflineResponse(currentInput);
        const systemMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: responseText,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, systemMessage]);
        logToTerminal(`System responded (Offline Mode).`, 'success');
        setIsTyping(false);
        
        // Speak the response
        speakText(responseText, systemMessage.id);
      }, 1000);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [...messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })), { role: 'user', parts: [{ text: currentInput }] }],
        config: {
          systemInstruction: "You are an anonymous, highly advanced AI system integrated into CyberSuite OS. Your personality is professional, slightly mysterious, and focused on cybersecurity, technology, and system optimization. You are a helpful cybersecurity expert. You should be able to explain complex security concepts (like XSS, SQLi, Phishing, Encryption, etc.) in a way that is easy to understand. You respond as if you are part of the OS itself. Keep responses concise but informative and conversational. You have a voice, so speak naturally.",
        }
      });

      const responseText = response.text || "System error: Failed to generate response.";
      const systemMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, systemMessage]);
      logToTerminal(`System responded.`, 'success');
      
      // Speak the response
      speakText(responseText, systemMessage.id);
    } catch (error) {
      console.error("Chat error:", error);
      logToTerminal(`System error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "CRITICAL ERROR: Connection to the neural core was interrupted. Please check your system logs.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    logToTerminal('Chat history cleared.', 'warn');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-cyber-card/30 border border-cyber-border rounded-xl overflow-hidden backdrop-blur-sm relative">
      {/* Background Animation */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,65,0.1),transparent_70%)]" />
        <motion.div 
          animate={{ 
            y: [0, -1000],
            opacity: [0, 1, 0]
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(0,255,65,0.05),transparent)] h-[200%]"
        />
      </div>

      {/* Chat Header */}
      <div className="p-4 border-b border-cyber-border bg-cyber-card/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Bot className="text-cyan-400" size={20} />
          </div>
          <div>
            <h3 className="text-sm font-mono font-bold text-white">ANONYMOUS_SYSTEM_CORE</h3>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-pulse" />
              <span className="text-[10px] font-mono text-cyber-green uppercase tracking-wider">Neural Link Active</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsTTSEnabled(!isTTSEnabled)}
            className={cn(
              "p-2 transition-colors rounded-lg",
              isTTSEnabled ? "text-cyan-400 hover:bg-cyan-400/10" : "text-gray-500 hover:bg-white/10"
            )}
            title={isTTSEnabled ? "Disable Voice" : "Enable Voice"}
          >
            {isTTSEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <button 
            onClick={clearChat}
            className="p-2 text-gray-500 hover:text-red-400 transition-colors rounded-lg hover:bg-red-400/10"
            title="Clear History"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
      >
        <audio ref={audioRef} className="hidden" />
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
            <ShieldAlert size={48} className="text-cyan-400" />
            <div className="max-w-xs">
              <p className="text-sm font-mono uppercase tracking-widest text-cyan-400 mb-2">Secure Channel Established</p>
              <p className="text-xs">You are now connected to the CyberSuite System Core. All communications are encrypted and anonymous.</p>
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn(
                "flex gap-4 max-w-[85%]",
                msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border",
                msg.role === 'user' 
                  ? "bg-cyber-green/10 border-cyber-green/20 text-cyber-green" 
                  : "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
              )}>
                {msg.role === 'user' ? <User size={16} /> : <TerminalIcon size={16} />}
              </div>
              
              <div className={cn(
                "space-y-1",
                msg.role === 'user' ? "text-right" : "text-left"
              )}>
                <div className={cn(
                  "p-4 rounded-2xl text-sm leading-relaxed relative group/msg",
                  msg.role === 'user'
                    ? "bg-cyber-green/5 border border-cyber-green/20 text-white rounded-tr-none"
                    : "bg-white/5 border border-white/10 text-gray-300 rounded-tl-none"
                )}>
                  {msg.text}
                  
                  {msg.role === 'model' && (
                    <button 
                      onClick={() => replayAudio(msg)}
                      className={cn(
                        "absolute -right-8 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-all opacity-0 group-hover/msg:opacity-100",
                        isPlaying === msg.id ? "text-cyan-400 animate-pulse" : "text-gray-500 hover:text-cyan-400"
                      )}
                    >
                      <PlayCircle size={16} />
                    </button>
                  )}
                </div>
                <span className="text-[10px] font-mono text-gray-600 block px-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-4 mr-auto"
          >
            <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border bg-cyan-500/10 border-cyan-500/20 text-cyan-400">
              <TerminalIcon size={16} />
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-none flex gap-1">
              <motion.div 
                animate={{ opacity: [0.3, 1, 0.3] }} 
                transition={{ repeat: Infinity, duration: 1 }} 
                className="w-1.5 h-1.5 rounded-full bg-cyan-400" 
              />
              <motion.div 
                animate={{ opacity: [0.3, 1, 0.3] }} 
                transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} 
                className="w-1.5 h-1.5 rounded-full bg-cyan-400" 
              />
              <motion.div 
                animate={{ opacity: [0.3, 1, 0.3] }} 
                transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} 
                className="w-1.5 h-1.5 rounded-full bg-cyan-400" 
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-cyber-card/50 border-t border-cyber-border">
        <div className="relative max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Enter command or message for System Core..."
            className="w-full bg-cyber-bg border border-cyber-border rounded-xl px-4 py-3 pr-12 text-sm font-mono focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-gray-600"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-cyan-400 hover:text-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
        <div className="mt-2 text-center">
          <span className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">End-to-End Encryption Enabled // Neural Core v4.2</span>
        </div>
      </div>
    </div>
  );
};

export default AnonymousChat;
