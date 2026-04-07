# Important Notice
This application is integrated with Google Gemini AI. Some advanced tools and modules inside the Vulnerability Scanner require a valid Gemini API key to function properly. Without the API key, only the local modules will run (such as basic scanning functions). Please ensure you have configured your Gemini API key if you want to access the full set of online features.


<div align="center">
<img width="1920" height="2577" alt="Cyber" src="https://i.ibb.co/xSfwgG0M/screencapture-localhost-3000-2026-04-04-15-35-55.png" />
</div>

# CyberSuite: Advanced Vulnerability Scanner & Threat Intelligence Platform

CyberSuite is a production-grade, full-stack cybersecurity toolkit designed for security researchers, penetration testers, and system administrators. It combines a powerful web-based interface with a robust Node.js backend to provide real-time reconnaissance, vulnerability assessment, and global threat intelligence.

## 🛡️ Core Features

### 1. Advanced Vulnerability Scanner
A modular scanning engine capable of performing deep reconnaissance on any target domain or IP address.
- **Subdomain Enumeration**: Combines passive discovery (crt.sh, HackerTarget) with high-speed DNS brute-forcing.
- **Port Scanning**: Multi-threaded TCP port scanner targeting 25+ common services with service identification.
- **DNS Reconnaissance**: Detailed resolution of A, MX, TXT, NS, SOA, and CNAME records.
- **SSL/TLS Inspection**: Deep analysis of certificate chains, validity, cipher strength, and expiry tracking.
- **Technology Stack Detection**: Signature-based identification of 40+ web technologies (Servers, CMS, Frameworks).
- **Security Header Analysis**: Evaluates CSP, HSTS, X-Frame-Options, and other critical security headers.
- **Advanced Fuzzer**: Intelligent payload injection (SQLi, XSS, LFI, SSRF) with response body analysis for vulnerability confirmation.

### 2. Google Dork Explorer
An extensive database of 150+ curated Google Dorks categorized for targeted information gathering:
- Sensitive Files & Credentials
- Database Management Interfaces
- Network & VPN Portals
- Cloud Infrastructure Leaks
- IoT & Device Management

### 3. Real-Time Threat Intelligence
- **AI-Powered Analysis**: Integrated with **Google Gemini AI** for deep threat analysis and news aggregation.
- **Global Attack Map**: 3D visualization of real-time cyber attack trends and state-sponsored activities.
- **Live RSS Feed**: Aggregated security advisories from CISA, The Hacker News, and major security vendors.
- **SIEM Dashboard**: Real-time monitoring of system integrity, CPU/RAM usage, and simulated network logs.

### 4. Network Topology & SIEM
- **Interactive Map**: Visualize complex network infrastructures with node-level security status.
- **Remediation Tools**: Isolate compromised nodes or apply patches directly from the HUD.
- **Live Logs**: A high-fidelity stream of security events mapped to MITRE ATT&CK® tactics and techniques.

## 🚀 Standalone Python Scanner
CyberSuite includes a dedicated, standalone Python script (`scanner.py`) that mirrors the web scanner's functionality.
- **Portable**: Run advanced scans from your local terminal.
- **Multi-threaded**: Optimized for speed using `ThreadPoolExecutor`.
- **Zero-Dependency (Core)**: Works out-of-the-box with standard Python libraries (requires `requests`, `dnspython`, and `python-whois`).

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS 4, Framer Motion, Recharts, Lucide React.
- **Backend**: Node.js, Express.
- **AI Engine**: Google Gemini API (`@google/genai`).
- **Data Sources**: crt.sh, HackerTarget API, IANA RDAP, CVE Circle API.

## 📋 Prerequisites & Setup

### Environment Variables
To unlock full AI capabilities, create a `.env` file in the root directory:
```env
GEMINI_API_KEY=your_api_key_here
```
*Note: The scanner will function in "Local Mode" using heuristic analysis if no API key is provided.*

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```

## ⚠️ Disclaimer
This tool is for **educational and ethical security testing purposes only**. Unauthorized scanning of targets without explicit permission is illegal and unethical. The developers assume no liability for misuse of this software.

---
*Built with ❤️ for the Security Community.*
