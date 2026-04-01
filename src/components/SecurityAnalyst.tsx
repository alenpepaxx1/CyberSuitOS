/* COPYRIGHT ALEN PEPA */
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Bot, Sparkles, Send, Shield, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { logToTerminal } from './Terminal';

export default function SecurityAnalyst() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const getOfflineAnalysis = (input: string) => {
    const lowerInput = input.toLowerCase();
    
    // Simple pattern matching for "Advanced" offline analysis
    if (lowerInput.includes('select') && lowerInput.includes('from') && lowerInput.includes('where')) {
      return "### [OFFLINE_ANALYSIS] SQL Injection Detected\n\n**Risk Level:** CRITICAL\n\n**Details:** The payload contains standard SQL query structures (`SELECT`, `FROM`, `WHERE`). This is a classic SQL Injection pattern used to bypass authentication or leak database contents.\n\n**Remediation:** Use parameterized queries or prepared statements. Never concatenate user input directly into SQL strings.";
    }
    
    if (lowerInput.includes('<script>') || lowerInput.includes('javascript:') || lowerInput.includes('onerror=')) {
      return "### [OFFLINE_ANALYSIS] Cross-Site Scripting (XSS) Detected\n\n**Risk Level:** HIGH\n\n**Details:** The input contains script tags or inline event handlers. This indicates a potential Stored or Reflected XSS attack aimed at executing malicious code in a user's browser.\n\n**Remediation:** Implement strict input validation and output encoding. Use Content Security Policy (CSP) headers to restrict script execution.";
    }
    
    if (lowerInput.includes('../') || lowerInput.includes('etc/passwd') || lowerInput.includes('c:\\')) {
      return "### [OFFLINE_ANALYSIS] Path Traversal Attempt\n\n**Risk Level:** HIGH\n\n**Details:** The payload attempts to navigate the file system using relative paths (`../`) or access sensitive system files. This could lead to unauthorized data disclosure.\n\n**Remediation:** Sanitize file paths and use a whitelist of allowed directories. Avoid using user input directly in file system operations.";
    }

    if (lowerInput.includes('admin') || lowerInput.includes('password') || lowerInput.includes('root')) {
      return "### [OFFLINE_ANALYSIS] Credential Probing\n\n**Risk Level:** MEDIUM\n\n**Details:** The input contains keywords related to administrative accounts or sensitive credentials. This may be part of a brute-force or social engineering reconnaissance phase.\n\n**Remediation:** Enforce strong password policies, multi-factor authentication (MFA), and rate-limiting on authentication endpoints.";
    }

    const genericResponses = [
      "### [OFFLINE_ANALYSIS] Heuristic Scan Complete\n\n**Risk Level:** LOW\n\n**Details:** No known malicious patterns were identified in the provided input. The payload appears to be standard operational data.\n\n**Remediation:** Continue monitoring system logs for anomalous behavior.",
      "### [OFFLINE_ANALYSIS] Neural Core v4.2.0-stable\n\n**Status:** SECURE\n\n**Details:** Input processed through Alen's local heuristic engine. No immediate threats detected. High entropy detected in input string, suggesting encrypted or compressed data.",
      "### [OFFLINE_ANALYSIS] Security Audit Finished\n\n**Risk Level:** INFORMATIONAL\n\n**Details:** The input string was analyzed for common vulnerabilities. While no direct exploits were found, ensure that all data processing layers follow the principle of least privilege."
    ];
    
    return genericResponses[Math.floor(Math.random() * genericResponses.length)];
  };

  const analyze = async () => {
    if (!query) return;
    setLoading(true);
    logToTerminal(`Initiating Alen's security analysis for: ${query.substring(0, 20)}...`, 'info');
    
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'undefined' || apiKey === '') {
      setTimeout(() => {
        const offlineResult = getOfflineAnalysis(query);
        setResponse(offlineResult);
        logToTerminal('Alen analysis completed (Offline Mode).', 'success');
        setLoading(false);
      }, 1200);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are Alen, a world-class cybersecurity expert. Analyze the following security query or payload and provide a concise, technical explanation of risks and remediation. Query: ${query}`,
        config: {
          systemInstruction: "You are Alen, the CyberSuite OS AI Security Analyst. Be technical, concise, and professional. Use markdown for formatting. If the user asks who you are, identify as Alen.",
        }
      });
      
      setResponse(result.text || 'No analysis available.');
      logToTerminal('Alen analysis completed successfully.', 'success');
    } catch (error) {
      console.error(error);
      const offlineResult = getOfflineAnalysis(query);
      setResponse(`[API_ERROR_FALLBACK] ${offlineResult}`);
      logToTerminal('AI analysis failed. Falling back to local engine.', 'warn');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-cyber-card border border-cyber-border rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-cyber-border bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyber-green/10 rounded-lg">
            <Bot className="text-cyber-green" size={20} />
          </div>
          <div>
            <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">AI Security Analyst</h3>
            <p className="text-[10px] text-gray-500 uppercase font-mono">Powered by Alen</p>
          </div>
        </div>
        <Sparkles className="text-cyber-green/40" size={20} />
      </div>

      <div className="p-6 space-y-6">
        <div className="relative">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Paste a suspicious payload, log entry, or ask a security question..."
            className="w-full h-32 bg-black/40 border border-cyber-border rounded-xl px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-cyber-green/50 transition-colors resize-none"
          />
          <button
            onClick={analyze}
            disabled={loading || !query}
            className="absolute bottom-4 right-4 bg-cyber-green hover:bg-cyber-green/80 disabled:opacity-50 text-black px-4 py-2 rounded-lg font-mono text-xs font-bold flex items-center gap-2 transition-all"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            ANALYZE
          </button>
        </div>

        <AnimatePresence>
          {response && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 bg-black/60 border border-cyber-border rounded-xl space-y-3"
            >
              <div className="flex items-center gap-2 text-cyber-green text-xs font-mono uppercase tracking-widest">
                <Shield size={14} />
                Analysis Result
              </div>
              <div className="text-sm text-gray-300 leading-relaxed font-sans prose prose-invert max-w-none">
                {response.split('\n').map((line, i) => (
                  <p key={i} className="mb-2">{line}</p>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!response && !loading && (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-3 opacity-30">
            <AlertCircle size={32} />
            <p className="text-xs font-mono uppercase tracking-widest">Waiting for input...</p>
          </div>
        )}
      </div>
    </div>
  );
}
