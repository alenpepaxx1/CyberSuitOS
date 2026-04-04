/* COPYRIGHT ALEN PEPA */
export type ToolId = 'dashboard' | 'passwords' | 'crypto' | 'network' | 'payloads' | 'stego' | 'scanner' | 'settings' | 'anonymous-chat' | 'topology' | 'cyber-range' | 'phishing' | 'python-lab' | 'dorks';

export interface Tool {
  id: ToolId;
  name: string;
  icon: string;
  description: string;
}

export interface SecurityNews {
  title: string;
  source: string;
  date: string;
  link: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}
