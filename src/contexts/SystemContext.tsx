/* COPYRIGHT ALEN PEPA */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SystemStats {
  cpu: number;
  ram: number;
  memory: number;
  uptime: number;
  hostname: string;
  platform: string;
  arch: string;
  loadAvg: number[];
  totalMem: number;
  freeMem: number;
}

interface SystemContextType {
  stats: SystemStats | null;
  activeTool: string;
  setActiveTool: (tool: string) => void;
  toolTarget: string;
  setToolTarget: (target: string) => void;
  isSystemReady: boolean;
  alerts: any[];
  addAlert: (alert: any) => void;
  refreshStats: () => Promise<void>;
  // Config
  theme: string;
  setTheme: (theme: string) => void;
  showScanlines: boolean;
  setShowScanlines: (show: boolean) => void;
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
  firewallEnabled: boolean;
  setFirewallEnabled: (enabled: boolean) => void;
  vpnEnabled: boolean;
  setVpnEnabled: (enabled: boolean) => void;
  userName: string;
  setUserName: (name: string) => void;
  clearanceLevel: number;
  setClearanceLevel: (level: number) => void;
}

const SystemContext = createContext<SystemContextType | undefined>(undefined);

export const SystemProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [activeTool, setActiveTool] = useState('dashboard');
  const [toolTarget, setToolTarget] = useState('');
  const [isSystemReady, setIsSystemReady] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);

  // Config State
  const [theme, setTheme] = useState('default');
  const [showScanlines, setShowScanlines] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [firewallEnabled, setFirewallEnabled] = useState(true);
  const [vpnEnabled, setVpnEnabled] = useState(false);
  const [userName, setUserName] = useState('ADMIN_ROOT');
  const [clearanceLevel, setClearanceLevel] = useState(4);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
      if (response.ok) {
        const data = await response.json();
        setStats({
          ...data,
          ram: data.ram || data.memory // Ensure ram exists
        });
        setIsSystemReady(true);
      }
    } catch (error) {
      console.error('Failed to fetch system stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const addAlert = (alert: any) => {
    setAlerts(prev => [alert, ...prev].slice(0, 50));
  };

  return (
    <SystemContext.Provider value={{ 
      stats, 
      activeTool, 
      setActiveTool, 
      toolTarget,
      setToolTarget,
      isSystemReady, 
      alerts, 
      addAlert,
      refreshStats: fetchStats,
      theme,
      setTheme,
      showScanlines,
      setShowScanlines,
      showGrid,
      setShowGrid,
      firewallEnabled,
      setFirewallEnabled,
      vpnEnabled,
      setVpnEnabled,
      userName,
      setUserName,
      clearanceLevel,
      setClearanceLevel
    }}>
      {children}
    </SystemContext.Provider>
  );
};

export const useSystem = () => {
  const context = useContext(SystemContext);
  if (context === undefined) {
    throw new Error('useSystem must be used within a SystemProvider');
  }
  return context;
};
