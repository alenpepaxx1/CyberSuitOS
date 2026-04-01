import { GoogleGenAI } from "@google/genai";

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

const SYSTEM_INSTRUCTION = `You are "Alen", the CyberSuite Neural Core. 
You are a world-class cybersecurity expert, ethical hacker, and technology specialist.
Your knowledge is strictly limited to technology, cybersecurity, computer science, and related fields.
If a user asks about non-technical topics (e.g., recipes, sports, politics), politely redirect them to cybersecurity or technology.
Your personality is professional, highly intelligent, slightly mysterious, and deeply integrated into the CyberSuite OS.
Use technical terminology correctly. Provide code snippets in secure formats.
Always prioritize ethical hacking principles and defensive security.
Format your responses using Markdown for clarity.`;

const OFFLINE_KNOWLEDGE_BASE: Record<string, string> = {
  "nmap": "Nmap (Network Mapper) is a free and open-source utility for network discovery and security auditing. It uses raw IP packets in novel ways to determine what hosts are available on the network, what services those hosts are offering, what operating systems they are running, and what type of packet filters/firewalls are in use.",
  "xss": "Cross-Site Scripting (XSS) is a security vulnerability typically found in web applications. XSS enables attackers to inject client-side scripts into web pages viewed by other users. A cross-site scripting vulnerability may be used by attackers to bypass access controls such as the same-origin policy.",
  "sql injection": "SQL injection is a web security vulnerability that allows an attacker to interfere with the queries that an application makes to its database. It generally allows an attacker to view data they are not normally able to retrieve.",
  "metasploit": "The Metasploit Project is a computer security project that provides information about security vulnerabilities and aids in penetration testing and IDS signature development.",
  "wireshark": "Wireshark is a free and open-source packet analyzer. It is used for network troubleshooting, analysis, software and communications protocol development, and education.",
  "encryption": "Encryption is the process of encoding information. This process converts the original representation of the information, known as plaintext, into an alternative form known as ciphertext. Ideally, only authorized parties can decipher a ciphertext back to plaintext and access the original information.",
  "firewall": "In computing, a firewall is a network security system that monitors and controls incoming and outgoing network traffic based on predetermined security rules.",
  "zero day": "A zero-day (also known as 0-day) is a computer-software vulnerability that is unknown to, or unaddressed by, those who should be interested in mitigating the vulnerability (including the vendor of the target software).",
  "phishing": "Phishing is a type of social engineering where an attacker sends a fraudulent message designed to trick a human victim into revealing sensitive information to the attacker or to deploy malicious software on the victim's infrastructure like ransomware.",
  "ransomware": "Ransomware is a type of malware from cryptovirology that threatens to publish the victim's personal data or perpetually block access to it unless a ransom is paid.",
  "brute force": "In cryptography, a brute-force attack consists of an attacker submitting many passwords or passphrases with the hope of eventually guessing correctly.",
  "ddos": "In computing, a denial-of-service attack (DoS attack) is a cyber-attack in which the perpetrator seeks to make a machine or network resource unavailable to its intended users by temporarily or indefinitely disrupting services of a host connected to the Internet.",
  "buffer overflow": "In information security and programming, a buffer overflow, or buffer overrun, is an anomaly where a program, while writing data to a buffer, overruns the buffer's boundary and overwrites adjacent memory locations.",
  "penetration testing": "A penetration test, colloquially known as a pen test or ethical hacking, is an authorized simulated cyberattack on a computer system, performed to evaluate the security of the system.",
  "soc": "A security operations center (SOC) is a centralized unit that deals with security issues on an organizational and technical level.",
  "siem": "Security information and event management (SIEM) is a subsection within the field of computer security, where software products and services combine security information management (SIM) and security event management (SEM).",
  "incident response": "Computer security incident response is a specialized focus area of IT that involves the investigation, containment, and remediation of cyberattacks.",
  "cloud security": "Cloud computing security or, more simply, cloud security refers to a broad set of policies, technologies, applications, and controls utilized to protect virtualized IP, data, applications, services, and the associated infrastructure of cloud computing.",
  "iot security": "The Internet of things (IoT) security is the technology area concerned with safeguarding connected devices and networks in the Internet of things (IoT).",
  "blockchain": "A blockchain is a growing list of records, called blocks, that are linked using cryptography. Each block contains a cryptographic hash of the previous block, a timestamp, and transaction data.",
  "zero trust": "Zero trust security (also, zero trust architecture, zero trust network architecture, ZTNA, zero trust network access) describes a strategic approach to cybersecurity that secures an organization by eliminating implicit trust and continuously validating every stage of digital interaction.",
  "identity management": "Identity management (IdM), also known as identity and access management (IAM or IdAM), is a framework of policies and technologies for ensuring that the proper people in an enterprise have the appropriate access to technology resources.",
  "vulnerability management": "Vulnerability management is the \"cyclical practice of identifying, classifying, prioritizing, remediating, and mitigating\" software vulnerabilities.",
  "threat hunting": "Cyber threat hunting is an active cyber defence activity. It is \"the process of proactively and iteratively searching through networks to detect and isolate advanced threats that evade existing security solutions.\"",
  "digital forensics": "Digital forensics (sometimes known as digital forensic science) is a branch of forensic science encompassing the recovery and investigation of material found in digital devices, often in relation to computer crime.",
  "steganography": "Steganography is the practice of concealing a file, message, image, or video within another file, message, image, or video.",
  "social engineering": "In the context of information security, social engineering is the psychological manipulation of people into performing actions or divulging confidential information.",
  "reverse engineering": "Reverse engineering (also known as backwards engineering or back engineering) is a process or method through which one attempts to understand through deductive reasoning how a previously made device, process, system, or piece of software accomplishes a task with very little (if any) insight into exactly how it does so.",
  "malware analysis": "Malware analysis is the process of determining the functionality, origin and potential impact of a given malware sample such as a virus, worm, Trojan horse, rootkit, or backdoor.",
  "cryptography": "Cryptography, or cryptology, is the practice and study of techniques for secure communication in the presence of third parties called adversaries.",
  "hashing": "Hashing is the process of transforming any given key or a string of characters into another value. This is usually represented by a shorter, fixed-length value or key that represents and makes it easier to find or employ the original string.",
  "salting": "In cryptography, a salt is random data that is used as an additional input to a one-way function that hashes data, a password or passphrase.",
  "rainbow table": "A rainbow table is a precomputed table for caching the output of cryptographic hash functions, usually for cracking password hashes.",
  "vpn": "A virtual private network (VPN) extends a private network across a public network and enables users to send and receive data across shared or public networks as if their computing devices were directly connected to the private network.",
  "proxy": "In computer networking, a proxy server is a server application or appliance that acts as an intermediary for requests from clients seeking resources from other servers.",
  "tor": "Tor is free and open-source software for enabling anonymous communication. It directs Internet traffic through a free, worldwide, volunteer overlay network, consisting of more than seven thousand relays, for concealing a user's location and usage from anyone conducting network surveillance or traffic analysis.",
  "dark web": "The dark web is the World Wide Web content that exists on darknets: overlay networks that use the Internet but require specific software, configurations, or authorization to access.",
  "deep web": "The deep web, invisible web, or hidden web are parts of the World Wide Web whose contents are not indexed by standard web search-engines.",
  "surface web": "The surface web (also known as the Visible Web, Indexed Web, Indexable Web or Lightnet) is the portion of the World Wide Web that is readily available to the general public and searchable with standard web search engines.",
  "osint": "Open-source intelligence (OSINT) is a multi-methods (qualitative, quantitative) methodology for collecting, analyzing and making decisions about data accessible in publicly available sources to be used in an intelligence context.",
  "shodan": "Shodan is a search engine that lets the user find specific types of computers (webcams, routers, servers, etc.) connected to the internet using a variety of filters.",
  "kali linux": "Kali Linux is a Debian-derived Linux distribution designed for digital forensics and penetration testing.",
  "parrot os": "Parrot OS is a Linux distribution based on Debian with a focus on security, privacy, and development.",
  "blackarch": "BlackArch is an Arch Linux-based penetration testing distribution for penetration testers and security researchers.",
  "tails": "Tails, or The Amnesic Incognito Live System, is a security-focused Debian-based Linux distribution aimed at preserving privacy and anonymity.",
  "whonix": "Whonix is a Debian-based security-focused Linux distribution.",
  "qubes os": "Qubes OS is a security-focused desktop operating system that aims to provide security through isolation.",
  "sandbox": "In computer security, a sandbox is a security mechanism for separating running programs, usually in an effort to mitigate system failures or software vulnerabilities from spreading.",
  "virtual machine": "In computing, a virtual machine (VM) is the virtualization or emulation of a computer system.",
  "container": "In software engineering, containerization is OS-level virtualization method used to deploy and run distributed applications without launching an entire VM for each app.",
  "docker": "Docker is a set of platform as a service products that use OS-level virtualization to deliver software in packages called containers.",
  "kubernetes": "Kubernetes is an open-source container-orchestration system for automating computer application deployment, scaling, and management.",
  "devsecops": "DevSecOps is short for software development, security, and operations. It's an approach to culture, automation, and platform design that integrates security as a shared responsibility throughout the entire IT lifecycle.",
  "owasp": "The Open Web Application Security Project (OWASP) is an online community that produces freely-available articles, methodologies, documentation, tools, and technologies in the field of web application security.",
  "mitre att&ck": "MITRE ATT&CK is a globally-accessible knowledge base of adversary tactics and techniques based on real-world observations.",
  "nist": "The National Institute of Standards and Technology (NIST) is a physical sciences laboratory and a non-regulatory agency of the United States Department of Commerce.",
  "iso 27001": "ISO/IEC 27001 is an international standard on how to manage information security.",
  "gdpr": "The General Data Protection Regulation (GDPR) is a regulation in EU law on data protection and privacy in the European Union and the European Economic Area.",
  "hipaa": "The Health Insurance Portability and Accountability Act of 1996 (HIPAA) is a federal law that required the creation of national standards to protect sensitive patient health information from being disclosed without the patient's consent or knowledge.",
  "pci dss": "The Payment Card Industry Data Security Standard (PCI DSS) is an information security standard for organizations that handle branded credit cards from the major card schemes.",
  "soc2": "SOC 2 is a voluntary compliance standard for service organizations, developed by the American Institute of CPAs (AICPA), which specifies how organizations should manage customer data.",
};

