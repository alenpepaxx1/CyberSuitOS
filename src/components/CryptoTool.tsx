/* COPYRIGHT ALEN PEPA */
import React, { useState, useEffect } from 'react';
import { cn } from '@/src/lib/utils';
import { 
  Hash, 
  ArrowRightLeft, 
  Copy, 
  Check, 
  Shield, 
  Zap,
  Lock,
  Unlock,
  Key,
  Eye,
  EyeOff,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  Brain,
  Fingerprint,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import CryptoJS from 'crypto-js';
import { logToTerminal } from './Terminal';
import { fetchAiGenerate } from '../lib/ai-fetch';

type Mode = 'hash' | 'encode' | 'encrypt';
type EncryptSubMode = 'encrypt' | 'decrypt';

export default function CryptoTool() {
  const [mode, setMode] = useState<Mode>('hash');
  const [encryptSubMode, setEncryptSubMode] = useState<EncryptSubMode>('encrypt');
  const [input, setInput] = useState('');
  const [sessionKey, setSessionKey] = useState(() => {
    return sessionStorage.getItem('cyber_crypto_key') || '';
  });
  const [persistKey, setPersistKey] = useState(() => {
    return sessionStorage.getItem('cyber_crypto_persist') === 'true';
  });
  const [isKeyVisible, setIsKeyVisible] = useState(false);
  const [isVaultLocked, setIsVaultLocked] = useState(true);
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [promptValue, setPromptValue] = useState('');
  const [algorithm, setAlgorithm] = useState('SHA256');
  const [encoding, setEncoding] = useState('Base64');
  const [encryptionAlgo, setEncryptionAlgo] = useState('AES');
  const [copied, setCopied] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  const runAiAnalysis = async () => {
    if (!input) return;
    setIsAnalyzing(true);
    setAiAnalysis(null);
    logToTerminal('Initializing Neural Crypto Analysis...', 'info');
    
    try {
      const resData = await fetchAiGenerate({
        contents: [{ role: 'user', parts: [{ text: `Analyze this cryptographic string: "${input}". Identify if it looks like a specific hash (MD5, SHA, etc.), an encoding (Base64, Hex, etc.), or ciphertext. Provide a brief, highly technical 2-paragraph analysis of its entropy, format, and potential origin. Do not output markdown, just plain text.` }] }],
        config: {
          systemInstruction: "You are a CyberSuite OS Cryptography Analyzer. Be highly technical, precise, and objective. Do not use markdown.",
        }
      });

      setAiAnalysis(resData.text);
      logToTerminal('Neural Crypto Analysis complete.', 'success');
    } catch (error) {
      console.error("Failed to generate analysis:", error);
      setAiAnalysis("Analysis failed. Neural link severed.");
      logToTerminal('Neural Crypto Analysis failed.', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (persistKey && sessionKey) {
      sessionStorage.setItem('cyber_crypto_key', sessionKey);
      sessionStorage.setItem('cyber_crypto_persist', 'true');
    } else if (!persistKey) {
      sessionStorage.removeItem('cyber_crypto_key');
      sessionStorage.setItem('cyber_crypto_persist', 'false');
    }
  }, [sessionKey, persistKey]);

  const getEncrypted = () => {
    if (!input || !sessionKey || isVaultLocked) return '';
    try {
      switch (encryptionAlgo) {
        case 'AES': return CryptoJS.AES.encrypt(input, sessionKey).toString();
        case 'DES': return CryptoJS.DES.encrypt(input, sessionKey).toString();
        case 'TripleDES': return CryptoJS.TripleDES.encrypt(input, sessionKey).toString();
        case 'Rabbit': return CryptoJS.Rabbit.encrypt(input, sessionKey).toString();
        case 'RC4': return CryptoJS.RC4.encrypt(input, sessionKey).toString();
        default: return '';
      }
    } catch (e) {
      return 'Encryption error';
    }
  };

  const getDecrypted = () => {
    if (!input || !sessionKey || isVaultLocked) return '';
    try {
      let bytes;
      switch (encryptionAlgo) {
        case 'AES': bytes = CryptoJS.AES.decrypt(input, sessionKey); break;
        case 'DES': bytes = CryptoJS.DES.decrypt(input, sessionKey); break;
        case 'TripleDES': bytes = CryptoJS.TripleDES.decrypt(input, sessionKey); break;
        case 'Rabbit': bytes = CryptoJS.Rabbit.decrypt(input, sessionKey); break;
        case 'RC4': bytes = CryptoJS.RC4.decrypt(input, sessionKey); break;
        default: return '';
      }
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      if (!decrypted) throw new Error('Invalid key');
      return decrypted;
    } catch (e) {
      return 'Decryption error: Invalid key or corrupted data';
    }
  };

  const clearKey = () => {
    setSessionKey('');
    sessionStorage.removeItem('cyber_crypto_key');
    setIsVaultLocked(true);
    logToTerminal('Session key purged from memory and storage.', 'warn');
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptValue) return;
    setSessionKey(promptValue);
    setIsVaultLocked(false);
    setIsPromptOpen(false);
    setPromptValue('');
    logToTerminal('Vault UNLOCKED via secure prompt.', 'success');
  };

  const toggleVault = () => {
    if (isVaultLocked) {
      if (sessionKey) {
        setIsVaultLocked(false);
        logToTerminal('Vault UNLOCKED: Session key restored.', 'success');
      } else {
        setIsPromptOpen(true);
      }
    } else {
      setIsVaultLocked(true);
      logToTerminal('Vault LOCKED: Data protected.', 'info');
    }
  };

  const getHash = () => {
    if (!input) return '';
    try {
      switch (algorithm) {
        case 'MD5': return CryptoJS.MD5(input).toString();
        case 'SHA1': return CryptoJS.SHA1(input).toString();
        case 'SHA256': return CryptoJS.SHA256(input).toString();
        case 'SHA512': return CryptoJS.SHA512(input).toString();
        case 'SHA3': return CryptoJS.SHA3(input).toString();
        case 'RIPEMD160': return CryptoJS.RIPEMD160(input).toString();
        default: return '';
      }
    } catch (e) {
      return 'Error calculating hash';
    }
  };

  const getEncoded = () => {
    if (!input) return '';
    try {
      if (encoding === 'Base64') {
        return btoa(input);
      } else if (encoding === 'Hex') {
        return CryptoJS.enc.Hex.stringify(CryptoJS.enc.Utf8.parse(input));
      } else if (encoding === 'URL') {
        return encodeURIComponent(input);
      } else if (encoding === 'Binary') {
        return input.split('').map(char => char.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
      } else if (encoding === 'ROT13') {
        return input.replace(/[a-zA-Z]/g, (c) => {
          const charCode = c.charCodeAt(0);
          const isUpper = charCode <= 90;
          const limit = isUpper ? 90 : 122;
          const newCode = charCode + 13;
          return String.fromCharCode(newCode <= limit ? newCode : newCode - 26);
        });
      }
      return '';
    } catch (e) {
      return 'Encoding error';
    }
  };

  const getDecoded = () => {
    if (!input) return '';
    try {
      if (encoding === 'Base64') {
        return atob(input);
      } else if (encoding === 'Hex') {
        return CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Hex.parse(input));
      } else if (encoding === 'URL') {
        return decodeURIComponent(input);
      } else if (encoding === 'Binary') {
        return input.split(' ').map(bin => String.fromCharCode(parseInt(bin, 2))).join('');
      } else if (encoding === 'ROT13') {
        return input.replace(/[a-zA-Z]/g, (c) => {
          const charCode = c.charCodeAt(0);
          const isUpper = charCode <= 90;
          const limit = isUpper ? 90 : 122;
          const newCode = charCode + 13;
          return String.fromCharCode(newCode <= limit ? newCode : newCode - 26);
        });
      }
      return '';
    } catch (e) {
      return 'Decoding error';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const output = mode === 'hash' ? getHash() : getEncoded();
  const decodedOutput = mode === 'encode' ? getDecoded() : '';

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Crypto Engine</h1>
        <p className="text-gray-500">Perform cryptographic hashing and data encoding/decoding operations.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex gap-1 bg-cyber-card p-1 rounded-xl border border-cyber-border w-fit">
          <button
            onClick={() => setMode('hash')}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-mono transition-all",
              mode === 'hash' ? "bg-cyber-green text-black font-bold" : "text-gray-500 hover:text-white"
            )}
          >
            HASHING
          </button>
          <button
            onClick={() => setMode('encode')}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-mono transition-all",
              mode === 'encode' ? "bg-cyber-green text-black font-bold" : "text-gray-500 hover:text-white"
            )}
          >
            ENCODING
          </button>
          <button
            onClick={() => setMode('encrypt')}
            className={cn(
              "px-6 py-2 rounded-lg text-sm font-mono transition-all",
              mode === 'encrypt' ? "bg-cyber-green text-black font-bold" : "text-gray-500 hover:text-white"
            )}
          >
            ENCRYPTION
          </button>
        </div>

        {mode === 'encrypt' && (
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl border font-mono text-[10px] uppercase tracking-widest transition-all",
              sessionKey 
                ? (isVaultLocked ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-500" : "bg-cyber-green/10 border-cyber-green/30 text-cyber-green")
                : "bg-red-500/10 border-red-500/30 text-red-500"
            )}>
              {sessionKey ? (isVaultLocked ? <ShieldAlert size={12} /> : <ShieldCheck size={12} />) : <Shield size={12} />}
              {sessionKey ? (isVaultLocked ? "Vault Locked" : "Vault Active") : "No Key Set"}
            </div>
            <button 
              onClick={toggleVault}
              className={cn(
                "p-2 border rounded-lg transition-all",
                isVaultLocked 
                  ? "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10" 
                  : "bg-cyber-green/20 border-cyber-green/40 text-cyber-green hover:bg-cyber-green/30"
              )}
              title={isVaultLocked ? "Unlock Vault" : "Lock Vault"}
            >
              {isVaultLocked ? <Unlock size={16} /> : <Lock size={16} />}
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isPromptOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-cyber-card border border-cyber-border rounded-2xl p-8 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-cyber-green/10 rounded-xl">
                  <Key className="text-cyber-green" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Unlock Crypto Engine</h3>
                  <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">Authentication Required</p>
                </div>
              </div>

              <form onSubmit={handleUnlock} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-mono text-gray-400 uppercase tracking-widest">Enter Session Key</label>
                  <div className="relative">
                    <input
                      autoFocus
                      type={isKeyVisible ? "text" : "password"}
                      value={promptValue}
                      onChange={(e) => setPromptValue(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-black/40 border border-cyber-border rounded-xl pl-4 pr-12 py-4 font-mono text-white focus:outline-none focus:border-cyber-green/50 transition-colors"
                    />
                    <button 
                      type="button"
                      onClick={() => setIsKeyVisible(!isKeyVisible)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
                    >
                      {isKeyVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPromptOpen(false)}
                    className="flex-1 px-6 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all font-mono text-sm"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 rounded-xl bg-cyber-green text-black font-bold hover:bg-cyber-green/90 transition-all font-mono text-sm"
                  >
                    UNLOCK
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-cyber-card border border-cyber-border rounded-2xl p-8 space-y-6">
            {mode === 'encrypt' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-mono text-gray-500 uppercase tracking-widest">Session Encryption Key</label>
                  {sessionKey && (
                    <button 
                      onClick={clearKey}
                      className="text-[10px] font-mono text-red-400 hover:underline flex items-center gap-1"
                    >
                      <Trash2 size={10} /> Purge Key
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={isKeyVisible ? "text" : "password"}
                    value={sessionKey}
                    onChange={(e) => {
                      setSessionKey(e.target.value);
                      if (isVaultLocked) setIsVaultLocked(false);
                    }}
                    placeholder="Enter secure session key..."
                    className="w-full bg-black/40 border border-cyber-border rounded-xl pl-12 pr-12 py-4 font-mono text-white focus:outline-none focus:border-cyber-green/50 transition-colors"
                  />
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                  <button 
                    onClick={() => setIsKeyVisible(!isKeyVisible)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
                  >
                    {isKeyVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setPersistKey(!persistKey)}
                      className={cn(
                        "w-8 h-4 rounded-full relative transition-colors",
                        persistKey ? "bg-cyber-green" : "bg-white/10"
                      )}
                    >
                      <motion.div 
                        animate={{ x: persistKey ? 16 : 2 }}
                        className="absolute top-1 w-2 h-2 bg-white rounded-full"
                      />
                    </button>
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Persist in Session</span>
                  </div>
                  <p className="text-[10px] text-gray-600 font-mono italic">
                    * Keys are held in volatile memory and never persisted to disk.
                  </p>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-xs font-mono text-gray-500 uppercase tracking-widest">Input Data</label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={mode === 'encrypt' ? "Enter text to encrypt or ciphertext to decrypt..." : "Enter text to process..."}
                className="w-full h-32 bg-black/40 border border-cyber-border rounded-xl px-6 py-4 font-mono text-white focus:outline-none focus:border-cyber-green/50 transition-colors resize-none"
              />
            </div>

            <div className="flex flex-wrap gap-4">
              {mode === 'hash' ? (
                ['MD5', 'SHA1', 'SHA256', 'SHA512', 'SHA3', 'RIPEMD160'].map((algo) => (
                  <button
                    key={algo}
                    onClick={() => setAlgorithm(algo)}
                    className={cn(
                      "px-4 py-2 rounded-lg border text-xs font-mono transition-all",
                      algorithm === algo 
                        ? "bg-cyber-green/10 border-cyber-green/40 text-cyber-green" 
                        : "border-cyber-border text-gray-500 hover:border-gray-600"
                    )}
                  >
                    {algo}
                  </button>
                ))
              ) : mode === 'encode' ? (
                ['Base64', 'Hex', 'URL', 'Binary', 'ROT13'].map((enc) => (
                  <button
                    key={enc}
                    onClick={() => setEncoding(enc)}
                    className={cn(
                      "px-4 py-2 rounded-lg border text-xs font-mono transition-all",
                      encoding === enc 
                        ? "bg-cyber-green/10 border-cyber-green/40 text-cyber-green" 
                        : "border-cyber-border text-gray-500 hover:border-gray-600"
                    )}
                  >
                    {enc}
                  </button>
                ))
              ) : (
                <div className="flex flex-col gap-4 w-full">
                  <div className="flex flex-wrap gap-2">
                    {['AES', 'DES', 'TripleDES', 'Rabbit', 'RC4'].map((algo) => (
                      <button
                        key={algo}
                        onClick={() => setEncryptionAlgo(algo)}
                        className={cn(
                          "px-4 py-2 rounded-lg border text-xs font-mono transition-all",
                          encryptionAlgo === algo 
                            ? "bg-cyber-green/10 border-cyber-green/40 text-cyber-green" 
                            : "border-cyber-border text-gray-500 hover:border-gray-600"
                        )}
                      >
                        {algo}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEncryptSubMode('encrypt')}
                      className={cn(
                        "px-4 py-2 rounded-lg border text-xs font-mono transition-all flex items-center gap-2",
                        encryptSubMode === 'encrypt' 
                          ? "bg-cyber-green/10 border-cyber-green/40 text-cyber-green" 
                          : "border-cyber-border text-gray-500 hover:border-gray-600"
                      )}
                    >
                      <Lock size={12} /> ENCRYPT
                    </button>
                    <button
                      onClick={() => setEncryptSubMode('decrypt')}
                      className={cn(
                        "px-4 py-2 rounded-lg border text-xs font-mono transition-all flex items-center gap-2",
                        encryptSubMode === 'decrypt' 
                          ? "bg-cyber-green/10 border-cyber-green/40 text-cyber-green" 
                          : "border-cyber-border text-gray-500 hover:border-gray-600"
                      )}
                    >
                      <Unlock size={12} /> DECRYPT
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t border-cyber-border">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-mono text-gray-500 uppercase tracking-widest">
                    {mode === 'hash' ? `${algorithm} Hash` : mode === 'encode' ? `${encoding} Encoded` : encryptSubMode === 'encrypt' ? 'AES Ciphertext' : 'AES Plaintext'}
                  </label>
                  <button 
                    onClick={() => copyToClipboard(mode === 'encrypt' ? (encryptSubMode === 'encrypt' ? getEncrypted() : getDecrypted()) : output)}
                    className="text-xs text-cyber-green hover:underline flex items-center gap-1"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />} Copy
                  </button>
                </div>
                <div className="w-full bg-black/60 border border-cyber-border rounded-xl px-6 py-4 font-mono text-cyber-green break-all min-h-[60px] relative">
                  {mode === 'encrypt' && isVaultLocked ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded-xl">
                      <span className="text-[10px] text-yellow-500 uppercase tracking-[0.3em]">Vault Locked // Unlock to view</span>
                    </div>
                  ) : null}
                  {mode === 'encrypt' ? (encryptSubMode === 'encrypt' ? getEncrypted() : getDecrypted()) : (output || 'Waiting for input...')}
                </div>
              </div>

              {mode === 'encode' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-mono text-gray-500 uppercase tracking-widest">
                      {encoding} Decoded
                    </label>
                  </div>
                  <div className="w-full bg-black/60 border border-cyber-border rounded-xl px-6 py-4 font-mono text-blue-400 break-all min-h-[60px] relative">
                    {decodedOutput || 'Waiting for input...'}
                  </div>
                </div>
              )}
            </div>
            
            {/* AI Analysis Section */}
            <div className="pt-6 border-t border-cyber-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Brain className="text-purple-400" size={20} />
                  <h3 className="text-sm font-bold text-white">Neural Cipher Analysis</h3>
                </div>
                <button
                  onClick={runAiAnalysis}
                  disabled={!input || isAnalyzing}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg text-xs font-mono transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      ANALYZING...
                    </>
                  ) : (
                    <>
                      <Fingerprint size={14} />
                      ANALYZE INPUT
                    </>
                  )}
                </button>
              </div>
              
              <AnimatePresence mode="wait">
                {isAnalyzing ? (
                  <motion.div
                    key="analyzing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-black/40 border border-purple-500/30 rounded-xl p-6 flex flex-col items-center justify-center min-h-[150px]"
                  >
                    <div className="relative w-16 h-16 mb-4">
                      <div className="absolute inset-0 border-2 border-purple-500/20 rounded-full animate-ping"></div>
                      <div className="absolute inset-2 border-2 border-purple-500/40 rounded-full animate-spin"></div>
                      <div className="absolute inset-4 border-2 border-purple-500/60 rounded-full animate-pulse"></div>
                      <Brain className="absolute inset-0 m-auto text-purple-400" size={24} />
                    </div>
                    <p className="text-xs font-mono text-purple-400 animate-pulse">Establishing neural link to crypto core...</p>
                  </motion.div>
                ) : aiAnalysis ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-black/40 border border-purple-500/30 rounded-xl p-6"
                  >
                    <div className="font-mono text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {aiAnalysis}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-black/40 border border-cyber-border border-dashed rounded-xl p-6 flex flex-col items-center justify-center min-h-[150px] text-center"
                  >
                    <Fingerprint className="text-gray-600 mb-2" size={24} />
                    <p className="text-xs font-mono text-gray-500">Enter data and initialize analysis to identify cryptographic patterns.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-cyber-card border border-cyber-border rounded-2xl p-8">
            <h3 className="text-lg font-mono mb-4 flex items-center gap-2">
              <Lock size={20} className="text-purple-400" />
              Crypto Guide
            </h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white">SHA-256</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Secure Hash Algorithm 256-bit. Currently the industry standard for data integrity and blockchain.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white">MD5 / SHA-1</h4>
                <p className="text-xs text-red-400/70 leading-relaxed">
                  Warning: These are considered cryptographically broken and vulnerable to collision attacks. Use only for legacy compatibility.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white">Base64</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Not encryption! It's an encoding scheme used to represent binary data in an ASCII string format.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-8 flex flex-col items-center text-center">
            <Zap size={32} className="text-purple-400 mb-4" />
            <h4 className="text-sm font-mono text-white mb-2">Hardware Accelerated</h4>
            <p className="text-xs text-gray-500">
              Operations are performed locally in your browser using optimized Web Crypto APIs where available.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
