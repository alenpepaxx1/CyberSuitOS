/* COPYRIGHT ALEN PEPA */
import React, { useState, useRef, useEffect } from 'react';
import { 
  Image as ImageIcon, 
  Lock, 
  Unlock, 
  Download, 
  Upload, 
  Eye,
  Shield,
  Zap,
  Check,
  AlertCircle,
  Brain,
  Activity,
  Layers,
  RefreshCw,
  Fingerprint,
  BarChart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { logToTerminal } from './Terminal';
import { fetchAiGenerate } from '../lib/ai-fetch';
import CryptoJS from 'crypto-js';

type Channel = 'red' | 'green' | 'blue' | 'alpha';
type Mode = 'encode' | 'decode' | 'analysis';

export default function StegoTool() {
  const [mode, setMode] = useState<Mode>('encode');
  const [image, setImage] = useState<string | null>(null);
  const [imageMeta, setImageMeta] = useState<{width: number, height: number, maxBytes: number} | null>(null);
  const [message, setMessage] = useState('');
  const [password, setPassword] = useState('');
  const [channel, setChannel] = useState<Channel>('red');
  const [lsbPlane, setLsbPlane] = useState(0);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [decodedMessage, setDecodedMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Advanced features state
  const [noiseMap, setNoiseMap] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const channelMap: Record<Channel, number> = {
    red: 0,
    green: 1,
    blue: 2,
    alpha: 3
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setImage(dataUrl);
        
        const img = new Image();
        img.onload = () => {
          setImageMeta({
            width: img.width,
            height: img.height,
            maxBytes: Math.floor((img.width * img.height) / 8)
          });
        };
        img.src = dataUrl;
        
        logToTerminal(`Image loaded: ${file.name} (${Math.round(file.size / 1024)} KB)`, 'info');
        setProcessedImage(null);
        setDecodedMessage(null);
        setNoiseMap(null);
        setAiAnalysis(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const getPayloadSize = () => {
    if (!message) return 0;
    let finalMessage = message;
    if (password) {
      try {
        finalMessage = CryptoJS.AES.encrypt(message, password).toString();
      } catch (e) {
        // Ignore encryption errors during typing
      }
    }
    return (finalMessage + '##END##').length;
  };

  const payloadSize = getPayloadSize();
  const capacityPercent = imageMeta ? Math.min(100, (payloadSize / imageMeta.maxBytes) * 100) : 0;

  const encodeMessage = () => {
    if (!image || !message || !imageMeta) return;
    setLoading(true);
    logToTerminal(`Initiating steganography encoding (Channel: ${channel}, Plane: ${lsbPlane})...`, 'info');

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      let finalMessage = message;
      if (password) {
        logToTerminal('Encrypting message with AES-256...', 'info');
        finalMessage = CryptoJS.AES.encrypt(message, password).toString();
      }

      const fullMessage = finalMessage + '##END##';
      const binaryMessage = Array.from(fullMessage).map(char => 
        char.charCodeAt(0).toString(2).padStart(8, '0')
      ).join('');

      if (binaryMessage.length > data.length / 4) {
        logToTerminal('Error: Payload exceeds maximum capacity for this image.', 'error');
        setLoading(false);
        return;
      }

      const channelOffset = channelMap[channel];
      for (let i = 0; i < binaryMessage.length; i++) {
        const pixelIdx = i * 4 + channelOffset;
        const bit = parseInt(binaryMessage[i]);
        data[pixelIdx] = (data[pixelIdx] & ~(1 << lsbPlane)) | (bit << lsbPlane);
      }

      ctx.putImageData(imageData, 0, 0);
      setProcessedImage(canvas.toDataURL());
      setNoiseMap(null); // Reset noise map
      logToTerminal('Encoding complete. Payload injected into image matrix.', 'success');
      setLoading(false);
      setMode('analysis'); // Auto switch to analysis to view result
    };
    img.src = image;
  };

  const decodeMessage = () => {
    const targetImage = processedImage || image;
    if (!targetImage) return;
    
    setLoading(true);
    logToTerminal(`Scanning image matrix for hidden patterns (Channel: ${channel}, Plane: ${lsbPlane})...`, 'info');

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const channelOffset = channelMap[channel];
      let binaryMessage = '';
      for (let i = 0; i < data.length / 4; i++) {
        const pixelIdx = i * 4 + channelOffset;
        binaryMessage += ((data[pixelIdx] >> lsbPlane) & 1).toString();
      }

      let decoded = '';
      for (let i = 0; i < binaryMessage.length; i += 8) {
        const charCode = parseInt(binaryMessage.substr(i, 8), 2);
        if (charCode === 0) break;
        decoded += String.fromCharCode(charCode);
        if (decoded.endsWith('##END##')) {
          decoded = decoded.replace('##END##', '');
          break;
        }
      }

      if (password && decoded) {
        try {
          logToTerminal('Decrypting payload with provided key...', 'info');
          const bytes = CryptoJS.AES.decrypt(decoded, password);
          const decrypted = bytes.toString(CryptoJS.enc.Utf8);
          if (!decrypted) throw new Error('Invalid password');
          decoded = decrypted;
        } catch (e) {
          logToTerminal('Decryption failed: Invalid key or corrupted payload.', 'error');
          decoded = '';
        }
      }

      setDecodedMessage(decoded);
      if (decoded) {
        logToTerminal('Decoding complete. Payload extracted successfully.', 'success');
      } else {
        logToTerminal('Decoding complete. No valid payload found.', 'warn');
      }
      setLoading(false);
    };
    img.src = targetImage;
  };

  const generateNoiseMap = () => {
    const targetImage = processedImage || image;
    if (!targetImage) return;
    
    setLoading(true);
    logToTerminal(`Generating bit-plane noise map (Channel: ${channel}, Plane: ${lsbPlane})...`, 'info');

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const channelOffset = channelMap[channel];

      for (let i = 0; i < data.length; i += 4) {
        const pixelVal = data[i + channelOffset];
        const bit = (pixelVal >> lsbPlane) & 1;
        const color = bit === 1 ? 255 : 0;
        
        data[i] = color;     // R
        data[i + 1] = color; // G
        data[i + 2] = color; // B
        data[i + 3] = 255;   // A
      }

      ctx.putImageData(imageData, 0, 0);
      setNoiseMap(canvas.toDataURL());
      logToTerminal('Noise map generated. Anomalies highlighted.', 'success');
      setLoading(false);
    };
    img.src = targetImage;
  };

  const runAiAnalysis = async () => {
    if (!imageMeta) return;
    setIsAnalyzing(true);
    setAiAnalysis(null);
    logToTerminal('Initializing Neural Steganalysis...', 'info');
    
    try {
      const prompt = `Perform a technical steganalysis assessment. 
Image Metadata: ${imageMeta.width}x${imageMeta.height} pixels.
Max Capacity (1 bit/pixel): ${imageMeta.maxBytes} bytes.
Target Channel: ${channel}, Bit Plane: ${lsbPlane}.
${processedImage ? 'Status: Image has been modified with steganographic payload.' : 'Status: Analyzing base image structure.'}

Provide a highly technical, 2-paragraph analysis of the structural integrity, potential for LSB anomaly detection, and entropy characteristics. Do not use markdown, just plain text.`;

      const resData = await fetchAiGenerate({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction: "You are a CyberSuite OS Steganalysis AI. Be highly technical, precise, and objective. Do not use markdown.",
        }
      });

      const text = resData.text || 'Analysis failed.';
      setAiAnalysis(text);
      logToTerminal('Neural Steganalysis complete.', 'success');
    } catch (error) {
      console.error(error);
      setAiAnalysis('ERROR: Neural link severed. Analysis failed.');
      logToTerminal('Neural Steganalysis failed.', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Layers className="text-cyber-green" size={32} />
          Advanced Steganography Lab
        </h1>
        <p className="text-gray-500">Inject, extract, and analyze encrypted payloads within image matrices.</p>
      </div>

      <div className="flex gap-2 mb-6 border-b border-cyber-border pb-4">
        {(['encode', 'decode', 'analysis'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "px-6 py-2 rounded-lg font-mono text-sm uppercase tracking-wider transition-all flex items-center gap-2",
              mode === m 
                ? "bg-cyber-green/10 text-cyber-green border border-cyber-green/50 shadow-[0_0_15px_rgba(0,255,0,0.1)]" 
                : "bg-transparent border border-transparent text-gray-500 hover:text-gray-300"
            )}
          >
            {m === 'encode' && <Lock size={16} />}
            {m === 'decode' && <Unlock size={16} />}
            {m === 'analysis' && <Activity size={16} />}
            {m}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Image & Settings */}
        <div className="space-y-6">
          <div className="bg-cyber-card border border-cyber-border rounded-2xl p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-mono text-gray-500 uppercase tracking-widest">Target Matrix (Image)</label>
                {imageMeta && (
                  <span className="text-xs font-mono text-cyber-green">
                    {imageMeta.width}x{imageMeta.height}px
                  </span>
                )}
              </div>
              
              <div 
                className={cn(
                  "relative h-64 border-2 border-dashed border-cyber-border rounded-xl overflow-hidden flex flex-col items-center justify-center transition-all group",
                  !image && "hover:border-cyber-green/30 hover:bg-cyber-green/5"
                )}
              >
                {image ? (
                  <>
                    <img src={mode === 'analysis' && noiseMap ? noiseMap : (processedImage || image)} alt="Target" className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-white font-mono text-sm bg-black/80 px-4 py-2 rounded-lg border border-cyber-border">
                        Click to change image
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-4 text-gray-500">
                    <ImageIcon size={48} className="opacity-20 group-hover:text-cyber-green transition-colors" />
                    <p className="text-sm font-mono">Drag & drop or click to initialize</p>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                />
              </div>

              {imageMeta && mode === 'encode' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-gray-500">Payload Capacity</span>
                    <span className={capacityPercent > 100 ? "text-red-400" : "text-cyber-green"}>
                      {payloadSize} / {imageMeta.maxBytes} B ({capacityPercent.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-cyber-border">
                    <div 
                      className={cn(
                        "h-full transition-all duration-300",
                        capacityPercent > 100 ? "bg-red-500" : capacityPercent > 80 ? "bg-yellow-500" : "bg-cyber-green"
                      )}
                      style={{ width: `${Math.min(100, capacityPercent)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-xs font-mono text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <Layers size={14} /> Color Channel
                </label>
                <select 
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as Channel)}
                  className="w-full bg-black/40 border border-cyber-border rounded-xl px-4 py-2.5 font-mono text-sm text-white focus:outline-none focus:border-cyber-green/50 transition-colors"
                >
                  <option value="red">Red (R)</option>
                  <option value="green">Green (G)</option>
                  <option value="blue">Blue (B)</option>
                  <option value="alpha">Alpha (A)</option>
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-mono text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <BarChart size={14} /> LSB Plane
                </label>
                <select 
                  value={lsbPlane}
                  onChange={(e) => setLsbPlane(parseInt(e.target.value))}
                  className="w-full bg-black/40 border border-cyber-border rounded-xl px-4 py-2.5 font-mono text-sm text-white focus:outline-none focus:border-cyber-green/50 transition-colors"
                >
                  {[0, 1, 2, 3, 4, 5, 6, 7].map(plane => (
                    <option key={plane} value={plane}>Bit {plane} {plane === 0 ? '(Least)' : plane === 7 ? '(Most)' : ''}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Content based on Mode */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {mode === 'encode' && (
              <motion.div
                key="encode"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-cyber-card border border-cyber-border rounded-2xl p-6 space-y-6"
              >
                <div className="space-y-4">
                  <label className="text-xs font-mono text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <Fingerprint size={14} /> Payload Data
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter secret message to inject..."
                    className="w-full h-32 bg-black/40 border border-cyber-border rounded-xl px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-cyber-green/50 transition-colors resize-none"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-mono text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <Shield size={14} /> AES-256 Encryption Key (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter key to encrypt payload..."
                      className="w-full bg-black/40 border border-cyber-border rounded-xl pl-10 pr-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-cyber-green/50 transition-colors"
                    />
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                  </div>
                </div>

                <button
                  onClick={encodeMessage}
                  disabled={!image || !message || loading || capacityPercent > 100}
                  className="w-full bg-cyber-green/10 hover:bg-cyber-green/20 border border-cyber-green/30 disabled:opacity-50 text-cyber-green font-mono font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(0,255,0,0.1)] hover:shadow-[0_0_25px_rgba(0,255,0,0.2)]"
                >
                  {loading ? <RefreshCw className="animate-spin" size={18} /> : <Lock size={18} />}
                  INJECT PAYLOAD
                </button>
              </motion.div>
            )}

            {mode === 'decode' && (
              <motion.div
                key="decode"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-cyber-card border border-cyber-border rounded-2xl p-6 space-y-6"
              >
                <div className="space-y-4">
                  <label className="text-xs font-mono text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <Shield size={14} /> Decryption Key (If encrypted)
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter key to decrypt payload..."
                      className="w-full bg-black/40 border border-cyber-border rounded-xl pl-10 pr-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                    />
                    <Unlock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                  </div>
                </div>

                <button
                  onClick={decodeMessage}
                  disabled={!image || loading}
                  className="w-full bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 disabled:opacity-50 text-blue-400 font-mono font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(59,130,246,0.1)] hover:shadow-[0_0_25px_rgba(59,130,246,0.2)]"
                >
                  {loading ? <RefreshCw className="animate-spin" size={18} /> : <Unlock size={18} />}
                  EXTRACT PAYLOAD
                </button>

                {decodedMessage !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pt-4 border-t border-cyber-border"
                  >
                    <h3 className="text-sm font-mono text-blue-400 uppercase tracking-widest mb-3">Extracted Data</h3>
                    <div className="bg-black/60 border border-cyber-border rounded-xl p-4 font-mono text-white min-h-[100px] break-all">
                      {decodedMessage || <span className="text-red-400/50 italic">No valid payload detected.</span>}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {mode === 'analysis' && (
              <motion.div
                key="analysis"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-cyber-card border border-cyber-border rounded-2xl p-6 space-y-6"
              >
                <div className="flex gap-4">
                  <button
                    onClick={generateNoiseMap}
                    disabled={!image || loading}
                    className="flex-1 bg-black/40 hover:bg-black/60 border border-cyber-border disabled:opacity-50 text-gray-300 font-mono text-sm py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                  >
                    <Eye size={16} />
                    VIEW NOISE MAP
                  </button>
                  
                  {processedImage && (
                    <a 
                      href={processedImage} 
                      download="stego_matrix.png"
                      className="flex-1 bg-cyber-green/10 hover:bg-cyber-green/20 border border-cyber-green/30 text-cyber-green font-mono text-sm py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                    >
                      <Download size={16} />
                      EXPORT MATRIX
                    </a>
                  )}
                </div>

                <div className="pt-6 border-t border-cyber-border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Brain className="text-purple-400" size={20} />
                      <h3 className="text-sm font-bold text-white">Neural Steganalysis</h3>
                    </div>
                    <button
                      onClick={runAiAnalysis}
                      disabled={!image || isAnalyzing}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg text-xs font-mono transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAnalyzing ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          ANALYZING...
                        </>
                      ) : (
                        <>
                          <Activity size={14} />
                          RUN SCAN
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
                        <p className="text-xs font-mono text-purple-400 animate-pulse">Scanning matrix for LSB anomalies...</p>
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
                        <Activity className="text-gray-600 mb-2" size={24} />
                        <p className="text-xs font-mono text-gray-500">Initialize neural scan to detect steganographic signatures.</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
