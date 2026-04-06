/* COPYRIGHT ALEN PEPA */
import React, { useState, useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, X, ChevronRight, Minimize2, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
}

export default function Terminal() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('terminal_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [aliases, setAliases] = useState<Record<string, string>>({
    'scan-vulns': 'scan',
    'pswd': 'passwords',
    'sys': 'status'
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const COMMANDS = [
    'help', 'clear', 'scan', 'whoami', 'status', 'exit', 'alias', 'python', 
    'ls', 'cat', 'nmap', 'ssh', 'top', 'neofetch', 'date', 'uname', 'sudo'
  ];

  const FILESYSTEM: Record<string, string> = {
    'README.txt': 'CyberSuite OS v1.0.4 - Secure Kernel. Unauthorized access is prohibited.',
    'config.sys': 'KERNEL_MODE=SECURE\nNETWORK_ENCRYPTION=AES-256\nNEURAL_LINK=ACTIVE',
    'passwords.db': '[ENCRYPTED DATA] - Access Denied.',
    'logs/system.log': '2026-04-03 11:56:25: Kernel initialized.\n2026-04-03 11:56:26: Network interface eth0 up.'
  };

  const logToTerminalLocal = (message: string, level: 'info' | 'warn' | 'error' | 'success' = 'info', typeEffect = false) => {
    const id = Math.random().toString(36).substr(2, 9);
    const timestamp = new Date().toLocaleTimeString();
    
    if (typeEffect) {
      let currentText = '';
      const newLog: LogEntry = { id, timestamp, level, message: '' };
      setLogs(prev => [...prev.slice(-49), newLog]);
      
      let i = 0;
      const interval = setInterval(() => {
        currentText += message[i];
        setLogs(prev => prev.map(log => log.id === id ? { ...log, message: currentText } : log));
        i++;
        if (i >= message.length) clearInterval(interval);
      }, 10);
    } else {
      const newLog: LogEntry = { id, timestamp, level, message };
      setLogs(prev => [...prev.slice(-49), newLog]);
    }
  };

  const handleCommand = (cmd: string) => {
    const trimmedCmd = cmd.trim();
    if (!trimmedCmd) return;

    logToTerminalLocal(`alen@cybersuite:~$ ${trimmedCmd}`, 'info');
    
    const newHistory = [trimmedCmd, ...history.filter(h => h !== trimmedCmd)].slice(0, 50);
    setHistory(newHistory);
    localStorage.setItem('terminal_history', JSON.stringify(newHistory));
    setHistoryIndex(-1);

    const parts = trimmedCmd.split(' ');
    const baseCommand = parts[0].toLowerCase();
    const args = parts.slice(1);

    // Resolve alias
    let resolvedCommand = baseCommand;
    if (aliases[baseCommand]) {
      resolvedCommand = aliases[baseCommand];
    }

    const typeLog = (msg: string, lvl: any = 'info') => logToTerminalLocal(msg, lvl, true);

    switch (resolvedCommand) {
      case 'help':
        typeLog('CORE COMMANDS: help, clear, exit, alias, whoami, status, date, uname');
        typeLog('SECURITY TOOLS: scan, nmap, python, passwords');
        typeLog('FILESYSTEM: ls, cat');
        typeLog('SYSTEM: top, neofetch, sudo');
        break;
      case 'clear':
        setLogs([]);
        break;
      case 'ls':
        typeLog(Object.keys(FILESYSTEM).join('  '));
        break;
      case 'cat':
        if (args[0] && FILESYSTEM[args[0]]) {
          typeLog(FILESYSTEM[args[0]]);
        } else {
          logToTerminalLocal(`cat: ${args[0] || 'missing operand'}: No such file or directory`, 'error');
        }
        break;
      case 'nmap':
        const target = args[0] || '127.0.0.1';
        typeLog(`Starting Nmap 7.92 ( https://nmap.org ) at ${new Date().toISOString()}`);
        typeLog(`Nmap scan report for ${target}`);
        typeLog('Host is up (0.00042s latency).');
        typeLog('Not shown: 998 closed ports');
        typeLog('PORT     STATE SERVICE');
        typeLog('22/tcp   open  ssh', 'success');
        typeLog('80/tcp   open  http', 'success');
        typeLog('443/tcp  open  https', 'success');
        typeLog('3000/tcp open  ppp', 'success');
        typeLog('Nmap done: 1 IP address (1 host up) scanned in 1.24 seconds');
        break;
      case 'ssh':
        if (!args[0]) {
          typeLog('Usage: ssh [user]@[host]', 'warn');
        } else {
          typeLog(`Connecting to ${args[0]}...`, 'warn');
          setTimeout(() => typeLog('Connection established. Terminal multiplexer active.', 'success'), 1500);
        }
        break;
      case 'top':
        typeLog('PID  USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND');
        typeLog('1    root      20   0   16828   9644   6644 S   0.0   0.1   0:01.24 init');
        typeLog('42   alen      20   0  842104  42104  12404 R   4.2   2.4   0:42.12 cybersuite');
        typeLog('102  root      20   0       0      0      0 S   0.1   0.0   0:00.04 kworker/u4:1');
        break;
      case 'neofetch':
        typeLog('       .---.        USER: alen@cybersuite', 'success');
        typeLog('      /     \\       OS: CyberSuite OS v1.0.4 x86_64', 'success');
        typeLog('      | (O) |       KERNEL: 5.15.0-72-generic', 'success');
        typeLog('      \\     /       UPTIME: 4 hours, 21 mins', 'success');
        typeLog('       `---`        PACKAGES: 1242 (dpkg)', 'success');
        typeLog('                    SHELL: zsh 5.8.1', 'success');
        typeLog('                    CPU: Neural Core i9 @ 5.2GHz', 'success');
        typeLog('                    MEMORY: 4.2GB / 32GB', 'success');
        break;
      case 'matrix':
        typeLog('Wake up, Neo...', 'success');
        typeLog('The Matrix has you...', 'success');
        typeLog('Follow the white rabbit.', 'success');
        typeLog('Knock, knock, Neo.', 'success');
        break;
      case 'date':
        typeLog(new Date().toString());
        break;
      case 'uname':
        typeLog('CyberSuiteOS 1.0.4-generic #1 SMP Fri Apr 3 11:56:25 UTC 2026 x86_64 GNU/Linux');
        break;
      case 'sudo':
        typeLog('[sudo] password for alen: ', 'warn');
        typeLog('Access granted. Executing with root privileges...', 'success');
        if (args.length > 0) {
          handleCommand(args.join(' '));
        }
        break;
      case 'scan':
        typeLog('Initiating system-wide vulnerability scan...', 'warn');
        setTimeout(() => typeLog('Scan complete. No threats found.', 'success'), 2000);
        break;
      case 'whoami':
        typeLog('User: Alen Pepa // Role: Security Researcher // Access: Root', 'success');
        break;
      case 'status':
        typeLog('System: CyberSuite OS v1.0.4 // Status: Secure // Neural Link: Online');
        break;
      case 'exit':
        setIsOpen(false);
        break;
      case 'python':
        typeLog('Initializing Python Neural Core...');
        window.dispatchEvent(new CustomEvent('navigate-tool', { detail: { toolId: 'python-lab' } }));
        break;
      case 'passwords':
        typeLog('Accessing Password Lab module...');
        window.dispatchEvent(new CustomEvent('navigate-tool', { detail: { toolId: 'passwords' } }));
        break;
      case 'alias':
        if (args[0] === 'add' && args[1] && args[2]) {
          const aliasName = args[1].toLowerCase();
          const targetCmd = args.slice(2).join(' ');
          setAliases(prev => ({ ...prev, [aliasName]: targetCmd }));
          typeLog(`Alias added: ${aliasName} -> ${targetCmd}`, 'success');
        } else if (args[0] === 'list') {
          typeLog('Current Aliases:');
          Object.entries(aliases).forEach(([name, target]) => {
            typeLog(`${name} -> ${target}`);
          });
        } else {
          typeLog("Usage: alias add [name] [command] | alias list", "warn");
        }
        break;
      default:
        typeLog(`Command not found: ${resolvedCommand}. Type 'help' for options.`, 'error');
    }
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommand(input);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const allAvailable = [...COMMANDS, ...Object.keys(aliases)];
      const matches = allAvailable.filter(c => c.startsWith(input.toLowerCase()));
      if (matches.length === 1) {
        setInput(matches[0]);
      } else if (matches.length > 1) {
        logToTerminal(`Possible commands/aliases: ${matches.join(', ')}`, 'info');
      }
    }
  };

  useEffect(() => {
    const initialLogs: LogEntry[] = [
      { id: '1', timestamp: new Date().toLocaleTimeString(), level: 'info', message: 'CyberSuite OS Kernel v1.0.4 loaded.' },
      { id: '2', timestamp: new Date().toLocaleTimeString(), level: 'success', message: 'Encryption engine initialized.' },
      { id: '3', timestamp: new Date().toLocaleTimeString(), level: 'info', message: 'Establishing secure tunnel to 127.0.0.1...' },
    ];
    setLogs(initialLogs);

    // Listen for custom log events
    const handleLog = (e: any) => {
      const newLog: LogEntry = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        level: e.detail.level || 'info',
        message: e.detail.message,
      };
      setLogs(prev => [...prev.slice(-49), newLog]);
    };

    window.addEventListener('terminal-log', handleLog);
    return () => window.removeEventListener('terminal-log', handleLog);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ y: 300 }}
      animate={{ y: isMinimized ? 260 : 0 }}
      className={cn(
        "fixed bottom-8 right-8 w-[450px] bg-black/90 border border-[#00FF41]/30 rounded-xl overflow-hidden z-50 shadow-[0_0_30px_rgba(0,255,65,0.15)] backdrop-blur-xl",
        "before:absolute before:inset-0 before:bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(0,255,65,0.06),rgba(0,255,65,0.02),rgba(0,255,65,0.06))] before:bg-[length:100%_2px,3px_100%] before:pointer-events-none before:z-10",
        isMinimized ? "h-10" : "h-96"
      )}
    >
      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none z-20 bg-[radial-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_100%),linear-gradient(transparent_0%,rgba(0,255,65,0.05)_2%,transparent_3%)] bg-[length:100%_100%,100%_100px] animate-scanline" />
      {/* Header */}
      <div className="h-10 bg-black/80 border-b border-[#00FF41]/30 flex items-center justify-between px-4 cursor-pointer shadow-[inset_0_0_15px_rgba(0,255,65,0.05)]" onClick={() => setIsMinimized(!isMinimized)}>
        <div className="flex items-center gap-2">
          <TerminalIcon size={14} className="text-[#00FF41] drop-shadow-[0_0_5px_currentColor]" />
          <span className="text-[10px] font-mono text-[#00FF41] uppercase tracking-widest drop-shadow-[0_0_2px_currentColor]">System Console</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} className="text-[#00FF41]/50 hover:text-[#00FF41] transition-colors">
            {isMinimized ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="text-[#00FF41]/50 hover:text-red-500 transition-colors">
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="h-[calc(100%-40px)] flex flex-col">
          <div 
            ref={scrollRef}
            className="flex-1 p-4 overflow-y-auto font-mono text-[10px] space-y-1 custom-scrollbar relative z-0"
          >
            <div className="mb-4 text-[#00FF41]/60 leading-tight drop-shadow-[0_0_2px_currentColor]">
              Welcome to CyberSuite OS v1.0.4 (Kernel 5.15.0-72-generic)<br/>
              * Documentation: https://cybersuite.os/docs<br/>
              * Support: root@cybersuite.os<br/>
              <br/>
              Last login: {new Date().toDateString()} from 127.0.0.1
            </div>
            {logs.map((log) => (
              <div key={log.id} className="flex gap-2 group">
                <span className="text-[#00FF41]/40 shrink-0">[{log.timestamp}]</span>
                <span className={cn(
                  "shrink-0 uppercase drop-shadow-[0_0_2px_currentColor]",
                  log.level === 'info' ? "text-blue-400" :
                  log.level === 'warn' ? "text-yellow-400" :
                  log.level === 'error' ? "text-red-500" :
                  "text-[#00FF41]"
                )}>
                  {log.level}:
                </span>
                <span className="text-[#00FF41]/80 break-all">{log.message}</span>
              </div>
            ))}
          </div>
          
          <div className="p-2 bg-black/60 border-t border-[#00FF41]/30 flex items-center gap-2 relative z-30 shadow-[inset_0_5px_15px_rgba(0,255,65,0.05)]">
            <span className="text-[#00FF41] font-bold text-[10px] shrink-0 drop-shadow-[0_0_2px_currentColor]">alen@cybersuite:~$</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a command..."
              className="flex-1 bg-transparent border-none outline-none font-mono text-[10px] text-[#00FF41] placeholder:text-[#00FF41]/30"
              autoFocus
            />
            <div className="w-1.5 h-3 bg-[#00FF41] animate-pulse shrink-0 drop-shadow-[0_0_5px_currentColor]" />
          </div>
        </div>
      )}
    </motion.div>
  );
}

export function logToTerminal(message: string, level: 'info' | 'warn' | 'error' | 'success' = 'info') {
  window.dispatchEvent(new CustomEvent('terminal-log', { detail: { message, level } }));
}
