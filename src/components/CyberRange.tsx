/* COPYRIGHT ALEN PEPA */
import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, Target, Zap, AlertTriangle, Terminal, 
  Play, Pause, RotateCcw, ChevronRight, CheckCircle2,
  Lock, Globe, Cpu, Activity, Bug, Server, Database,
  Wifi, HardDrive, Network, Unlock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { fetchAiGenerate } from '../lib/ai-fetch';

interface SimulationStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  logs: string[];
}

interface Scenario {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  steps: Omit<SimulationStep, 'status' | 'logs'>[];
}

const SCENARIOS: Scenario[] = [
  {
    id: 'apt',
    name: 'Advanced Persistent Threat (APT)',
    description: 'A long-term attack where an intruder gains access to a network and remains undetected.',
    icon: <Target size={16} />,
    color: 'text-red-500',
    steps: [
      { id: 'recon', title: 'Reconnaissance', description: 'Passive and active scanning of target infrastructure.' },
      { id: 'exploit', title: 'Initial Access', description: 'Exploiting identified vulnerabilities to gain a foothold.' },
      { id: 'persist', title: 'Persistence', description: 'Establishing long-term access to the compromised system.' },
      { id: 'exfil', title: 'Data Exfiltration', description: 'Identifying and extracting sensitive information.' },
    ]
  },
  {
    id: 'ransomware',
    name: 'Ransomware Outbreak',
    description: 'A fast-moving attack that encrypts files and demands a ransom for the decryption key.',
    icon: <Lock size={16} />,
    color: 'text-amber-500',
    steps: [
      { id: 'delivery', title: 'Payload Delivery', description: 'Delivering the ransomware binary via phishing or exploit.' },
      { id: 'execution', title: 'Execution', description: 'The ransomware starts encrypting files on the local disk.' },
      { id: 'lateral', title: 'Lateral Movement', description: 'Spreading to other machines on the network.' },
      { id: 'demand', title: 'Ransom Demand', description: 'Displaying the ransom note and locking the system.' },
    ]
  },
  {
    id: 'insider',
    name: 'Insider Threat',
    description: 'A malicious actor within the organization abusing their legitimate access.',
    icon: <Shield size={16} />,
    color: 'text-blue-500',
    steps: [
      { id: 'privesc', title: 'Privilege Escalation', description: 'Abusing legitimate access to gain higher permissions.' },
      { id: 'collection', title: 'Data Collection', description: 'Gathering sensitive internal documents and credentials.' },
      { id: 'staging', title: 'Staging', description: 'Preparing the collected data for unauthorized transfer.' },
      { id: 'leak', title: 'Data Leakage', description: 'Transferring data to an external, unauthorized location.' },
    ]
  },
  {
    id: 'ddos',
    name: 'DDoS Attack',
    description: 'Overwhelming a target service with a flood of internet traffic to disrupt operations.',
    icon: <Zap size={16} />,
    color: 'text-purple-500',
    steps: [
      { id: 'botnet', title: 'Botnet Activation', description: 'Activating a global network of compromised devices.' },
      { id: 'flood', title: 'Traffic Flood', description: 'Sending massive amounts of UDP/TCP traffic to the target.' },
      { id: 'exhaustion', title: 'Resource Exhaustion', description: 'Overwhelming the target server\'s CPU and memory.' },
      { id: 'outage', title: 'Service Outage', description: 'The target service becomes unavailable to legitimate users.' },
    ]
  }
];

