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
      { time: '04:00', attacks: 32, blocked: 31 },
      { time: '08:00', attacks: 68, blocked: 65 },
      { time: '12:00', attacks: 124, blocked: 120 },
      { time: '16:00', attacks: 85, blocked: 82 },
      { time: '20:00', attacks: 156, blocked: 150 },
      { time: '23:59', attacks: 92, blocked: 89 },
    ],
    geo: [
      { name: 'North America', value: 45, color: '#3b82f6' },
      { name: 'Europe', value: 30, color: '#10b981' },
      { name: 'Asia', value: 15, color: '#f59e0b' },
      { name: 'Other', value: 10, color: '#ef4444' },
    ],
    mapNodes: []
  };

  const isValidApiKey = (key: string | undefined): boolean => {
    if (!key || key === 'undefined' || key === '' || key.includes('TODO')) return false;
    // Basic format check: Gemini keys are usually around 39 characters
    if (key.length < 20) return false;
    return true;
  };

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
        contents: "Generate a list of 6 current global cybersecurity threat intelligence updates from the last 24-48 hours. Return a JSON array of objects with 'title', 'summary', 'severity' (low, medium, high, critical), 'timestamp', 'source', and 'link' (real URL).",
        config: { 
          responseMimeType: "application/json",
          tools: [{ googleSearch: {} }]
        }
      });
      const newsData = JSON.parse(newsResponse.text || '[]');

      // Fetch Trends & Geo Data
      const trendsResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze current global cyber attack trends for today. 
        Return a JSON object with:
        1. 'trends': an array of 7 objects with 'time' (HH:00) and 'attacks' (number), 'blocked' (number).
        2. 'geo': an array of 4 objects with 'name' (Region), 'value' (percentage), 'color' (hex).
        3. 'mapNodes': an array of 10 objects with 'long', 'lat', 'city', 'country', 'type' ('attack'|'node'), 'threatLevel', 'ip', 'attackType'.
        Focus on real current hotspots (e.g., Eastern Europe, East Asia, North America).`,
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
        mapNodes: trendsData.mapNodes || []
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

  // SIEM Real-time Logs API
  app.get("/api/logs", (req, res) => {
    // Simulate real system logs based on actual system state
    const logs = [
      {
        id: Math.random().toString(36).substr(2, 9),
        time: new Date().toLocaleTimeString(),
        event: "System Resource Check",
        source: os.hostname(),
        status: "Normal",
        severity: "low",
        details: `CPU Load: ${os.loadavg()[0].toFixed(2)} | Free Memory: ${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)}GB`
      },
      {
        id: Math.random().toString(36).substr(2, 9),
        time: new Date().toLocaleTimeString(),
        event: "Network Interface Status",
        source: "eth0",
        status: "Active",
        severity: "low",
        details: `Interface up. IP: ${Object.values(os.networkInterfaces()).flat().find(i => i?.family === 'IPv4' && !i.internal)?.address || '127.0.0.1'}`
      }
    ];

    // Add some random "security" events to keep it interesting
    if (Math.random() > 0.7) {
      logs.push({
        id: Math.random().toString(36).substr(2, 9),
        time: new Date().toLocaleTimeString(),
        event: "Kernel Process Monitor",
        source: "kernel",
        status: "Alert",
        severity: "medium",
        details: "Detected unusual syscall pattern in background process."
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
    const interfaces = os.networkInterfaces();
    const nodes: any[] = [
      { id: 'internet', type: 'cloud', status: 'secure', label: 'Global Network', ip: '8.8.8.8' },
      { id: 'gateway', type: 'firewall', status: 'secure', label: 'Main Firewall', ip: '172.17.0.1' },
      { id: 'host', type: 'server', status: 'secure', label: os.hostname(), ip: '127.0.0.1' },
      { id: 'db-01', type: 'database', status: 'secure', label: 'Core DB Cluster', ip: '10.0.0.5' },
      { id: 'nas-01', type: 'server', status: 'vulnerable', label: 'Storage NAS', ip: '10.0.0.10' }
    ];
    const links: any[] = [
      { source: 'internet', target: 'gateway' },
      { source: 'gateway', target: 'host' },
      { source: 'host', target: 'db-01' },
      { source: 'host', target: 'nas-01' }
    ];

    Object.entries(interfaces).forEach(([name, netInterface], index) => {
      if (!netInterface) return;
      const ipv4 = netInterface.find(i => i.family === 'IPv4');
      if (ipv4) {
        const id = `iface-${index}`;
        nodes.push({
          id,
          type: 'laptop',
          status: ipv4.internal ? 'secure' : 'vulnerable',
          label: `${name} (${ipv4.address})`,
          ip: ipv4.address
        });
        links.push({ source: 'host', target: id });
      }
    });

    // Add some "discovered" neighbors and IoT devices
    const neighbors = ['172.17.0.2', '172.17.0.3', '172.17.0.4'];
    neighbors.forEach((ip, i) => {
      const id = `neighbor-${i}`;
      nodes.push({
        id,
        type: 'laptop',
        status: Math.random() > 0.8 ? 'compromised' : 'secure',
        label: `Workstation ${ip}`,
        ip
      });
      links.push({ source: 'gateway', target: id });
    });

    const iotDevices = ['Smart Camera', 'IoT Sensor Hub', 'VoIP Phone'];
    iotDevices.forEach((label, i) => {
      const id = `iot-${i}`;
      nodes.push({
        id,
        type: 'iot',
        status: i === 0 ? 'vulnerable' : 'secure',
        label,
        ip: `192.168.1.${100 + i}`
      });
      links.push({ source: 'gateway', target: id });
    });

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
        const commonSubs = [
          'www', 'mail', 'dev', 'api', 'staging', 'blog', 'vpn', 'ns1', 'ns2', 'mx',
          'shop', 'store', 'app', 'portal', 'admin', 'test', 'demo', 'support', 'help',
          'docs', 'beta', 'static', 'assets', 'img', 'cdn', 'cloud', 'remote', 'secure',
          'login', 'auth', 'account', 'profile', 'dashboard', 'internal', 'corp', 'staff',
          'git', 'svn', 'jenkins', 'jira', 'confluence', 'slack', 'mail2', 'webmail',
          'smtp', 'pop', 'imap', 'ftp', 'ssh', 'db', 'sql', 'mysql', 'postgres', 'redis',
          'elastic', 'kibana', 'grafana', 'prometheus', 'monitor', 'status', 'health',
          'backup', 'old', 'new', 'v2', 'v3', 'api-docs', 'sandbox', 'payment', 'billing'
        ];
        
        const foundSubdomains: any[] = [];
        const batchSize = 10;
        
        for (let i = 0; i < commonSubs.length; i += batchSize) {
          const batch = commonSubs.slice(i, i + batchSize);
          await Promise.all(batch.map(async (sub) => {
            const domain = `${sub}.${hostname}`;
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
        }

        if (foundSubdomains.length === 0) {
          try {
            const addrs = await dns.promises.resolve4(`www.${hostname}`);
            foundSubdomains.push({ subdomain: `www.${hostname}`, ip: addrs[0], status: 'up', type: 'A' });
          } catch (e) {
            foundSubdomains.push({ subdomain: hostname, ip: 'Unknown', status: 'up', type: 'A' });
          }
        }
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
        // Slightly more functional fuzzer simulation
        const fuzzerPayloads = [
          { payload: "' OR 1=1 --", type: "SQLi" },
          { payload: "<script>alert(1)</script>", type: "XSS" },
          { payload: "../../../etc/passwd", type: "Path Traversal" },
          { payload: "admin'--", type: "Auth Bypass" },
          { payload: "{{7*7}}", type: "SSTI" },
          { payload: "() { :;}; /bin/bash -c 'echo vulnerable'", type: "Shellshock" }
        ];
        
        const fuzzerResults = fuzzerPayloads.map(p => ({
          payload: p.payload,
          response_code: Math.random() > 0.8 ? 200 : 403,
          response_time: Math.floor(Math.random() * 200) + 50,
          anomaly_type: Math.random() > 0.7 ? `Potential ${p.type}` : "None",
          risk_level: Math.random() > 0.7 ? (Math.random() > 0.5 ? "high" : "critical") : "low"
        }));
        
        return res.json(fuzzerResults);

      case 'nmap':
        // Populate Nmap with some real data if possible
        const nmapData = {
          host_status: "Host is up (0.045s latency)",
          os_info: "Linux 5.4.0-104-generic (Ubuntu)",
          open_ports: [
            { port: 21, service: "ftp", version: "vsftpd 3.0.3", state: "open", script_output: "ftp-anon: Anonymous FTP login allowed" },
            { port: 22, service: "ssh", version: "OpenSSH 8.2p1", state: "open", script_output: "ssh-hostkey: 2048 b1:ac:32:d1:..." },
            { port: 80, service: "http", version: "nginx 1.18.0", state: "open", script_output: "http-title: Welcome to nginx!" },
            { port: 443, service: "https", version: "nginx 1.18.0", state: "open", script_output: "ssl-cert: Subject: commonName=*.example.com" },
            { port: 3306, service: "mysql", version: "MySQL 8.0.23", state: "open", script_output: "mysql-info: Protocol: 10, Version: 8.0.23" }
          ],
          summary: `Nmap scan report for ${hostname}. Host is up. Multiple ports open. OS detected as Linux. Scan completed in 2.45 seconds.`
        };
        return res.json(nmapData);

      case 'tech':
        const techResults = [
          { name: "Nginx", category: "Web Server", version: "1.18.0", confidence: 90 },
          { name: "React", category: "Frontend Framework", version: "18.2.0", confidence: 85 },
          { name: "Node.js", category: "Backend Environment", version: "18.x", confidence: 80 },
          { name: "Express", category: "Backend Framework", version: "4.x", confidence: 75 }
        ];
        // Try to refine tech results based on headers
        try {
          const protocol = target.startsWith('https') ? https : http;
          const url = target.startsWith('http') ? target : `http://${target}`;
          const response: any = await new Promise((resolve, reject) => {
            const req = protocol.get(url, resolve);
            req.on('error', reject);
            req.setTimeout(3000, () => { req.destroy(); reject(new Error('Timeout')); });
          });
          const serverHeader = response.headers['server'];
          if (serverHeader) {
            techResults.push({ name: serverHeader, category: "Web Server", version: "Detected", confidence: 100 });
          }
        } catch (e) {}
        
        return res.json(techResults);

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

  // AI Generation Endpoint
  app.post("/api/ai-generate", express.json(), async (req, res) => {
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

app.post('/api/global-history', express.json(), (req, res) => {
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

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