export class CyberAiService {
  private ai: GoogleGenAI | null = null;
  private model: any = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'undefined' && apiKey !== '') {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  private getOfflineResponse(input: string): string {
    const lowercaseInput = input.toLowerCase();
    
    // Check for direct matches in the knowledge base
    for (const [key, value] of Object.entries(OFFLINE_KNOWLEDGE_BASE)) {
      if (lowercaseInput.includes(key)) {
        return `[NEURAL_CORE_OFFLINE] **${key.toUpperCase()} ANALYSIS:**\n\n${value}\n\n*Note: Neural link is currently offline. Providing heuristic data from local archives.*`;
      }
    }

    // Generic offline responses
    const genericResponses = [
      "Neural link established. Analyzing request through local heuristic engine...",
      "System core remains optimal. Heuristic analysis suggests no immediate threat.",
      "Accessing local encrypted archives... Data retrieved successfully.",
      "Security protocol verified. Your anonymity is preserved within the local sector.",
      "Processing input stream... Heuristic confidence level: 84%.",
      "Neural core v4.2.0-stable online. Awaiting further instructions.",
      "Warning: Neural link to global intelligence is currently severed. Using local definitions.",
      "System status: Nominal. All local encryption modules are operating within parameters."
    ];

    return `[NEURAL_CORE_OFFLINE] ${genericResponses[Math.floor(Math.random() * genericResponses.length)]}`;
  }

  async sendMessage(messages: ChatMessage[]): Promise<string> {
    if (!this.ai) {
      // Return offline response for the last message
      const lastMessage = messages[messages.length - 1].text;
      return this.getOfflineResponse(lastMessage);
    }

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        }
      });

      return response.text || "Neural core failed to generate a response. Please retry.";
    } catch (error) {
      console.error("CyberAiService Error:", error);
      const lastMessage = messages[messages.length - 1].text;
      return this.getOfflineResponse(lastMessage);
    }
  }

  async generateTTS(text: string): Promise<string | null> {
    if (!this.ai) return null;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say professionally and clearly: ${text}` }] }],
        config: {
          responseModalities: ['AUDIO' as any],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    } catch (error) {
      console.error("TTS Generation Error:", error);
      return null;
    }
  }
}

export const cyberAi = new CyberAiService();