export default function CyberRange() {
  const [activeScenario, setActiveScenario] = useState<Scenario>(SCENARIOS[0]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps, setSteps] = useState<SimulationStep[]>([]);
  const [stats, setStats] = useState({
    confidence: 0,
    successRate: 0,
    stealth: 'STABLE',
    payloadSize: '0 KB',
    encryptionRate: '0 MB/s',
    exfilSpeed: '0 Mbps'
  });

  useEffect(() => {
    setSteps(activeScenario.steps.map(s => ({ ...s, status: 'pending', logs: [] })));
    setStats({ 
      confidence: 0, 
      successRate: 0, 
      stealth: 'STABLE',
      payloadSize: '0 KB',
      encryptionRate: '0 MB/s',
      exfilSpeed: '0 Mbps'
    });
  }, [activeScenario]);

  const runSimulation = async () => {
    if (isSimulating) return;
    setIsSimulating(true);
    
    for (let i = 0; i < steps.length; i++) {
      setCurrentStepIndex(i);
      setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'running' } : s));
      
      // Update stats dynamically
      setStats({
        confidence: Math.floor(85 + Math.random() * 10),
        successRate: Math.floor(70 + (i / steps.length) * 25),
        stealth: i > 2 ? 'CRITICAL' : i > 1 ? 'WARNING' : 'STABLE',
        payloadSize: i > 0 ? `${(Math.random() * 5 + 1).toFixed(2)} MB` : '0 KB',
        encryptionRate: activeScenario.id === 'ransomware' && i > 1 ? `${(Math.random() * 50 + 20).toFixed(1)} MB/s` : '0 MB/s',
        exfilSpeed: (activeScenario.id === 'apt' || activeScenario.id === 'insider') && i > 2 ? `${(Math.random() * 100 + 50).toFixed(1)} Mbps` : '0 Mbps'
      });

      // Simulate AI-generated logs for each step
      try {
        const resData = await fetchAiGenerate({
          contents: [{ role: 'user', parts: [{ text: `Generate 5 technical log entries for a cybersecurity simulation step: ${steps[i].title}. 
          The scenario is: ${activeScenario.name}. Return as a JSON array of strings.` }] }],
          config: {
            responseMimeType: "application/json",
            systemInstruction: "You are a CyberSuite OS Simulation Engine. Generate realistic, technical security logs for training purposes. Return ONLY a JSON array of strings.",
          }
        });

        const newLogs = JSON.parse(resData.text || '[]');
        setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'completed', logs: newLogs } : s));
        await new Promise(r => setTimeout(r, 2000));
      } catch (error) {
        console.error("AI Log Generation Error:", error);
        const fallbackLogs: Record<string, string[]> = {
          'recon': [
            '[INFO] Initializing passive reconnaissance module...',
            '[SUCCESS] WHOIS data retrieved for target infrastructure.',
            '[INFO] Scanning for open subdomains via DNS enumeration...',
            '[SUCCESS] Identified 4 active subdomains: api.target.com, dev.target.com, mail.target.com, vpn.target.com',
            '[WARN] ICMP Echo requests are being filtered by edge firewall.'
          ],
          'exploit': [
            '[INFO] Analyzing dev.target.com for known vulnerabilities...',
            '[SUCCESS] Identified CVE-2024-21626 (runc container escape) on staging server.',
            '[INFO] Crafting specialized exploit payload...',
            '[SUCCESS] Initial foothold established via container escape.',
            '[INFO] Escalating privileges to root user...'
          ],
          'persist': [
            '[INFO] Deploying stealth persistence mechanism...',
            '[SUCCESS] Systemd service "sys-update.service" created and masked.',
            '[INFO] Establishing encrypted C2 channel via HTTPS/443...',
            '[SUCCESS] Heartbeat signal received from C2 server.',
            '[INFO] Cleaning up initial access artifacts...'
          ],
          'exfil': [
            '[INFO] Scanning filesystem for sensitive data patterns...',
            '[SUCCESS] Identified 1.2GB of encrypted database backups.',
            '[INFO] Compressing and encrypting exfiltration package...',
            '[SUCCESS] Data exfiltration complete via fragmented DNS tunneling.',
            '[SUCCESS] Simulation objective achieved: Full system compromise.'
          ],
          'delivery': [
            '[INFO] Crafting spear-phishing email with malicious attachment...',
            '[INFO] Sending email to 50 high-value targets...',
            '[SUCCESS] 12 users opened the email, 3 clicked the link.',
            '[INFO] Dropping ransomware binary "crypt_v2.exe" on victim machine.',
            '[SUCCESS] Payload delivery successful.'
          ],
          'execution': [
            '[INFO] Executing "crypt_v2.exe" with elevated privileges...',
            '[INFO] Scanning for local files with extensions: .docx, .pdf, .jpg, .xlsx...',
            '[SUCCESS] Found 14,203 target files.',
            '[INFO] Starting AES-256 encryption process...',
            '[SUCCESS] 85% of local files encrypted.'
          ],
          'lateral': [
            '[INFO] Scanning local network for SMB shares...',
            '[SUCCESS] Found 4 network drives: \\\\FS01, \\\\BACKUP, \\\\HR_DATA, \\\\FINANCE.',
            '[INFO] Attempting credential harvesting from memory...',
            '[SUCCESS] Domain Admin credentials recovered from LSASS.',
            '[INFO] Propagating ransomware to network shares...'
          ],
          'demand': [
            '[INFO] Generating unique decryption key for victim ID: 8829-X...',
            '[INFO] Replacing desktop wallpaper with ransom instructions...',
            '[SUCCESS] Ransom demand displayed: 5.0 BTC required.',
            '[INFO] Disabling system recovery and shadow copies...',
            '[SUCCESS] System locked. Simulation complete.'
          ],
          'privesc': [
            '[INFO] Analyzing current user permissions...',
            '[SUCCESS] Current user: j.doe (Domain User).',
            '[INFO] Searching for misconfigured services...',
            '[SUCCESS] Found unquoted service path in "PrintSpoolerV2".',
            '[INFO] Exploiting service path to gain SYSTEM access...'
          ],
          'collection': [
            '[INFO] Accessing Domain Controller via SYSTEM account...',
            '[SUCCESS] Dumping NTDS.dit database.',
            '[INFO] Searching for files containing "CONFIDENTIAL" or "SECRET"...',
            '[SUCCESS] Found 452 sensitive documents in /Internal/Project_X.',
            '[INFO] Harvesting browser cookies and saved passwords...'
          ],
          'staging': [
            '[INFO] Creating hidden staging directory in C:\\Windows\\Temp\\_sys_...',
            '[INFO] Compressing collected data into encrypted 7z archives...',
            '[SUCCESS] 4.5GB of data staged for exfiltration.',
            '[INFO] Splitting archives into 50MB chunks to avoid detection...',
            '[SUCCESS] Staging complete.'
          ],
          'leak': [
            '[INFO] Initializing data transfer to external FTP server...',
            '[INFO] Using fragmented HTTPS requests to bypass DLP...',
            '[SUCCESS] 2.1GB of data successfully transferred.',
            '[INFO] Deleting staging directory and clearing event logs...',
            '[SUCCESS] Data leakage complete. Insider threat simulation successful.'
          ],
          'botnet': [
            '[INFO] Sending activation signal to 15,000 global bots...',
            '[SUCCESS] 12,450 bots responded and are ready for deployment.',
            '[INFO] Synchronizing attack vectors: SYN Flood, UDP Flood, HTTP GET Flood...',
            '[SUCCESS] Botnet synchronized and waiting for target IP.'
          ],
          'flood': [
            '[INFO] Launching multi-vector flood against 203.0.113.45...',
            '[INFO] Current traffic volume: 450 Gbps.',
            '[SUCCESS] Target edge router CPU utilization at 98%.',
            '[INFO] Bypassing Cloudflare protection via direct IP targeting...',
            '[SUCCESS] Traffic flood reaching target origin server.'
          ],
          'exhaustion': [
            '[INFO] Target server (Nginx) connection pool exhausted.',
            '[INFO] Database (PostgreSQL) max_connections reached.',
            '[SUCCESS] Server response time increased to 45,000ms.',
            '[INFO] Kernel panic detected on target web server...',
            '[SUCCESS] Resource exhaustion achieved.'
          ],
          'outage': [
            '[INFO] Monitoring target service availability...',
            '[SUCCESS] Service status: 503 Service Unavailable.',
            '[INFO] Global monitoring nodes reporting 100% packet loss to target.',
            '[SUCCESS] DDoS objective achieved: Total service outage.',
            '[INFO] Maintaining flood to prevent recovery...'
          ]
        };
        
        const newLogs = fallbackLogs[steps[i].id] || ['[INFO] Processing simulation step...'];
        setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'completed', logs: newLogs } : s));
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    
    setIsSimulating(false);
  };

  const resetSimulation = () => {
    setIsSimulating(false);
    setCurrentStepIndex(0);
    setSteps(activeScenario.steps.map(s => ({ ...s, status: 'pending', logs: [] })));
    setStats({ 
      confidence: 0, 
      successRate: 0, 
      stealth: 'STABLE',
      payloadSize: '0 KB',
      encryptionRate: '0 MB/s',
      exfilSpeed: '0 Mbps'
    });
  };

  const outputEndRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (outputEndRef.current) {
      outputEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [steps]);

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] border border-[#222] rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-[#222] bg-[#111] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg bg-opacity-10", activeScenario.color.replace('text-', 'bg-'))}>
            {activeScenario.icon}
          </div>
          <div>
            <h2 className="text-sm font-mono uppercase tracking-widest text-white">Cyber Range Simulation</h2>
            <div className="flex items-center gap-2">
              <p className={cn("text-[10px] font-mono uppercase tracking-tighter", activeScenario.color)}>{activeScenario.name}</p>
              <span className="text-[10px] text-[#333]">|</span>
              <p className="text-[10px] font-mono text-[#555] uppercase tracking-tighter">Scenario Active</p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => !isSimulating && setActiveScenario(s)}
              disabled={isSimulating}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase tracking-wider border transition-all",
                activeScenario.id === s.id
                  ? "bg-white/10 border-white/20 text-white"
                  : "bg-transparent border-[#222] text-[#555] hover:border-[#333] hover:text-[#888]"
              )}
            >
              {s.name.split(' ')[0]}
            </button>
          ))}
          <div className="w-px h-8 bg-[#222] mx-2 hidden md:block" />
          <button 
            onClick={resetSimulation}
            className="p-2 hover:bg-[#222] rounded-lg text-[#555] transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button 
            onClick={runSimulation}
            disabled={isSimulating}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-[10px] uppercase tracking-widest transition-all",
              isSimulating 
                ? 'bg-red-500/10 text-red-500 border border-red-500/20 cursor-not-allowed' 
                : 'bg-red-500 text-white hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
            )}
          >
            {isSimulating ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {isSimulating ? 'SIMULATING...' : 'START SIMULATION'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Steps Sidebar */}
        <div className="w-64 border-r border-[#222] p-4 space-y-3 bg-[#0d0d0d] overflow-y-auto custom-scrollbar">
          <div className="mb-4">
            <h4 className="text-[9px] font-mono text-[#444] uppercase tracking-[0.2em] mb-2">Scenario Intel</h4>
            <p className="text-[10px] text-[#666] leading-relaxed italic">
              {activeScenario.description}
            </p>
          </div>
          
          <div className="h-px bg-[#222] my-4" />

          {steps.map((step, i) => (
            <div 
              key={step.id}
              className={cn(
                "p-3 rounded-lg border transition-all relative overflow-hidden",
                i === currentStepIndex && isSimulating 
                  ? 'bg-red-500/10 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                  : step.status === 'completed'
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-[#151515] border-[#222]'
              )}
            >
              {i === currentStepIndex && isSimulating && (
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/20 to-transparent"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
              )}
              <div className="flex items-center justify-between mb-1 relative z-10">
                <span className="text-[10px] font-mono text-[#555]">STEP 0{i + 1}</span>
                {step.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                {step.status === 'running' && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />}
              </div>
              <h3 className={cn(
                "text-xs font-bold relative z-10",
                i === currentStepIndex ? 'text-white' : 'text-[#888]'
              )}>
                {step.title}
              </h3>
              <p className="text-[9px] text-[#555] mt-1 leading-tight relative z-10">{step.description}</p>
            </div>
          ))}
        </div>

        {/* Log Viewer & Target System */}
        <div className="flex-1 flex flex-col bg-black p-6 font-mono overflow-hidden relative">
          {/* Cyber Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)] bg-[size:20px_20px] opacity-[0.03] pointer-events-none" />
          
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-2 text-[#555]">
              <Terminal className="w-4 h-4" />
              <span className="text-[10px] uppercase tracking-widest">Simulation Log Output</span>
            </div>
            {isSimulating && (
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                <span className="text-[9px] text-red-500 uppercase tracking-widest">Live Feed</span>
              </div>
            )}
          </div>
          
          <div className="flex-1 flex gap-6 overflow-hidden relative z-10">
            {/* Logs */}
            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
              {steps.flatMap(s => s.logs).length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-[#222]">
                  <Bug className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-[10px] uppercase tracking-[0.3em]">Awaiting simulation initialization...</p>
                </div>
              )}
              
              {steps.map((step, i) => (
                <div key={i} className="space-y-1">
                  {step.logs.map((log, j) => (
                    <motion.div 
                      key={j}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex gap-3 text-[11px] group"
                    >
                      <span className="text-[#333] shrink-0 group-hover:text-[#555] transition-colors">[{new Date().toLocaleTimeString()}]</span>
                      <span className={cn(
                        "transition-colors",
                        log.includes('SUCCESS') ? 'text-emerald-500 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]' :
                        log.includes('ERROR') ? 'text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]' :
                        log.includes('WARN') ? 'text-amber-500 drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]' : 'text-blue-400 drop-shadow-[0_0_5px_rgba(96,165,250,0.5)]'
                      )}>
                        {log}
                      </span>
                    </motion.div>
                  ))}
                </div>
              ))}
              
              {isSimulating && (
                <div className="flex gap-2 text-[11px] text-red-500 animate-pulse mt-2">
                  <span>_</span>
                  <span className="uppercase tracking-widest">Processing attack vector...</span>
                </div>
              )}
              <div ref={outputEndRef} />
            </div>

            {/* Target System Visualizer */}
            <div className="w-64 hidden lg:flex flex-col gap-4">
              <div className="p-4 bg-[#111] border border-[#222] rounded-xl flex-1 flex flex-col relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 opacity-50" />
                <h4 className="text-[9px] font-mono text-[#555] uppercase tracking-widest mb-4">Target Infrastructure</h4>
                
                <div className="flex-1 flex flex-col gap-3 justify-center">
                  {/* Firewall */}
                  <div className={cn(
                    "p-3 rounded-lg border flex items-center justify-between transition-all",
                    currentStepIndex > 0 || (currentStepIndex === 0 && steps[0]?.status === 'completed')
                      ? "bg-red-500/10 border-red-500/30 text-red-400"
                      : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  )}>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      <span className="text-[10px] uppercase">Edge Firewall</span>
                    </div>
                    {currentStepIndex > 0 ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  </div>

                  {/* Web Server */}
                  <div className={cn(
                    "p-3 rounded-lg border flex items-center justify-between transition-all",
                    currentStepIndex > 1 || (currentStepIndex === 1 && steps[1]?.status === 'completed')
                      ? "bg-red-500/10 border-red-500/30 text-red-400"
                      : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  )}>
                    <div className="flex items-center gap-2">
                      <Server className="w-4 h-4" />
                      <span className="text-[10px] uppercase">Web Server</span>
                    </div>
                    <Activity className={cn("w-3 h-3", currentStepIndex > 1 && "animate-pulse")} />
                  </div>

                  {/* Internal Network */}
                  <div className={cn(
                    "p-3 rounded-lg border flex items-center justify-between transition-all",
                    currentStepIndex > 2 || (currentStepIndex === 2 && steps[2]?.status === 'completed')
                      ? "bg-red-500/10 border-red-500/30 text-red-400"
                      : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  )}>
                    <div className="flex items-center gap-2">
                      <Network className="w-4 h-4" />
                      <span className="text-[10px] uppercase">Internal Network</span>
                    </div>
                    <Wifi className="w-3 h-3" />
                  </div>

                  {/* Database */}
                  <div className={cn(
                    "p-3 rounded-lg border flex items-center justify-between transition-all",
                    currentStepIndex > 3 || (currentStepIndex === 3 && steps[3]?.status === 'completed')
                      ? "bg-red-500/10 border-red-500/30 text-red-400"
                      : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  )}>
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      <span className="text-[10px] uppercase">Core Database</span>
                    </div>
                    <HardDrive className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-[#222] grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 relative z-10">
            <div className="p-3 bg-[#111] rounded-lg border border-[#222] group hover:border-blue-500/30 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <Cpu className="w-3 h-3 text-blue-500" />
                <span className="text-[9px] text-[#555] uppercase">AI Confidence</span>
              </div>
              <div className="text-sm font-bold text-white">{stats.confidence > 0 ? `${stats.confidence}.2%` : '---'}</div>
            </div>
            <div className="p-3 bg-[#111] rounded-lg border border-[#222] group hover:border-emerald-500/30 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-3 h-3 text-emerald-500" />
                <span className="text-[9px] text-[#555] uppercase">Success Rate</span>
              </div>
              <div className="text-sm font-bold text-white">{stats.successRate > 0 ? `${stats.successRate}.0%` : '---'}</div>
            </div>
            <div className="p-3 bg-[#111] rounded-lg border border-[#222] group hover:border-amber-500/30 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <Lock className="w-3 h-3 text-amber-500" />
                <span className="text-[9px] text-[#555] uppercase">Stealth Level</span>
              </div>
              <div className={cn(
                "text-sm font-bold",
                stats.stealth === 'CRITICAL' ? 'text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]' : 
                stats.stealth === 'WARNING' ? 'text-amber-500 drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]' :
                stats.stealth === 'STABLE' && stats.confidence > 0 ? 'text-emerald-500' : 'text-white'
              )}>
                {stats.confidence > 0 ? stats.stealth : '---'}
              </div>
            </div>
            <div className="p-3 bg-[#111] rounded-lg border border-[#222] group hover:border-purple-500/30 transition-colors hidden md:block">
              <div className="flex items-center gap-2 mb-1">
                <Bug className="w-3 h-3 text-purple-500" />
                <span className="text-[9px] text-[#555] uppercase">Payload Size</span>
              </div>
              <div className="text-sm font-bold text-white">{stats.payloadSize}</div>
            </div>
            <div className="p-3 bg-[#111] rounded-lg border border-[#222] group hover:border-cyan-500/30 transition-colors hidden lg:block">
              <div className="flex items-center gap-2 mb-1">
                <Lock className="w-3 h-3 text-cyan-500" />
                <span className="text-[9px] text-[#555] uppercase">Encrypt Rate</span>
              </div>
              <div className="text-sm font-bold text-white">{stats.encryptionRate}</div>
            </div>
            <div className="p-3 bg-[#111] rounded-lg border border-[#222] group hover:border-red-500/30 transition-colors hidden lg:block">
              <div className="flex items-center gap-2 mb-1">
                <Globe className="w-3 h-3 text-red-500" />
                <span className="text-[9px] text-[#555] uppercase">Exfil Speed</span>
              </div>
              <div className="text-sm font-bold text-white">{stats.exfilSpeed}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
