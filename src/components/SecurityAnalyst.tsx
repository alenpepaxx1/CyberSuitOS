/* COPYRIGHT ALEN PEPA */
import React, { useState, useRef, useEffect } from 'react';
import { Bot, Sparkles, Send, Shield, AlertCircle, Loader2, FileText, Download, Trash2, MessageSquare, Code, FileSearch, Zap, Paperclip } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { logToTerminal } from './Terminal';
import Markdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const TEMPLATES = [
  { id: 'log', label: 'Analyze Log', icon: FileSearch, prompt: 'Analyze the following server log for potential security threats, anomalies, or indicators of compromise (IoCs):\n\n[PASTE LOG HERE]' },
  { id: 'cve', label: 'Explain CVE', icon: Shield, prompt: 'Provide a detailed technical explanation of CVE-[YEAR]-[NUMBER], including its attack vector, impact, and remediation steps.' },
  { id: 'yara', label: 'Write YARA', icon: Code, prompt: 'Write a YARA rule to detect [MALWARE_NAME OR BEHAVIOR]. Include strings, conditions, and metadata.' },
  { id: 'decode', label: 'Deobfuscate', icon: Zap, prompt: 'Deobfuscate and analyze the following payload. Explain what it does and identify any malicious intent:\n\n[PASTE PAYLOAD HERE]' },
];

