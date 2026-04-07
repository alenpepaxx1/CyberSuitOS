import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Terminal, 
  Shield, 
  Zap, 
  Search, 
  Database, 
  Globe, 
  Cpu, 
  Activity, 
  Lock, 
  Wifi, 
  Smartphone,
  ChevronRight,
  AlertTriangle,
  Loader2,
  Download,
  Play,
  FileCode,
  Layers,
  Crosshair,
  Filter,
  Trash2,
  Save,
  Maximize2,
  Minimize2,
  ExternalLink,
  Info,
  Bug,
  Radio,
  Key,
  HardDrive,
  Network
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { logToTerminal } from './Terminal';

interface ToolInfo {
  id: string;
  name: string;
  icon: any;
  description: string;
  category: 'Information Gathering' | 'Vulnerability Analysis' | 'Wireless Attacks' | 'Web Applications' | 'Exploitation Tools' | 'Stress Testing' | 'Forensics Tools' | 'Sniffing & Spoofing' | 'Password Attacks' | 'Maintaining Access' | 'Reverse Engineering';
  intelligence: string;
  commands: string[];
  kaliCategory: string;
  payloads?: string[];
  cves?: string[];
  complexity: 'Low' | 'Medium' | 'Advanced';
  risk: 'Low' | 'Medium' | 'High';
  stealth: 'Low' | 'Medium' | 'High';
}

const KALI_CATEGORIES = [
  { id: 'all', name: 'All Tools', icon: Shield },
  { id: '01-info-gathering', name: 'Information Gathering', icon: Globe },
  { id: '02-vulnerability-analysis', name: 'Vulnerability Analysis', icon: Search },
  { id: '03-webapp-analysis', name: 'Web Applications', icon: Layers },
  { id: '05-password-attacks', name: 'Password Attacks', icon: Lock },
  { id: '06-wireless-attacks', name: 'Wireless Attacks', icon: Wifi },
  { id: '07-reverse-engineering', name: 'Reverse Engineering', icon: Cpu },
  { id: '08-exploitation-tools', name: 'Exploitation Tools', icon: Crosshair },
  { id: '09-sniffing-spoofing', name: 'Sniffing & Spoofing', icon: Activity },
  { id: '10-maintaining-access', name: 'Maintaining Access', icon: Terminal },
];

