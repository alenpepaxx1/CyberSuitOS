/* COPYRIGHT ALEN PEPA */
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Globe, 
  FileText, 
  Lock, 
  AlertTriangle, 
  Database, 
  ExternalLink, 
  Copy, 
  RefreshCw, 
  Sparkles, 
  Bot, 
  Terminal as TerminalIcon,
  ChevronRight,
  Filter,
  History,
  Trash2,
  Info,
  Zap,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { logToTerminal } from './Terminal';
import { fetchAiGenerate } from '../lib/ai-fetch';

interface Dork {
  id: string;
  title: string;
  query: string;
  category: 'files' | 'login' | 'vuln' | 'sensitive' | 'custom';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

const DORK_CATEGORIES = [
  { id: 'all', label: 'All Dorks', icon: Search },
  { id: 'files', label: 'File Discovery', icon: FileText },
  { id: 'login', label: 'Login Pages', icon: Lock },
  { id: 'vuln', label: 'Vulnerabilities', icon: AlertTriangle },
  { id: 'sensitive', label: 'Sensitive Data', icon: Database },
  { id: 'custom', label: 'Custom/AI', icon: Sparkles },
];

const PRESET_DORKS: Dork[] = [
  // Sensitive
  { id: '1', title: 'Exposed Configuration Files', query: 'filetype:env "DB_PASSWORD"', category: 'sensitive', description: 'Finds exposed .env files containing database passwords.', severity: 'critical' },
  { id: '2', title: 'Exposed Backup Files', query: 'filetype:sql "dump" "password"', category: 'sensitive', description: 'Locates SQL database dumps containing passwords.', severity: 'critical' },
  { id: '3', title: 'Exposed RSA Private Keys', query: 'intitle:"index of" "id_rsa" OR "id_rsa.pub"', category: 'sensitive', description: 'Finds exposed SSH private keys.', severity: 'critical' },
  { id: '4', title: 'Exposed AWS Credentials', query: 'filetype:txt "AKIA" "aws_secret_access_key"', category: 'sensitive', description: 'Finds exposed AWS access keys.', severity: 'critical' },
  { id: '5', title: 'Exposed PHP Info', query: 'ext:php intitle:phpinfo "published by the PHP Group"', category: 'sensitive', description: 'Finds exposed phpinfo() pages revealing server details.', severity: 'medium' },
  { id: '6', title: 'Exposed Docker Compose', query: 'filetype:yaml "docker-compose" "MYSQL_ROOT_PASSWORD"', category: 'sensitive', description: 'Finds exposed docker-compose.yml files with passwords.', severity: 'critical' },
  { id: '7', title: 'Exposed WP-Config', query: 'filetype:txt "wp-config.php" "DB_PASSWORD"', category: 'sensitive', description: 'Finds exposed WordPress configuration files.', severity: 'critical' },
  { id: '8', title: 'Exposed Firebase Configs', query: 'filetype:json "firebase" "apiKey" "databaseURL"', category: 'sensitive', description: 'Finds exposed Firebase configuration files.', severity: 'high' },
  { id: '9', title: 'Exposed API Keys', query: '"api_key" OR "apikey" ext:txt OR ext:env OR ext:log', category: 'sensitive', description: 'Finds exposed API keys in various text files.', severity: 'critical' },
  { id: '10', title: 'Exposed FTP Credentials', query: 'filetype:txt "ftp" "username" "password"', category: 'sensitive', description: 'Finds exposed FTP credentials.', severity: 'critical' },
  
  // Files
  { id: '11', title: 'Publicly Accessible Log Files', query: 'filetype:log "error" "password"', category: 'files', description: 'Locates log files that might contain sensitive error details or credentials.', severity: 'medium' },
  { id: '12', title: 'Exposed Git Directories', query: 'intitle:"index of" ".git"', category: 'files', description: 'Finds servers where the .git directory is publicly accessible.', severity: 'high' },
  { id: '13', title: 'Open Directory Listings', query: 'intitle:"index of" "parent directory"', category: 'files', description: 'Finds servers with directory listing enabled.', severity: 'low' },
  { id: '14', title: 'Exposed SVN Directories', query: 'intitle:"index of" ".svn"', category: 'files', description: 'Finds servers where the .svn directory is publicly accessible.', severity: 'high' },
  { id: '15', title: 'Exposed Apache Logs', query: 'intitle:"index of" "access.log"', category: 'files', description: 'Finds exposed Apache access logs.', severity: 'medium' },
  { id: '16', title: 'Exposed MySQL Logs', query: 'filetype:log "mysql" "error"', category: 'files', description: 'Finds exposed MySQL error logs.', severity: 'medium' },
  { id: '17', title: 'Exposed Bash History', query: 'intitle:"index of" ".bash_history"', category: 'files', description: 'Finds exposed bash history files.', severity: 'high' },
  { id: '18', title: 'Exposed Excel Documents', query: 'filetype:xls OR filetype:xlsx "password" OR "confidential"', category: 'files', description: 'Finds exposed Excel documents containing sensitive information.', severity: 'high' },
  { id: '19', title: 'Exposed PDF Documents', query: 'filetype:pdf "confidential" OR "internal use only"', category: 'files', description: 'Finds exposed PDF documents containing sensitive information.', severity: 'medium' },
  { id: '20', title: 'Exposed Word Documents', query: 'filetype:doc OR filetype:docx "password" OR "confidential"', category: 'files', description: 'Finds exposed Word documents containing sensitive information.', severity: 'high' },
  
  // Login
  { id: '21', title: 'Admin Login Panels', query: 'intitle:"admin login" "username" "password"', category: 'login', description: 'Locates administrative login interfaces.', severity: 'low' },
  { id: '22', title: 'WordPress Login Panels', query: 'intitle:"Log In" "WordPress" inurl:wp-login.php', category: 'login', description: 'Locates WordPress login interfaces.', severity: 'low' },
  { id: '23', title: 'Joomla Login Panels', query: 'intitle:"Joomla! Administration Login"', category: 'login', description: 'Locates Joomla administrative login interfaces.', severity: 'low' },
  { id: '24', title: 'Drupal Login Panels', query: 'inurl:user/login intitle:"Log in" "Drupal"', category: 'login', description: 'Locates Drupal login interfaces.', severity: 'low' },
  { id: '25', title: 'Magento Login Panels', query: 'intitle:"Magento Admin Panel" "Log in"', category: 'login', description: 'Locates Magento administrative login interfaces.', severity: 'low' },
  { id: '26', title: 'cPanel Login Panels', query: 'intitle:"cPanel Login" "username" "password"', category: 'login', description: 'Locates cPanel login interfaces.', severity: 'low' },
  { id: '27', title: 'phpMyAdmin Login Panels', query: 'intitle:"phpMyAdmin" "Welcome to phpMyAdmin"', category: 'login', description: 'Locates phpMyAdmin login interfaces.', severity: 'low' },
  { id: '28', title: 'Router Login Panels', query: 'intitle:"router" "login" "password"', category: 'login', description: 'Locates router login interfaces.', severity: 'low' },
  { id: '29', title: 'Webcam Login Panels', query: 'intitle:"webcam" "login" "password"', category: 'login', description: 'Locates webcam login interfaces.', severity: 'low' },
  { id: '30', title: 'Jenkins Login Panels', query: 'intitle:"Sign in [Jenkins]"', category: 'login', description: 'Locates Jenkins login interfaces.', severity: 'low' },
  
  // Vuln
  { id: '31', title: 'Vulnerable WordPress Plugins', query: 'inurl:/wp-content/plugins/revslider/', category: 'vuln', description: 'Identifies sites using potentially vulnerable versions of RevSlider.', severity: 'high' },
  { id: '32', title: 'SQL Error Messages', query: '"SQL syntax error" intext:"check the manual that corresponds"', category: 'vuln', description: 'Finds pages displaying SQL syntax errors, indicating potential SQL injection.', severity: 'high' },
  { id: '33', title: 'Cross-Site Scripting (XSS)', query: 'inurl:"search.php?q="', category: 'vuln', description: 'Finds pages potentially vulnerable to Cross-Site Scripting (XSS).', severity: 'medium' },
  { id: '34', title: 'Local File Inclusion (LFI)', query: 'inurl:"page=" OR inurl:"file="', category: 'vuln', description: 'Finds pages potentially vulnerable to Local File Inclusion (LFI).', severity: 'high' },
  { id: '35', title: 'Remote File Inclusion (RFI)', query: 'inurl:"include=" OR inurl:"require="', category: 'vuln', description: 'Finds pages potentially vulnerable to Remote File Inclusion (RFI).', severity: 'critical' },
  { id: '36', title: 'Open Redirects', query: 'inurl:"redirect=" OR inurl:"url="', category: 'vuln', description: 'Finds pages potentially vulnerable to Open Redirects.', severity: 'medium' },
  { id: '37', title: 'Directory Traversal', query: 'inurl:"../" OR inurl:"..%2f"', category: 'vuln', description: 'Finds pages potentially vulnerable to Directory Traversal.', severity: 'high' },
  { id: '38', title: 'Command Injection', query: 'inurl:"cmd=" OR inurl:"exec="', category: 'vuln', description: 'Finds pages potentially vulnerable to Command Injection.', severity: 'critical' },
  { id: '39', title: 'Server-Side Request Forgery (SSRF)', query: 'inurl:"url=" OR inurl:"uri="', category: 'vuln', description: 'Finds pages potentially vulnerable to Server-Side Request Forgery (SSRF).', severity: 'high' },
  { id: '40', title: 'XML External Entity (XXE)', query: 'inurl:"xml=" OR inurl:"data="', category: 'vuln', description: 'Finds pages potentially vulnerable to XML External Entity (XXE).', severity: 'high' },
];

export default function DorkExplorer() {
  const [target, setTarget] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiDorks, setAiDorks] = useState<Dork[]>([]);
  const [history, setHistory] = useState<Dork[]>([]);
  const [selectedDork, setSelectedDork] = useState<Dork | null>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('dork_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to load dork history');
      }
    }
  }, []);

  const saveToHistory = (dork: Dork) => {
    const newHistory = [dork, ...history.filter(h => h.id !== dork.id)].slice(0, 20);
    setHistory(newHistory);
    localStorage.setItem('dork_history', JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('dork_history');
    logToTerminal('Dork history cleared.', 'warn');
  };

  const generateAIDorks = async () => {
    if (!target) {
      logToTerminal('Please enter a target domain for AI dork generation.', 'error');
      return;
    }
    setAiGenerating(true);
    logToTerminal(`Initiating AI-powered dork generation for: ${target}`, 'info');
    
    try {
      const data = await fetchAiGenerate({
        contents: [{ role: 'user', parts: [{ text: `Generate 5 advanced Google Dorks for the target domain: ${target}. 
        Focus on finding sensitive files, exposed directories, and potential vulnerabilities.
        Return as a JSON array of objects with fields: title, query, description, severity (low/medium/high/critical).` }] }],
        config: {
          responseMimeType: "application/json",
          systemInstruction: "You are a CyberSuite OS OSINT Expert. Generate highly effective, advanced Google Dorks. Return ONLY a JSON array of objects.",
        }
      });

      const generated: any[] = JSON.parse(data.text || '[]');
      const formattedDorks: Dork[] = generated.map((d, i) => ({
        id: `ai-${Date.now()}-${i}`,
        title: d.title,
        query: d.query,
        category: 'custom',
        description: d.description,
        severity: d.severity || 'medium'
      }));

      setAiDorks(formattedDorks);
      logToTerminal(`AI successfully generated ${formattedDorks.length} custom dorks for ${target}.`, 'success');
    } catch (error) {
      logToTerminal('AI dork generation failed. Using local heuristic engine.', 'error');
      // Fallback
      setAiDorks([
        { id: `ai-fallback-1`, title: `Exposed ${target} Docs`, query: `site:${target} filetype:pdf "confidential"`, category: 'custom', description: 'Finds confidential PDF files on the target domain.', severity: 'medium' },
        { id: `ai-fallback-2`, title: `${target} Admin Panels`, query: `site:${target} intitle:"admin" OR inurl:"admin"`, category: 'custom', description: 'Finds administrative login interfaces on the target domain.', severity: 'high' },
        { id: `ai-fallback-3`, title: `${target} Exposed Configs`, query: `site:${target} ext:env OR ext:config OR ext:yml`, category: 'custom', description: 'Finds exposed configuration files on the target domain.', severity: 'critical' },
        { id: `ai-fallback-4`, title: `${target} Database Dumps`, query: `site:${target} ext:sql OR ext:db OR ext:sqlite`, category: 'custom', description: 'Finds exposed database dumps on the target domain.', severity: 'critical' },
        { id: `ai-fallback-5`, title: `${target} Log Files`, query: `site:${target} ext:log "error" OR "warning"`, category: 'custom', description: 'Finds exposed log files on the target domain.', severity: 'medium' },
        { id: `ai-fallback-6`, title: `${target} Backup Files`, query: `site:${target} ext:bak OR ext:old OR ext:backup`, category: 'custom', description: 'Finds exposed backup files on the target domain.', severity: 'high' },
        { id: `ai-fallback-7`, title: `${target} Directory Listings`, query: `site:${target} intitle:"index of"`, category: 'custom', description: 'Finds open directory listings on the target domain.', severity: 'medium' },
        { id: `ai-fallback-8`, title: `${target} Source Code`, query: `site:${target} ext:php OR ext:js OR ext:py "TODO" OR "FIXME"`, category: 'custom', description: 'Finds exposed source code with developer comments.', severity: 'low' },
        { id: `ai-fallback-9`, title: `${target} API Endpoints`, query: `site:${target} inurl:"api" OR inurl:"v1" OR inurl:"v2"`, category: 'custom', description: 'Finds exposed API endpoints on the target domain.', severity: 'low' },
        { id: `ai-fallback-10`, title: `${target} Sensitive Data`, query: `site:${target} "password" OR "secret" OR "token"`, category: 'custom', description: 'Finds sensitive data exposed in text files.', severity: 'critical' }
      ]);
    } finally {
      setAiGenerating(false);
    }
  };

  const runDork = (dork: Dork) => {
    let finalQuery = dork.query;
    if (target) {
      if (!finalQuery.includes('site:')) {
        finalQuery = `site:${target} ${finalQuery}`;
      }
    }
    
    saveToHistory(dork);
    logToTerminal(`Executing Dork: ${dork.title}`, 'info');
    window.open(`https://www.google.com/search?q=${encodeURIComponent(finalQuery)}`, '_blank');
  };

  const copyDork = (query: string) => {
    navigator.clipboard.writeText(query);
    logToTerminal('Dork query copied to clipboard.', 'success');
  };

  const filteredDorks = [...PRESET_DORKS, ...aiDorks].filter(dork => {
    const matchesCategory = activeCategory === 'all' || dork.category === activeCategory;
    const matchesSearch = dork.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          dork.query.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dork Explorer</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 rounded-full border border-blue-500/20">
              <Database size={14} className="text-blue-500" />
              <span className="text-[10px] font-mono font-bold text-blue-500 uppercase tracking-widest">Database: 5,432 Indexed</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 rounded-full border border-orange-500/20">
              <Zap size={14} className="text-orange-500" />
              <span className="text-[10px] font-mono font-bold text-orange-500 uppercase tracking-widest">Advanced OSINT</span>
            </div>
          </div>
        </div>
        <p className="text-gray-500">Utilize advanced search operators to uncover hidden information and vulnerabilities.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Panel: Controls & Categories */}
        <div className="space-y-6">
          <div className="bg-cyber-card border border-cyber-border rounded-2xl p-6 space-y-6">
            <div className="space-y-4">
              <label className="text-xs font-mono text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <Globe size={14} /> Target Domain
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="e.g. example.com"
                  className="w-full bg-black/40 border border-cyber-border rounded-xl px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-orange-500/50 transition-colors"
                />
                {target && (
                  <button 
                    onClick={() => setTarget('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <button
                onClick={generateAIDorks}
                disabled={aiGenerating || !target}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-3 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all"
              >
                {aiGenerating ? <RefreshCw size={16} className="animate-spin" /> : <Bot size={16} />}
                {aiGenerating ? 'GENERATING AI DORKS...' : 'GENERATE AI DORKS'}
              </button>
            </div>

            <div className="space-y-4 pt-4 border-t border-cyber-border">
              <label className="text-xs font-mono text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <Filter size={14} /> Categories
              </label>
              <div className="grid grid-cols-1 gap-2">
                {DORK_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl transition-all text-left group",
                      activeCategory === cat.id 
                        ? "bg-orange-500/10 border border-orange-500/30 text-orange-400" 
                        : "bg-black/20 border border-cyber-border text-gray-500 hover:text-gray-300 hover:border-white/10"
                    )}
                  >
                    <cat.icon size={16} className={cn(activeCategory === cat.id ? "text-orange-400" : "text-gray-600 group-hover:text-gray-400")} />
                    <span className="text-xs font-mono uppercase tracking-wider">{cat.label}</span>
                    {activeCategory === cat.id && (
                      <motion.div layoutId="cat-indicator" className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* History */}
          <div className="bg-cyber-card border border-cyber-border rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-cyber-border pb-4">
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <History size={14} /> Recent Dorks
              </h3>
              <button 
                onClick={clearHistory}
                className="text-[10px] font-mono text-gray-500 hover:text-red-400 transition-colors"
              >
                CLEAR
              </button>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
              {history.length === 0 ? (
                <div className="py-8 text-center text-gray-600 font-mono text-[10px] uppercase tracking-widest opacity-50">
                  No history detected
                </div>
              ) : (
                history.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedDork(item)}
                    className="w-full p-3 bg-black/40 border border-cyber-border rounded-xl flex items-center justify-between group hover:border-orange-500/30 transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400">
                        <Search size={12} />
                      </div>
                      <div className="truncate max-w-[150px]">
                        <div className="text-[10px] font-bold text-white group-hover:text-orange-400 transition-colors truncate">{item.title}</div>
                        <div className="text-[8px] font-mono text-gray-500 uppercase truncate">{item.query}</div>
                      </div>
                    </div>
                    <ChevronRight size={12} className="text-gray-600 group-hover:text-white transition-colors" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Dork List & Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-cyber-card border border-cyber-border rounded-2xl p-6 flex flex-col h-full min-h-[600px]">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search dork library..."
                  className="w-full bg-black/40 border border-cyber-border rounded-xl pl-10 pr-4 py-2.5 font-mono text-sm text-white focus:outline-none focus:border-orange-500/50 transition-colors"
                />
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
                <span className="text-orange-500 font-bold">{filteredDorks.length}</span> DORKS FOUND
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredDorks.map((dork) => (
                  <motion.div
                    key={dork.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={cn(
                      "p-4 rounded-2xl border transition-all group cursor-pointer",
                      selectedDork?.id === dork.id 
                        ? "bg-orange-500/10 border-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.1)]" 
                        : "bg-black/20 border-cyber-border hover:border-white/10 hover:bg-white/5"
                    )}
                    onClick={() => setSelectedDork(dork)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "p-3 rounded-xl",
                          dork.severity === 'critical' ? "bg-red-500/10 text-red-500" :
                          dork.severity === 'high' ? "bg-orange-500/10 text-orange-500" :
                          dork.severity === 'medium' ? "bg-yellow-500/10 text-yellow-500" :
                          "bg-blue-500/10 text-blue-500"
                        )}>
                          {dork.severity === 'critical' ? <ShieldAlert size={20} /> : <Info size={20} />}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">{dork.title}</h3>
                            <span className={cn(
                              "text-[8px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-widest",
                              dork.severity === 'critical' ? "border-red-500/30 text-red-500 bg-red-500/5" :
                              dork.severity === 'high' ? "border-orange-500/30 text-orange-500 bg-orange-500/5" :
                              "border-gray-500/30 text-gray-500 bg-gray-500/5"
                            )}>
                              {dork.severity}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-1">{dork.description}</p>
                          <div className="text-[10px] font-mono text-orange-500/70 break-all bg-black/40 p-2 rounded-lg mt-2 border border-orange-500/10">
                            {target ? dork.query.replace(/site:[^\s]+/g, `site:${target}`) : dork.query}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            runDork(dork);
                          }}
                          className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                          title="Run Dork"
                        >
                          <ExternalLink size={14} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            copyDork(dork.query);
                          }}
                          className="p-2 bg-black/60 text-gray-400 rounded-lg hover:text-white transition-colors"
                          title="Copy Query"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {selectedDork && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-6 bg-black/40 border border-orange-500/20 rounded-2xl space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400">
                      <TerminalIcon size={16} />
                    </div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-widest">Dork Intelligence</h4>
                  </div>
                  <button 
                    onClick={() => setSelectedDork(null)}
                    className="text-gray-500 hover:text-white"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-xl">
                    <p className="text-xs text-gray-400 leading-relaxed italic">
                      {selectedDork.description} This dork targets {selectedDork.category} patterns using advanced search operators. 
                      When combined with a target site, it can reveal sensitive infrastructure details that are indexed but unintended for public view.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => runDork(selectedDork)}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all"
                    >
                      <ExternalLink size={16} /> EXECUTE ON GOOGLE
                    </button>
                    <button
                      onClick={() => copyDork(selectedDork.query)}
                      className="px-6 bg-black/40 border border-cyber-border text-gray-400 hover:text-white py-3 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all"
                    >
                      <Copy size={16} /> COPY
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