export default function SecurityAnalyst() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getOfflineAnalysis = (input: string) => {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('select') && lowerInput.includes('from') && lowerInput.includes('where')) {
      return "### [OFFLINE_ANALYSIS] SQL Injection Detected\n\n**Risk Level:** CRITICAL\n\n**Details:** The payload contains standard SQL query structures (`SELECT`, `FROM`, `WHERE`). This is a classic SQL Injection pattern used to bypass authentication or leak database contents.\n\n**Remediation:** Use parameterized queries or prepared statements. Never concatenate user input directly into SQL strings.";
    }
    
    if (lowerInput.includes('<script>') || lowerInput.includes('javascript:') || lowerInput.includes('onerror=')) {
      return "### [OFFLINE_ANALYSIS] Cross-Site Scripting (XSS) Detected\n\n**Risk Level:** HIGH\n\n**Details:** The input contains script tags or inline event handlers. This indicates a potential Stored or Reflected XSS attack aimed at executing malicious code in a user's browser.\n\n**Remediation:** Implement strict input validation and output encoding. Use Content Security Policy (CSP) headers to restrict script execution.";
    }
    
    if (lowerInput.includes('../') || lowerInput.includes('etc/passwd') || lowerInput.includes('c:\\')) {
      return "### [OFFLINE_ANALYSIS] Path Traversal Attempt\n\n**Risk Level:** HIGH\n\n**Details:** The payload attempts to navigate the file system using relative paths (`../`) or access sensitive system files. This could lead to unauthorized data disclosure.\n\n**Remediation:** Sanitize file paths and use a whitelist of allowed directories. Avoid using user input directly in file system operations.";
    }

    return "### [OFFLINE_ANALYSIS] Heuristic Scan Complete\n\n**Risk Level:** LOW\n\n**Details:** No known malicious patterns were identified in the provided input. The payload appears to be standard operational data.\n\n**Remediation:** Continue monitoring system logs for anomalous behavior.";
  };

  const analyze = async () => {
    if (!query.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setLoading(true);
    logToTerminal(`Initiating Alen's security analysis...`, 'info');
    
    try {
      const response = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `Analyze the following security query or payload and provide a concise, technical explanation of risks and remediation. Query: ${userMessage.content}` }] }],
          config: {
            systemInstruction: "You are Alen, the CyberSuite OS AI Security Analyst. Be technical, concise, and professional. Use markdown for formatting. If the user asks who you are, identify as Alen.",
          }
        })
      });

      if (!response.ok) {
        throw new Error('AI analysis failed');
      }

      const data = await response.json();
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.candidates?.[0]?.content?.parts?.[0]?.text || data.text || 'No analysis available.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      logToTerminal('Alen analysis completed successfully.', 'success');
    } catch (error) {
      console.error(error);
      const offlineResult = getOfflineAnalysis(userMessage.content);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `[API_ERROR_FALLBACK] ${offlineResult}`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      logToTerminal('AI analysis failed. Falling back to local engine.', 'warn');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setQuery(prev => prev + (prev ? '\n\n' : '') + `[FILE: ${file.name}]\n${content.substring(0, 2000)}${content.length > 2000 ? '\n...[TRUNCATED]' : ''}`);
      logToTerminal(`Loaded file: ${file.name}`, 'info');
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const exportChat = () => {
    if (messages.length === 0) return;
    
    let exportText = "# Security Analysis Report\n\nGenerated by CyberSuite OS AI Security Analyst (Alen)\n\n---\n\n";
    
    messages.forEach(msg => {
      exportText += `## ${msg.role === 'user' ? 'User Query' : 'AI Analysis'} (${msg.timestamp.toLocaleString()})\n\n`;
      exportText += `${msg.content}\n\n---\n\n`;
    });
    
    const blob = new Blob([exportText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security_analysis_${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    logToTerminal('Exported analysis report.', 'success');
  };

  const clearChat = () => {
    setMessages([]);
    logToTerminal('Cleared analysis history.', 'warn');
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-120px)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bot className="text-emerald-500" size={32} />
            Advanced Security Analyst
          </h1>
          <p className="text-gray-500">AI-powered threat analysis, log parsing, and vulnerability assessment.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {messages.length > 0 && (
            <>
              <button 
                onClick={exportChat}
                className="p-2 rounded-lg border bg-black/40 border-cyber-border text-gray-500 hover:text-white hover:border-emerald-500/50 transition-all flex items-center gap-2 text-xs font-mono uppercase tracking-widest"
              >
                <Download size={16} />
                Export
              </button>
              <button 
                onClick={clearChat}
                className="p-2 rounded-lg border bg-black/40 border-cyber-border text-gray-500 hover:text-red-400 hover:border-red-500/50 transition-all flex items-center gap-2 text-xs font-mono uppercase tracking-widest"
              >
                <Trash2 size={16} />
                Clear
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        {/* Sidebar: Templates */}
        <div className="lg:col-span-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
          <div className="bg-cyber-card border border-cyber-border rounded-xl p-4">
            <h3 className="text-sm font-mono font-bold text-white mb-4 flex items-center gap-2">
              <Zap size={16} className="text-yellow-400" />
              QUICK_TEMPLATES
            </h3>
            <div className="space-y-2">
              {TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setQuery(template.prompt)}
                  className="w-full text-left p-3 rounded-lg border bg-white/5 border-transparent hover:border-emerald-500/30 hover:bg-emerald-500/10 transition-all group flex items-center gap-3"
                >
                  <div className="p-2 bg-black/40 rounded-md text-emerald-500 group-hover:text-emerald-400">
                    <template.icon size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-300 group-hover:text-white">{template.label}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-cyber-card border border-cyber-border rounded-xl p-4">
            <h3 className="text-sm font-mono font-bold text-white mb-4 flex items-center gap-2">
              <Shield size={16} className="text-blue-400" />
              CAPABILITIES
            </h3>
            <ul className="space-y-2 text-xs font-mono text-gray-400">
              <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-500" /> Log Analysis</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-500" /> Payload Deobfuscation</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-500" /> Vulnerability Explanation</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-500" /> YARA/Snort Rule Gen</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-500" /> Incident Response Steps</li>
            </ul>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="lg:col-span-3 flex flex-col bg-cyber-card border border-cyber-border rounded-xl overflow-hidden">
          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#0a0a0a]">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                <div className="p-4 bg-emerald-500/10 rounded-full">
                  <Bot size={48} className="text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Alen Security Analyst Online</h3>
                  <p className="text-sm font-mono text-gray-400 max-w-md">
                    Paste logs, payloads, or ask security questions. I will analyze the data and provide actionable intelligence.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex gap-4 max-w-[90%]",
                    msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  <div className={cn(
                    "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-1",
                    msg.role === 'user' ? "bg-blue-500/20 text-blue-400" : "bg-emerald-500/20 text-emerald-500"
                  )}>
                    {msg.role === 'user' ? <MessageSquare size={16} /> : <Bot size={16} />}
                  </div>
                  
                  <div className={cn(
                    "p-4 rounded-xl space-y-2",
                    msg.role === 'user' 
                      ? "bg-blue-500/10 border border-blue-500/20 text-blue-50" 
                      : "bg-black/60 border border-cyber-border text-gray-300"
                  )}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-gray-500">
                        {msg.role === 'user' ? 'Operator' : 'Alen AI'}
                      </span>
                      <span className="text-[10px] font-mono text-gray-600">
                        {msg.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    
                    {msg.role === 'user' ? (
                      <div className="text-sm font-mono whitespace-pre-wrap break-words">
                        {msg.content}
                      </div>
                    ) : (
                      <div className="text-sm leading-relaxed font-sans prose prose-invert prose-emerald max-w-none prose-pre:bg-black/50 prose-pre:border prose-pre:border-cyber-border prose-pre:font-mono">
                        <Markdown>{msg.content}</Markdown>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
            
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-4 max-w-[90%] mr-auto"
              >
                <div className="shrink-0 w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center mt-1">
                  <Bot size={16} />
                </div>
                <div className="p-4 rounded-xl bg-black/60 border border-cyber-border flex items-center gap-3">
                  <Loader2 size={16} className="animate-spin text-emerald-500" />
                  <span className="text-xs font-mono text-emerald-500 uppercase tracking-widest animate-pulse">
                    Analyzing Threat Data...
                  </span>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-cyber-border bg-black/40">
            <div className="relative flex items-end gap-2">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
                accept=".txt,.log,.csv,.json,.md"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-white/5 hover:bg-white/10 border border-cyber-border rounded-xl text-gray-400 hover:text-white transition-colors shrink-0"
                title="Upload Log/Text File"
              >
                <Paperclip size={20} />
              </button>
              
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    analyze();
                  }
                }}
                placeholder="Paste a suspicious payload, log entry, or ask a security question... (Shift+Enter for new line)"
                className="flex-1 max-h-48 min-h-[52px] bg-black/60 border border-cyber-border rounded-xl px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors resize-y custom-scrollbar"
                rows={1}
              />
              
              <button
                onClick={analyze}
                disabled={loading || !query.trim()}
                className="p-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-black rounded-xl font-bold transition-all shrink-0 flex items-center justify-center"
              >
                <Send size={20} />
              </button>
            </div>
            <div className="mt-2 text-[10px] font-mono text-gray-500 text-center">
              AI can make mistakes. Verify critical security findings.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