const PEN_TOOLS: ToolInfo[] = [
  // Information Gathering
  {
    id: 'nmap',
    name: 'Nmap',
    icon: Globe,
    category: 'Information Gathering',
    kaliCategory: '01-info-gathering',
    description: 'Network exploration tool and security / port scanner.',
    intelligence: 'Advanced topology mapping and service version detection. Uses NSE scripts for vulnerability discovery.',
    commands: ['nmap -sV -sC -O target.com', 'nmap -T4 -A -v target.com'],
    cves: ['CVE-2023-1234', 'CVE-2022-4567'],
    payloads: ['-sS (TCP SYN scan)', '-sU (UDP scan)', '-p- (All ports)'],
    complexity: 'Advanced',
    risk: 'Medium',
    stealth: 'Medium'
  },
  {
    id: 'whois',
    name: 'Whois',
    icon: Search,
    category: 'Information Gathering',
    kaliCategory: '01-info-gathering',
    description: 'Client for the whois directory service.',
    intelligence: 'Retrieves registration data for domain names and IP address blocks.',
    commands: ['whois target.com'],
    complexity: 'Low',
    risk: 'Low',
    stealth: 'High'
  },
  {
    id: 'dnsrecon',
    name: 'DNSRecon',
    icon: Globe,
    category: 'Information Gathering',
    kaliCategory: '01-info-gathering',
    description: 'DNS Enumeration and Scanning Tool.',
    intelligence: 'Performs zone transfers, reverse lookups, and brute forcing of DNS records.',
    commands: ['dnsrecon -d target.com'],
    complexity: 'Medium',
    risk: 'Low',
    stealth: 'Medium'
  },
  // Vulnerability Analysis
  {
    id: 'nikto',
    name: 'Nikto',
    icon: Search,
    category: 'Vulnerability Analysis',
    kaliCategory: '02-vulnerability-analysis',
    description: 'Web server scanner that tests for dangerous files and outdated software.',
    intelligence: 'Scans for over 6700 potentially dangerous files/programs and checks for outdated versions of over 1250 servers.',
    commands: ['nikto -h http://target.com', 'nikto -h http://target.com -ssl'],
    cves: ['CVE-2021-3452', 'CVE-2020-11022'],
    complexity: 'Medium',
    risk: 'Medium',
    stealth: 'Low'
  },
  {
    id: 'sqlmap',
    name: 'sqlmap',
    icon: Database,
    category: 'Web Applications',
    kaliCategory: '03-webapp-analysis',
    description: 'Automatic SQL injection and database takeover tool.',
    intelligence: 'Advanced heuristic engine for blind SQLi detection. Capable of fingerprinting DBMS, fetching data, and accessing underlying file systems.',
    commands: ['sqlmap -u "http://target.com/id=1" --dbs', 'sqlmap -u "http://target.com/id=1" --os-shell'],
    payloads: ['--level=5 --risk=3', '--tamper=space2comment', '--dump-all'],
    complexity: 'Advanced',
    risk: 'High',
    stealth: 'Low'
  },
  // Wireless Attacks
  {
    id: 'aircrack-ng',
    name: 'Aircrack-ng',
    icon: Wifi,
    category: 'Wireless Attacks',
    kaliCategory: '06-wireless-attacks',
    description: 'Complete suite of tools to assess WiFi network security.',
    intelligence: 'Focuses on different areas of WiFi security: Monitoring, Attacking, Testing, and Cracking (WEP and WPA-PSK).',
    commands: ['airmon-ng start wlan0', 'airodump-ng wlan0mon', 'aircrack-ng -w wordlist.txt capture.cap'],
    payloads: ['aireplay-ng -0 10 -a <BSSID> wlan0mon'],
    complexity: 'Advanced',
    risk: 'Medium',
    stealth: 'Medium'
  },
  // Exploitation Tools
  {
    id: 'metasploit',
    name: 'Metasploit',
    icon: Crosshair,
    category: 'Exploitation Tools',
    kaliCategory: '08-exploitation-tools',
    description: 'World\'s most used penetration testing framework.',
    intelligence: 'Modular exploit delivery system. Integrated with database for session management and post-exploitation modules.',
    commands: ['msfconsole', 'use exploit/multi/handler', 'set PAYLOAD windows/meterpreter/reverse_tcp'],
    payloads: ['windows/x64/meterpreter/reverse_https', 'linux/x64/shell/reverse_tcp'],
    cves: ['CVE-2017-0144 (EternalBlue)', 'CVE-2019-0708 (BlueKeep)'],
    complexity: 'Advanced',
    risk: 'High',
    stealth: 'Low'
  },
  {
    id: 'beef',
    name: 'BeEF',
    icon: Layers,
    category: 'Exploitation Tools',
    kaliCategory: '08-exploitation-tools',
    description: 'The Browser Exploitation Framework.',
    intelligence: 'Focuses on the web browser, allowing for client-side attack vectors.',
    commands: ['beef-xss'],
    payloads: ['Hook Browser', 'Social Engineering Redirect'],
    complexity: 'Medium',
    risk: 'High',
    stealth: 'Medium'
  },
  // Sniffing & Spoofing
  {
    id: 'wireshark',
    name: 'Wireshark',
    icon: Activity,
    category: 'Sniffing & Spoofing',
    kaliCategory: '09-sniffing-spoofing',
    description: 'The world\'s foremost network protocol analyzer.',
    intelligence: 'Deep inspection of hundreds of protocols. Live capture and offline analysis with powerful display filters.',
    commands: ['wireshark', 'tshark -i eth0 -w capture.pcap'],
    complexity: 'Advanced',
    risk: 'Low',
    stealth: 'High'
  },
  {
    id: 'bettercap',
    name: 'Bettercap',
    icon: Zap,
    category: 'Sniffing & Spoofing',
    kaliCategory: '09-sniffing-spoofing',
    description: 'The Swiss Army knife for 802.11, BLE and Ethernet networks reconnaissance and MITM attacks.',
    intelligence: 'Modular and extensible tool for network attacks.',
    commands: ['bettercap -iface eth0'],
    payloads: ['net.probe on', 'arp.spoof on'],
    complexity: 'Advanced',
    risk: 'Medium',
    stealth: 'Medium'
  },
  // Password Attacks
  {
    id: 'john-the-ripper',
    name: 'John the Ripper',
    icon: Lock,
    category: 'Password Attacks',
    kaliCategory: '05-password-attacks',
    description: 'Fast password cracker.',
    intelligence: 'Auto-detects hash types and uses optimized assembly code for maximum performance. Supports custom rules and wordlists.',
    commands: ['john --wordlist=pass.txt hashes.txt', 'john --format=sha512crypt hashes.txt'],
    complexity: 'Medium',
    risk: 'Low',
    stealth: 'High'
  },
  {
    id: 'hashcat',
    name: 'Hashcat',
    icon: FileCode,
    category: 'Password Attacks',
    kaliCategory: '05-password-attacks',
    description: 'The world\'s fastest and most advanced password recovery utility.',
    intelligence: 'GPU-accelerated cracking engine. Supports over 300 hashing algorithms and advanced attack modes like mask and hybrid.',
    commands: ['hashcat -m 0 hashes.txt wordlist.txt', 'hashcat -a 3 -m 1000 hashes.txt ?a?a?a?a?a?a?a?a'],
    complexity: 'Advanced',
    risk: 'Low',
    stealth: 'High'
  },
  {
    id: 'hydra',
    name: 'Hydra',
    icon: Zap,
    category: 'Password Attacks',
    kaliCategory: '05-password-attacks',
    description: 'Parallelized login cracker.',
    intelligence: 'High-speed network login cracker. Supports over 50 protocols including SSH, FTP, HTTP, SMB, and VNC.',
    commands: ['hydra -l admin -P pass.txt target.com ssh', 'hydra -L users.txt -P pass.txt target.com http-post-form "/login:user=^USER^&pass=^PASS^:F=Login failed"'],
    complexity: 'Medium',
    risk: 'Medium',
    stealth: 'Medium'
  },
  // Maintaining Access
  {
    id: 'powersploit',
    name: 'PowerSploit',
    icon: Terminal,
    category: 'Maintaining Access',
    kaliCategory: '10-maintaining-access',
    description: 'A collection of Microsoft PowerShell modules that can be used to aid penetration testers.',
    intelligence: 'Provides post-exploitation capabilities for Windows environments.',
    commands: ['Import-Module PowerSploit.psm1'],
    complexity: 'Medium',
    risk: 'High',
    stealth: 'Medium'
  },
  // Reverse Engineering
  {
    id: 'ghidra',
    name: 'Ghidra',
    icon: Cpu,
    category: 'Reverse Engineering',
    kaliCategory: '07-reverse-engineering',
    description: 'A software reverse engineering (SRE) suite of tools developed by NSA\'s Research Directorate.',
    intelligence: 'Includes a decompiler, graph view, and scripting capabilities.',
    commands: ['ghidraRun'],
    complexity: 'Advanced',
    risk: 'Low',
    stealth: 'High'
  }
];

const MAN_PAGES: Record<string, string> = {
  nmap: 'NMAP(1) - Network exploration tool and security scanner. Usage: nmap [Scan Type...] [Options] {target specification}',
  sqlmap: 'SQLMAP(1) - Automatic SQL injection and database takeover tool. Usage: sqlmap [options]',
  metasploit: 'MSFCONSOLE(1) - Metasploit Framework Console. Usage: msfconsole [options]',
  nikto: 'NIKTO(1) - Web server security scanner. Usage: nikto -h <host> [options]',
  'aircrack-ng': 'AIRCRACK-NG(1) - 802.11 WEP and WPA-PSK keys cracking program. Usage: aircrack-ng [options] <.cap / .ivs file(s)>',
  hydra: 'HYDRA(1) - A very fast network logon cracker. Usage: hydra [[[-l LOGIN|-L FILE] [-p PASS|-P FILE]] | [-C FILE]] [-e nsr] [-o FILE] [-t TASKS] [-M FILE [-T TASKS]] [-w TIME] [-W TIME] [-f] [-s PORT] [-x MIN:MAX:CHARSET] [-u] [-vV] [-l LOGIN] [-p PASS] [-s PORT] [service://server[:PORT][/OPT]]',
  hashcat: 'HASHCAT(1) - Advanced password recovery utility. Usage: hashcat [options]... hash|hashfile|hcstat2 [dictionary|mask|directory]...',
  wireshark: 'WIRESHARK(1) - Interactively dump and analyze network traffic. Usage: wireshark [options] ...',
  bettercap: 'BETTERCAP(1) - The Swiss Army knife for network reconnaissance and MITM attacks. Usage: bettercap [options]',
  beef: 'BEEF(1) - Browser Exploitation Framework. Usage: beef-xss [options]',
  john: 'JOHN(1) - John the Ripper password cracker. Usage: john [options] [path to hash file]',
  ghidra: 'GHIDRA(1) - Software reverse engineering suite. Usage: ghidraRun',
  powersploit: 'POWERSPLOIT(1) - PowerShell Post-Exploitation Framework. Usage: Import-Module PowerSploit.psm1',
  whois: 'WHOIS(1) - Client for the whois directory service. Usage: whois [options] name',
  dnsrecon: 'DNSRECON(1) - DNS Enumeration and Scanning Tool. Usage: dnsrecon [options]'
};

const TOOL_STEPS: Record<string, string[]> = {
  nmap: [
    'Initializing Nmap 7.94...',
    'Performing ARP ping scan...',
    'Scanning 65535 ports (TCP SYN)...',
    'Service detection (NSE scripts)...',
    'OS fingerprinting via TCP/IP stack...',
    'Aggregating results into XML report.'
  ],
  sqlmap: [
    'Testing connection to target URL...',
    'Checking for WAF/IPS/IDS protection...',
    'Heuristic test for SQL injection...',
    'Testing boolean-based blind injection...',
    'Extracting database banner...',
    'Enumerating database schemas...'
  ],
  metasploit: [
    'Starting Metasploit Framework Console...',
    'Loading modules and plugins...',
    'Setting up reverse handler...',
    'Generating staged payload...',
    'Attempting exploit delivery...',
    'Waiting for session check-in...'
  ],
  nikto: [
    'Connecting to web server port...',
    'Checking for common sensitive files...',
    'Testing for outdated server headers...',
    'Scanning for XSS vulnerabilities...',
    'Verifying SSL/TLS configuration...',
    'Compiling vulnerability report.'
  ]
};

const VULNERABILITY_DB: Record<string, any[]> = {
  '192.168.1.10': [
    { title: 'CVE-2023-21036', desc: 'Aclir vulnerability in Android kernel.', sev: 'HIGH' },
    { title: 'SSH-Weak-MAC', desc: 'Target supports weak Message Authentication Code algorithms.', sev: 'MEDIUM' }
  ],
  '192.168.1.13': [
    { title: 'CVE-2017-0144', desc: 'EternalBlue SMB Remote Code Execution.', sev: 'CRITICAL' },
    { title: 'MS17-010', desc: 'WannaCry ransomware entry point.', sev: 'CRITICAL' }
  ],
  'default': [
    { title: 'CVE-2024-1234', desc: 'Remote Code Execution via buffer overflow.', sev: 'CRITICAL' },
    { title: 'Insecure Auth', desc: 'Weak password hashing detected.', sev: 'HIGH' }
  ]
};

interface ScanResult {
  id: string;
  toolId: string;
  target: string;
  timestamp: string;
  logs: string[];
  vulnerabilities: any[];
}

export default function PenetrationTools() {
  const [selectedTool, setSelectedTool] = useState<ToolInfo>(PEN_TOOLS[0]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisLogs, setAnalysisLogs] = useState<string[]>([]);
  const [target, setTarget] = useState('');
  const [workspace, setWorkspace] = useState<ScanResult[]>([]);
  const [isTerminalMaximized, setIsTerminalMaximized] = useState(false);
  const [terminalInput, setTerminalInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredTools = activeCategory === 'all' 
    ? PEN_TOOLS 
    : PEN_TOOLS.filter(t => t.kaliCategory === activeCategory);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [analysisLogs]);

  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'cmd' | 'output' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    let prefix = '➜';
    if (type === 'cmd') prefix = 'kali@root:~$';
    if (type === 'output') prefix = '';
    
    setAnalysisLogs(prev => [...prev, `${prefix} ${message}`]);
  };

  const executeTool = (tool: ToolInfo, customTarget?: string, options: { payload?: string; flags?: string[] } = {}) => {
    const finalTarget = customTarget || target;
    if (!finalTarget) {
      addLog('Error: Target required. Use "set target <ip>" or provide target in HUD.', 'error');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    addLog(`Initializing ${tool.name} framework...`, 'info');
    if (options.payload) addLog(`Staging payload: ${options.payload}`, 'info');
    if (options.flags && options.flags.length > 0) addLog(`Applying flags: ${options.flags.join(' ')}`, 'info');
    
    const defaultSteps = [
      `Loading modules for ${tool.category}...`,
      `Resolving target: ${finalTarget}`,
      `Starting reconnaissance phase...`,
      `Scanning for service fingerprints...`,
      `Injecting advanced intelligence payloads...`,
      `Analyzing protocol state machine...`,
      `Correlating with global CVE database...`,
      `Identifying exploitation vectors...`,
      `Generating post-exploitation report...`,
      `Analysis complete. Results saved to workspace.`
    ];

    const steps = TOOL_STEPS[tool.id] || defaultSteps;

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        addLog(steps[currentStep], 'info');
        setAnalysisProgress((currentStep + 1) * (100 / steps.length));
        currentStep++;
      } else {
        clearInterval(interval);
        setIsAnalyzing(false);
        
        const newResult: ScanResult = {
          id: Math.random().toString(36).substr(2, 9),
          toolId: tool.id,
          target: finalTarget,
          timestamp: new Date().toISOString(),
          logs: [...analysisLogs],
          vulnerabilities: VULNERABILITY_DB[finalTarget] || VULNERABILITY_DB['default']
        };
        setWorkspace(prev => [newResult, ...prev]);
        logToTerminal(`${tool.name} analysis complete on ${finalTarget}.`, 'success');
      }
    }, 800);
  };

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    const rawInput = terminalInput.trim();
    setCommandHistory(prev => [rawInput, ...prev]);
    setHistoryIndex(-1);
    addLog(rawInput, 'cmd');
    setTerminalInput('');

    const parts = rawInput.split(' ');
    const baseCmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    // Advanced argument parsing
    const options: { target?: string; payload?: string; flags: string[] } = { flags: [] };
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '-t' || args[i] === '--target') {
        options.target = args[i + 1];
        i++;
      } else if (args[i] === '-p' || args[i] === '--payload') {
        options.payload = args[i + 1];
        i++;
      } else if (args[i].startsWith('-')) {
        options.flags.push(args[i]);
      }
    }

    switch (baseCmd) {
      case 'help':
        addLog('Available commands:', 'output');
        addLog('  help              - Show this help menu', 'output');
        addLog('  clear             - Clear terminal screen', 'output');
        addLog('  ls                - List available tools', 'output');
        addLog('  man <tool>        - Show manual for a tool', 'output');
        addLog('  set target <val>  - Set global target', 'output');
        addLog('  run <tool_id>     - Execute a specific tool', 'output');
        addLog('  ps                - List active processes', 'output');
        addLog('  cat <file>        - View file content (simulated)', 'output');
        addLog('  ifconfig          - Show network interface info', 'output');
        addLog('  whoami            - Display current user info', 'output');
        addLog('  exit              - Reset terminal session', 'output');
        break;
      case 'clear':
        setAnalysisLogs([]);
        break;
      case 'ls':
        addLog('Available Penetration Tools:', 'output');
        PEN_TOOLS.forEach(t => addLog(`  - ${t.id.padEnd(15)} [${t.category}]`, 'output'));
        break;
      case 'man':
        const manTool = args[0];
        if (MAN_PAGES[manTool]) {
          addLog(MAN_PAGES[manTool], 'output');
        } else {
          addLog(`No manual entry for ${manTool}`, 'error');
        }
        break;
      case 'set':
        if (args[0] === 'target' && args[1]) {
          setTarget(args[1]);
          addLog(`Target set to: ${args[1]}`, 'success');
        } else {
          addLog('Usage: set target <ip_or_domain>', 'error');
        }
        break;
      case 'run':
        const toolId = args[0];
        const tool = PEN_TOOLS.find(t => t.id === toolId);
        if (tool) {
          executeTool(tool, options.target, { payload: options.payload, flags: options.flags });
        } else {
          addLog(`Tool not found: ${toolId}. Use "ls" to see available tools.`, 'error');
        }
        break;
      case 'ps':
        addLog('PID   TTY      TIME     CMD', 'output');
        addLog('1     tty1     00:00:01 systemd', 'output');
        addLog('42    tty1     00:00:05 kali-suite-advanced', 'output');
        if (isAnalyzing) {
          addLog(`1337  tty1     00:00:02 ${selectedTool.id} (ANALYZING)`, 'output');
        }
        break;
      case 'cat':
        if (args[0] === '/etc/passwd') {
          addLog('root:x:0:0:root:/root:/bin/bash', 'output');
          addLog('kali:x:1000:1000:kali,,,:/home/kali:/bin/bash', 'output');
        } else if (args[0] === 'version.txt') {
          addLog('KALI-SUITE ADVANCED v2.0.4-stable', 'output');
        } else {
          addLog(`cat: ${args[0]}: No such file or directory`, 'error');
        }
        break;
      case 'ifconfig':
      case 'ip':
        addLog('eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500', 'output');
        addLog('        inet 10.0.2.15  netmask 255.255.255.0  broadcast 10.0.2.255', 'output');
        addLog('        ether 08:00:27:8d:c0:4d  txqueuelen 1000  (Ethernet)', 'output');
        addLog('lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536', 'output');
        addLog('        inet 127.0.0.1  netmask 255.0.0.0', 'output');
        break;
      case 'whoami':
        addLog('root@kali-suite-advanced', 'output');
        break;
      case 'exit':
        setAnalysisLogs(['Terminal reset. Type "help" for commands.']);
        break;
      default:
        // Check if it's a tool ID directly
        const directTool = PEN_TOOLS.find(t => t.id === baseCmd);
        if (directTool) {
          executeTool(directTool, options.target, { payload: options.payload, flags: options.flags });
        } else {
          addLog(`Command not found: ${baseCmd}. Type "help" for a list of commands.`, 'error');
        }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const input = terminalInput.trim().toLowerCase();
      if (!input) return;

      const matches = PEN_TOOLS.filter(t => t.id.startsWith(input)).map(t => t.id);
      const cmdMatches = ['help', 'clear', 'ls', 'man', 'set', 'run', 'ps', 'cat', 'ifconfig', 'whoami', 'exit'].filter(c => c.startsWith(input));
      
      const allMatches = [...matches, ...cmdMatches];
      if (allMatches.length === 1) {
        setTerminalInput(allMatches[0]);
      } else if (allMatches.length > 1) {
        addLog(allMatches.join('  '), 'output');
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setTerminalInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setTerminalInput(commandHistory[newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setTerminalInput('');
      }
    }
  };

  const runAnalysis = () => {
    executeTool(selectedTool);
  };

  const clearWorkspace = () => {
    setWorkspace([]);
    logToTerminal('Workspace cleared.', 'info');
  };

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Header HUD */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
            <Shield className="text-red-500 w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-cyber-header tracking-tight">KALI-SUITE ADVANCED</h1>
            <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-500/60 uppercase tracking-widest">
              <span className="animate-pulse">●</span>
              <span>Intelligence Analysis Framework v2.0</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-green/50" size={16} />
            <input 
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="TARGET_IP_OR_DOMAIN"
              className="w-full bg-black/60 border border-cyber-border rounded-xl pl-10 pr-4 py-3 text-sm font-mono text-cyber-header focus:outline-none focus:border-red-500/50 transition-all shadow-inner"
            />
          </div>
          <button
            onClick={runAnalysis}
            disabled={isAnalyzing}
            className={cn(
              "px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all uppercase tracking-widest",
              isAnalyzing 
                ? "bg-black/60 text-red-500/30 border border-red-500/10 cursor-not-allowed" 
                : "bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
            )}
          >
            {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
            {isAnalyzing ? 'RUNNING...' : 'EXECUTE'}
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        {/* Left Sidebar - Categories & Tools */}
        <div className="lg:col-span-3 flex flex-col gap-4 min-h-0">
          {/* Category Filter */}
          <div className="bg-cyber-card border border-white/5 rounded-2xl p-2 flex flex-col gap-1 overflow-y-auto custom-scrollbar max-h-[300px]">
            <div className="px-3 py-2 text-[10px] font-mono text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Filter size={12} />
              Categories
            </div>
            {KALI_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-all text-left",
                  activeCategory === cat.id 
                    ? "bg-red-500/10 text-red-500 font-bold border border-red-500/20" 
                    : "text-cyber-text/60 hover:bg-white/5"
                )}
              >
                <cat.icon size={14} />
                <span className="truncate">{cat.name}</span>
              </button>
            ))}
          </div>

          {/* Tool List */}
          <div className="flex-1 bg-cyber-card border border-white/5 rounded-2xl p-2 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
            <div className="px-3 py-2 text-[10px] font-mono text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Terminal size={12} />
              Tools ({filteredTools.length})
            </div>
            {filteredTools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setSelectedTool(tool)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl transition-all text-left group",
                  selectedTool.id === tool.id 
                    ? "bg-white/5 border border-white/10 text-cyber-header shadow-lg" 
                    : "text-cyber-text/60 hover:bg-white/5"
                )}
              >
                <div className={cn(
                  "p-2 rounded-lg transition-colors",
                  selectedTool.id === tool.id ? "bg-red-500/20 text-red-500" : "bg-black/40 group-hover:text-cyber-header"
                )}>
                  <tool.icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate">{tool.name}</div>
                  <div className="text-[10px] uppercase tracking-wider opacity-50">{tool.category}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Workspace Area */}
        <div className="lg:col-span-9 flex flex-col gap-6 min-h-0">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 flex-1 min-h-0">
            {/* Tool Details & Intelligence */}
            <div className="flex flex-col gap-6 min-h-0 overflow-y-auto custom-scrollbar pr-2">
              <div className="bg-cyber-card border border-white/5 rounded-2xl p-6 relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <selectedTool.icon size={120} />
                </div>
                <div className="relative z-10 flex gap-6 items-start">
                  <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20">
                    <selectedTool.icon size={48} className="text-red-500" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h2 className="text-2xl font-bold text-cyber-header">{selectedTool.name}</h2>
                    <p className="text-cyber-text/80 text-sm leading-relaxed">{selectedTool.description}</p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {selectedTool.commands.map((cmd, i) => (
                        <code key={i} className="px-3 py-1 bg-black/40 border border-white/5 rounded text-[10px] font-mono text-cyber-green/80">
                          {cmd}
                        </code>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-cyber-card border border-white/5 rounded-2xl p-6 space-y-4 shrink-0">
                <div className="flex items-center gap-2 text-cyber-header font-bold text-sm uppercase tracking-widest">
                  <Info size={16} className="text-blue-500" />
                  Advanced Intelligence Analysis
                </div>
                <div className="p-4 bg-black/40 border border-white/5 rounded-xl font-mono text-xs leading-relaxed text-cyber-text/70">
                  {selectedTool.intelligence}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="text-[10px] text-gray-500 uppercase mb-1">Complexity</div>
                    <div className="text-sm font-bold text-cyber-header">{selectedTool.complexity}</div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="text-[10px] text-gray-500 uppercase mb-1">Risk Level</div>
                    <div className={cn(
                      "text-sm font-bold",
                      selectedTool.risk === 'High' ? "text-red-500" : 
                      selectedTool.risk === 'Medium' ? "text-amber-500" : "text-emerald-500"
                    )}>
                      {selectedTool.risk}
                    </div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="text-[10px] text-gray-500 uppercase mb-1">Stealth</div>
                    <div className={cn(
                      "text-sm font-bold",
                      selectedTool.stealth === 'High' ? "text-emerald-500" : 
                      selectedTool.stealth === 'Medium' ? "text-amber-500" : "text-red-500"
                    )}>
                      {selectedTool.stealth}
                    </div>
                  </div>
                </div>
              </div>

              {/* Advanced Intelligence Modules */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-cyber-card border border-white/5 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-2 text-cyber-header font-bold text-sm uppercase tracking-widest">
                    <Bug size={16} className="text-red-500" />
                    Relevant CVE Intelligence
                  </div>
                  <div className="space-y-3">
                    {selectedTool.cves ? selectedTool.cves.map((cve, i) => (
                      <div key={i} className="p-3 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between group hover:border-red-500/30 transition-all">
                        <div className="text-xs font-mono text-cyber-header">{cve}</div>
                        <button className="text-[10px] text-blue-500 hover:underline flex items-center gap-1">
                          <ExternalLink size={10} /> NIST
                        </button>
                      </div>
                    )) : (
                      <div className="text-[10px] text-gray-500 italic p-4 text-center">No specific CVEs mapped for this tool.</div>
                    )}
                  </div>
                </div>

                <div className="bg-cyber-card border border-white/5 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-2 text-cyber-header font-bold text-sm uppercase tracking-widest">
                    <Zap size={16} className="text-amber-500" />
                    Available Exploit Payloads
                  </div>
                  <div className="space-y-3">
                    {selectedTool.payloads ? selectedTool.payloads.map((payload, i) => (
                      <div key={i} className="p-3 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between group hover:border-amber-500/30 transition-all">
                        <div className="text-[10px] font-mono text-cyber-text/80 truncate mr-2">{payload}</div>
                        <button 
                          onClick={() => {
                            setTerminalInput(`run ${selectedTool.id} ${payload}`);
                            inputRef.current?.focus();
                          }}
                          className="text-[10px] text-amber-500 hover:underline flex items-center gap-1 shrink-0"
                        >
                          <Play size={10} /> LOAD
                        </button>
                      </div>
                    )) : (
                      <div className="text-[10px] text-gray-500 italic p-4 text-center">No custom payloads defined.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Network Topology Map (Simulated) */}
              <div className="bg-cyber-card border border-white/5 rounded-2xl p-6 space-y-4 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-cyber-header font-bold text-sm uppercase tracking-widest">
                    <Network size={16} className="text-emerald-500" />
                    Target Network Topology
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-[8px] text-emerald-500/60">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> ACTIVE
                    </div>
                    <div className="flex items-center gap-1 text-[8px] text-red-500/60">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500" /> VULNERABLE
                    </div>
                  </div>
                </div>
                <div className="h-48 bg-black/40 border border-white/5 rounded-xl relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                  </div>
                  
                  <div className="relative w-full h-full flex items-center justify-center">
                    {/* Central Node */}
                    <motion.div 
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 4, repeat: Infinity }}
                      className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center z-10 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                    >
                      <Globe size={20} className="text-emerald-500" />
                    </motion.div>

                    {/* Surrounding Nodes */}
                    {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.2 }}
                        className="absolute"
                        style={{
                          transform: `rotate(${angle}deg) translate(80px) rotate(-${angle}deg)`
                        }}
                        onClick={() => {
                          const newTarget = `192.168.1.${10 + i}`;
                          setTarget(newTarget);
                          addLog(`Target updated via topology: ${newTarget}`, 'info');
                        }}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg border flex items-center justify-center shadow-lg transition-all hover:scale-110 cursor-pointer",
                          i % 3 === 0 ? "bg-red-500/20 border-red-500/50 text-red-500" : "bg-white/5 border-white/10 text-gray-500"
                        )}>
                          {i % 2 === 0 ? <HardDrive size={14} /> : <Smartphone size={14} />}
                        </div>
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[6px] font-mono whitespace-nowrap opacity-40">
                          192.168.1.{10 + i}
                        </div>
                      </motion.div>
                    ))}

                    {/* Connection Lines */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                      {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                        <line
                          key={i}
                          x1="50%"
                          y1="50%"
                          x2={`${50 + 35 * Math.cos(angle * Math.PI / 180)}%`}
                          y2={`${50 + 35 * Math.sin(angle * Math.PI / 180)}%`}
                          stroke="currentColor"
                          strokeWidth="1"
                          className="text-emerald-500"
                        />
                      ))}
                    </svg>
                  </div>
                </div>
              </div>

              {/* Workspace History */}
              <div className="bg-cyber-card border border-white/5 rounded-2xl p-6 space-y-4 flex-1 min-h-0 flex flex-col">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-cyber-header font-bold text-sm uppercase tracking-widest">
                    <Save size={16} className="text-emerald-500" />
                    Workspace History
                  </div>
                  <button 
                    onClick={clearWorkspace}
                    className="text-[10px] text-red-500/60 hover:text-red-500 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 size={12} />
                    CLEAR ALL
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                  {workspace.length > 0 ? (
                    workspace.map((res) => (
                      <div key={res.id} className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-2 group hover:border-emerald-500/30 transition-all">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-xs font-bold text-cyber-header">{res.toolId.toUpperCase()} @ {res.target}</div>
                            <div className="text-[10px] text-gray-500 font-mono">{new Date(res.timestamp).toLocaleString()}</div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded">SUCCESS</span>
                        </div>
                        <div className="flex gap-2">
                          <button className="text-[10px] text-blue-500 hover:underline flex items-center gap-1">
                            <Maximize2 size={10} /> VIEW LOGS
                          </button>
                          <button className="text-[10px] text-emerald-500 hover:underline flex items-center gap-1">
                            <Download size={10} /> EXPORT
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-4">
                      <Database size={48} className="opacity-20" />
                      <p className="text-xs italic">No scan history in current workspace.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Advanced Terminal View */}
            <div className={cn(
              "bg-black/90 border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-2xl transition-all duration-500",
              isTerminalMaximized ? "fixed inset-10 z-50" : "relative"
            )}>
              <div className="bg-white/5 px-4 py-2 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                  </div>
                  <span className="text-[10px] font-mono text-gray-400 ml-4">root@kali-suite:~/{selectedTool.id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsTerminalMaximized(!isTerminalMaximized)}
                    className="p-1 hover:bg-white/10 rounded transition-colors text-gray-400"
                  >
                    {isTerminalMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                  </button>
                  <button className="p-1 hover:bg-white/10 rounded transition-colors text-gray-400">
                    <ExternalLink size={14} />
                  </button>
                </div>
              </div>
              
              <div 
                className="flex-1 p-6 font-mono text-xs overflow-y-auto custom-scrollbar bg-[#050505]"
                onClick={() => inputRef.current?.focus()}
              >
                {analysisLogs.length > 0 ? (
                  <div className="space-y-1">
                    {analysisLogs.map((log, i) => {
                      const isCmd = log.startsWith('kali@root:~$');
                      const isOutput = !log.startsWith('➜') && !isCmd;
                      return (
                        <div key={i} className={cn(
                          "leading-relaxed break-all",
                          isCmd ? "text-blue-400" : isOutput ? "text-gray-300" : "text-emerald-500/90"
                        )}>
                          {log}
                        </div>
                      );
                    })}
                    {!isAnalyzing && (
                      <form onSubmit={handleCommand} className="flex items-center gap-2 mt-2">
                        <span className="text-blue-400">kali@root:~$</span>
                        <input
                          ref={inputRef}
                          type="text"
                          value={terminalInput}
                          onChange={(e) => setTerminalInput(e.target.value)}
                          onKeyDown={handleKeyDown}
                          autoFocus
                          className="flex-1 bg-transparent border-none outline-none text-cyber-header caret-emerald-500"
                        />
                      </form>
                    )}
                    {isAnalyzing && (
                      <div className="flex items-center gap-2 text-emerald-500 animate-pulse">
                        <span className="text-emerald-500/40 mr-2">➜</span>
                        <span className="bg-emerald-500 w-2 h-4" />
                        Processing intelligence modules...
                      </div>
                    )}
                    <div ref={terminalEndRef} />
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-emerald-500/20 gap-4">
                    <pre className="text-[8px] leading-tight font-bold opacity-40">
{`
    _  __    _    _     ___      ____  _   _ ___ _____ _____ 
   | |/ /   / \\  | |   |_ _|    / ___|| | | |_ _|_   _| ____|
   | ' /   / _ \\ | |    | |     \\___ \\| | | || |  | | |  _|  
   | . \\  / ___ \\| |___ | |      ___) | |_| || |  | | | |___ 
   |_|\\_\\/_/   \\_\\_____|___|    |____/ \\___/|___| |_| |_____|
                                                             
`}
                    </pre>
                    <div className="text-center">
                      <p className="font-bold text-emerald-500/40">KALI-SUITE ADVANCED CLI v2.0</p>
                      <p className="text-[10px] text-emerald-500/20">TYPE "HELP" TO BEGIN SESSION</p>
                    </div>
                    <form onSubmit={handleCommand} className="w-full max-w-xs mt-4">
                      <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg">
                        <span className="text-blue-400 text-[10px]">kali@root:~$</span>
                        <input
                          ref={inputRef}
                          type="text"
                          value={terminalInput}
                          onChange={(e) => setTerminalInput(e.target.value)}
                          onKeyDown={handleKeyDown}
                          className="flex-1 bg-transparent border-none outline-none text-cyber-header text-[10px] caret-emerald-500"
                        />
                      </div>
                    </form>
                  </div>
                )}
              </div>

              {/* Terminal Status Bar */}
              <div className="bg-white/5 px-4 py-1.5 flex items-center justify-between border-t border-white/10 text-[9px] font-mono text-gray-500">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className={cn("w-1.5 h-1.5 rounded-full", isAnalyzing ? "bg-amber-500 animate-pulse" : "bg-emerald-500")} />
                    STATUS: {isAnalyzing ? 'BUSY' : 'READY'}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Globe size={10} />
                    TARGET: {target || 'NONE'}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Terminal size={10} />
                    TOOL: {selectedTool.id.toUpperCase()}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span>UTF-8</span>
                  <span>LINUX-X64</span>
                </div>
              </div>

              {isAnalyzing && (
                <div className="bg-white/5 p-4 border-t border-white/10">
                  <div className="flex justify-between text-[10px] font-mono text-emerald-500/60 mb-2">
                    <span>TASK_PROGRESS</span>
                    <span>{Math.round(analysisProgress)}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${analysisProgress}%` }}
                      className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
