/* COPYRIGHT ALEN PEPA */
import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  Shield, Server, Laptop, Router, AlertTriangle, 
  Info, Activity, Zap, Globe, Database, Cpu, 
  Lock, Unlock, Radio, Wifi, Search, RefreshCw,
  Maximize2, Minimize2, ZoomIn, ZoomOut, X,
  Plus, Minus, Maximize
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface Node extends d3.SimulationNodeDatum {
  id: string;
  type: 'server' | 'laptop' | 'router' | 'firewall' | 'database' | 'cloud' | 'iot';
  status: 'secure' | 'vulnerable' | 'compromised';
  label: string;
  ip?: string;
  os?: string;
  uptime?: string;
  traffic?: number;
  threatLevel?: number;
  cpuUsage?: number;
  memUsage?: number;
  lastSeen?: string;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
  value?: number;
  active?: boolean;
  bandwidth?: number;
  latency?: number;
}

export default function NetworkTopology() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [activeAttacks, setActiveAttacks] = useState<{from: string, to: string}[]>([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [stats, setStats] = useState({
    totalNodes: 0,
    compromised: 0,
    vulnerable: 0,
    traffic: '0 KB/s',
    avgLatency: '0ms',
    uptime: '99.9%'
  });

  const [filter, setFilter] = useState<'all' | 'compromised' | 'vulnerable'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchNetworkData = async () => {
    try {
      const res = await fetch('/api/network');
      const data = await res.json();
      
      setNodes(data.nodes.map((n: any) => ({
        ...n,
        cpuUsage: Math.floor(Math.random() * 100),
        memUsage: Math.floor(Math.random() * 100),
        lastSeen: new Date().toLocaleTimeString()
      })));
      setLinks(data.links.map((l: any) => ({
        ...l,
        bandwidth: Math.floor(Math.random() * 1000),
        latency: Math.floor(Math.random() * 50)
      })));
      
      setStats({
        totalNodes: data.nodes.length,
        compromised: data.nodes.filter((n: any) => n.status === 'compromised').length,
        vulnerable: data.nodes.filter((n: any) => n.status === 'vulnerable').length,
        traffic: `${(Math.random() * 500 + 100).toFixed(1)} KB/s`,
        avgLatency: `${(Math.random() * 20 + 5).toFixed(1)}ms`,
        uptime: '99.98%'
      });

      setIsLoading(false);
    } catch (e) {
      console.error("Failed to fetch network data:", e);
      setIsLoading(false);
    }
  };

  const handleNodeAction = async (action: 'isolate' | 'remediate' | 'scan') => {
    if (!selectedNode) return;
    
    try {
      const res = await fetch('/api/network/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeId: selectedNode.id, action })
      });
      const data = await res.json();
      
      if (data.success) {
        // Update local state for immediate feedback
        if (action === 'isolate') {
          setLinks(prev => prev.filter(l => 
            (typeof l.source === 'string' ? l.source !== selectedNode.id : l.source.id !== selectedNode.id) && 
            (typeof l.target === 'string' ? l.target !== selectedNode.id : l.target.id !== selectedNode.id)
          ));
        }
        
        fetchNetworkData();
        
        // Log to terminal
        const event = new CustomEvent('terminal-log', { 
          detail: { 
            message: `[NET_TOPOLOGY] ${data.message}`, 
            level: action === 'scan' ? 'info' : 'success' 
          } 
        });
        window.dispatchEvent(event);
      }
    } catch (e) {
      console.error("Action failed:", e);
    }
  };

  useEffect(() => {
    fetchNetworkData();
    const interval = setInterval(fetchNetworkData, 15000);
    
    // Attack simulation
    const attackInterval = setInterval(() => {
      const compromised = nodes.filter(n => n.status === 'compromised');
      if (compromised.length > 0) {
        const attacker = compromised[Math.floor(Math.random() * compromised.length)];
        const neighbors = links
          .filter(l => (typeof l.source === 'string' ? l.source === attacker.id : l.source.id === attacker.id) || 
                       (typeof l.target === 'string' ? l.target === attacker.id : l.target.id === attacker.id))
          .map(l => {
            const sId = typeof l.source === 'string' ? l.source : l.source.id;
            const tId = typeof l.target === 'string' ? l.target : l.target.id;
            return sId === attacker.id ? tId : sId;
          });
          
        if (neighbors.length > 0) {
          const targetId = neighbors[Math.floor(Math.random() * neighbors.length)];
          setActiveAttacks(prev => [...prev, { from: attacker.id, to: targetId as string }]);
          setTimeout(() => {
            setActiveAttacks(prev => prev.filter(a => a.from !== attacker.id || a.to !== targetId));
          }, 3000);
        }
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      clearInterval(attackInterval);
    };
  }, [nodes, links]);

  const handleScan = () => {
    setIsScanning(true);
    // Simulate a deep scan that might find new vulnerabilities
    setTimeout(() => {
      setIsScanning(false);
      fetchNetworkData();
      const event = new CustomEvent('terminal-log', { 
        detail: { message: "[NET_TOPOLOGY] Deep network scan complete. Heuristics updated.", level: 'success' } 
      });
      window.dispatchEvent(event);
    }, 3000);
  };

  useEffect(() => {
    // Filter nodes and links
    const filteredNodes = nodes.filter(n => {
      const matchesFilter = filter === 'all' || n.status === filter;
      const matchesSearch = n.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           n.ip?.includes(searchQuery);
      return matchesFilter && matchesSearch;
    });

    const filteredLinks = links.filter(l => {
      const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
      const targetId = typeof l.target === 'string' ? l.target : l.target.id;
      return filteredNodes.some(n => n.id === sourceId) && filteredNodes.some(n => n.id === targetId);
    });

    if (!svgRef.current || filteredNodes.length === 0) return;

    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Initialize persistent groups if they don't exist
    if (svg.select('defs').empty()) {
      const defs = svg.append('defs');
      
      // Glow filter
      const filterDef = defs.append('filter')
        .attr('id', 'glow')
        .attr('x', '-50%')
        .attr('y', '-50%')
        .attr('width', '200%')
        .attr('height', '200%');

      filterDef.append('feGaussianBlur')
        .attr('stdDeviation', '3')
        .attr('result', 'blur');
      filterDef.append('feComposite')
        .attr('in', 'SourceGraphic')
        .attr('in2', 'blur')
        .attr('operator', 'over');

      // Hexagon clip path
      defs.append('clipPath')
        .attr('id', 'hex-clip')
        .append('path')
        .attr('d', 'M20,0 L37.32,10 L37.32,30 L20,40 L2.68,30 L2.68,10 Z');

      // Radar Gradient
      const radarGradient = defs.append('linearGradient')
        .attr('id', 'radar-gradient')
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '100%')
        .attr('y2', '0%');
      radarGradient.append('stop').attr('offset', '0%').attr('stop-color', '#06b6d4').attr('stop-opacity', 0.8);
      radarGradient.append('stop').attr('offset', '100%').attr('stop-color', '#06b6d4').attr('stop-opacity', 0);
    }

    let mainG = svg.select<SVGGElement>('g.main-group');
    if (mainG.empty()) {
      mainG = svg.append('g').attr('class', 'main-group');
      
      // Data Stream Layer (Background)
      const streamGroup = mainG.append('g').attr('class', 'data-streams');
      for (let i = 0; i < 20; i++) {
        streamGroup.append('line')
          .attr('x1', -2000)
          .attr('y1', -1000 + i * 100)
          .attr('x2', 2000)
          .attr('y2', -1000 + i * 100)
          .attr('stroke', '#06b6d4')
          .attr('stroke-width', 0.3)
          .attr('opacity', 0.03)
          .attr('stroke-dasharray', '5,15')
          .style('animation', `data-flow ${20 + Math.random() * 20}s linear infinite`);
      }

      // Radar Background (Static)
      const radarGroup = mainG.append('g').attr('class', 'radar-background');
      for (let i = 1; i <= 6; i++) {
        radarGroup.append('circle')
          .attr('cx', 0)
          .attr('cy', 0)
          .attr('r', i * 120)
          .attr('fill', 'none')
          .attr('stroke', '#06b6d4')
          .attr('stroke-width', 0.5)
          .attr('opacity', 0.1)
          .attr('stroke-dasharray', i % 2 === 0 ? '2,4' : 'none');
      }
      radarGroup.append('line').attr('x1', -800).attr('y1', 0).attr('x2', 800).attr('y2', 0).attr('stroke', '#06b6d4').attr('stroke-width', 0.5).attr('opacity', 0.1);
      radarGroup.append('line').attr('x1', 0).attr('y1', -800).attr('x2', 0).attr('y2', 800).attr('stroke', '#06b6d4').attr('stroke-width', 0.5).attr('opacity', 0.1);

      // Radar sweep with CSS animation
      radarGroup.append('path')
        .attr('d', 'M0,0 L0,-800 A800,800 0 0,1 207,-772 Z')
        .attr('fill', 'url(#radar-gradient)')
        .attr('opacity', 0.3)
        .style('transform-origin', '0 0')
        .style('animation', 'radar-rotate 10s linear infinite');

      // Add CSS for radar rotation if not present
      if (document.getElementById('radar-style') === null) {
        const style = document.createElement('style');
        style.id = 'radar-style';
        style.innerHTML = `
          @keyframes radar-rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes attack-dash {
            to { stroke-dashoffset: -20; }
          }
          @keyframes pulse-ring {
            0% { transform: scale(1); opacity: 1; }
            100% { transform: scale(1.6); opacity: 0; }
          }
          @keyframes data-flow {
            from { stroke-dashoffset: 100; }
            to { stroke-dashoffset: 0; }
          }
          @keyframes scan-line {
            0% { transform: translateY(-100%); opacity: 0; }
            50% { opacity: 0.5; }
            100% { transform: translateY(1000%); opacity: 0; }
          }
          @keyframes glitch-flicker {
            0% { opacity: 1; }
            50% { opacity: 0.8; }
            100% { opacity: 1; }
          }
          @keyframes circuit-pulse {
            0% { stroke-dashoffset: 200; opacity: 0.2; }
            50% { opacity: 0.8; }
            100% { stroke-dashoffset: 0; opacity: 0.2; }
          }
        `;
        document.head.appendChild(style);
      }
    }

    // Dynamic layers
    mainG.selectAll('.dynamic-layer').remove();
    const linkGroup = mainG.append('g').attr('class', 'dynamic-layer links');
    const packetGroup = mainG.append('g').attr('class', 'dynamic-layer packets');
    const attackGroup = mainG.append('g').attr('class', 'dynamic-layer attacks');
    const nodeGroup = mainG.append('g').attr('class', 'dynamic-layer nodes');

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.05, 5])
      .on('zoom', (event) => {
        mainG.attr('transform', event.transform);
        setZoomLevel(event.transform.k);
      });
    zoomRef.current = zoom;
    svg.call(zoom);

    const simulation = d3.forceSimulation<Node>(filteredNodes)
      .alphaDecay(0.1)
      .velocityDecay(0.6)
      .force('link', d3.forceLink<Node, Link>(filteredLinks).id(d => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-1000))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('x', d3.forceX(width / 2).strength(0.1))
      .force('y', d3.forceY((d: any) => {
        const id = d.id;
        if (id === 'internet') return height * 0.1;
        if (id === 'ext-fw') return height * 0.25;
        if (['dmz-switch', 'web-01', 'web-02', 'vpn-gw'].includes(id)) return height * 0.4;
        if (id === 'int-fw') return height * 0.55;
        if (id === 'core-switch') return height * 0.7;
        return height * 0.85;
      }).strength(0.8))
      .force('collision', d3.forceCollide().radius(90));

    // Layer Labels
    const layers = [
      { y: height * 0.1, label: 'External / WAN' },
      { y: height * 0.25, label: 'Edge Security' },
      { y: height * 0.4, label: 'DMZ / Public Services' },
      { y: height * 0.55, label: 'Internal Security' },
      { y: height * 0.7, label: 'Core Infrastructure' },
      { y: height * 0.85, label: 'Internal Assets' }
    ];

    mainG.selectAll('.layer-indicator').remove();
    const layerGroup = mainG.append('g').attr('class', 'layer-indicator').lower();
    
    layers.forEach(layer => {
      layerGroup.append('line')
        .attr('x1', -width * 2)
        .attr('y1', layer.y)
        .attr('x2', width * 3)
        .attr('y2', layer.y)
        .attr('stroke', '#06b6d4')
        .attr('stroke-width', 0.5)
        .attr('stroke-dasharray', '5,15')
        .attr('opacity', 0.05);

      layerGroup.append('text')
        .attr('x', 40)
        .attr('y', layer.y - 15)
        .attr('fill', '#06b6d4')
        .attr('font-size', '10px')
        .attr('font-family', 'monospace')
        .attr('opacity', 0.2)
        .attr('text-anchor', 'start')
        .text(layer.label.toUpperCase());
    });

    // Links
    const link = linkGroup
      .selectAll('path')
      .data(filteredLinks)
      .join('path')
      .attr('id', (d, i) => `link-${i}`)
      .attr('fill', 'none')
      .attr('stroke', d => {
        const source = d.source as Node;
        const target = d.target as Node;
        if (source.status === 'compromised' || target.status === 'compromised') return '#ef4444';
        if (source.status === 'vulnerable' || target.status === 'vulnerable') return '#f59e0b';
        return '#06b6d4';
      })
      .attr('stroke-width', d => {
        const source = d.source as Node;
        const target = d.target as Node;
        return (source.status === 'compromised' || target.status === 'compromised') ? 2.5 : 1.2;
      })
      .attr('stroke-dasharray', d => {
        const source = d.source as Node;
        const target = d.target as Node;
        return (source.status === 'compromised' || target.status === 'compromised') ? '5,5' : 'none';
      })
      .attr('opacity', 0.4)
      .style('animation', 'circuit-pulse 4s linear infinite');

    // Packet Animation
    const animatePackets = () => {
      packetGroup.selectAll('g').remove();
      filteredLinks.forEach((l, i) => {
        const source = l.source as Node;
        const target = l.target as Node;
        if (Math.random() > 0.15) {
          const isCompromised = source.status === 'compromised' || target.status === 'compromised';
          const pG = packetGroup.append('g');
          const duration = 3 + Math.random() * 5;
          pG.append('circle').attr('r', isCompromised ? 3.5 : 2.5).attr('fill', isCompromised ? '#ef4444' : '#06b6d4').attr('filter', 'url(#glow)')
            .append('animateMotion').attr('dur', `${duration}s`).attr('repeatCount', 'indefinite').append('mpath').attr('xlink:href', `#link-${i}`);
        }
      });
    };
    animatePackets();

    // Attack Lines
    const attackLine = attackGroup
      .selectAll('line')
      .data(activeAttacks.filter(a => filteredNodes.some(n => n.id === a.from) && filteredNodes.some(n => n.id === a.to)))
      .join('line')
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 4)
      .attr('stroke-dasharray', '8,4')
      .attr('opacity', 0.9)
      .attr('filter', 'url(#glow)');

    attackLine
      .style('animation', 'attack-dash 1.5s linear infinite');

    // Nodes
    const node = nodeGroup
      .selectAll('g')
      .data(filteredNodes)
      .join('g')
      .attr('cursor', 'pointer')
      .call(d3.drag<SVGGElement, Node>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended))
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedNode(d);
      })
      .on('mouseover', function(event, d) {
        d3.select(this).select('.node-bg').attr('fill', '#111').attr('stroke-width', 3);
        d3.select(this).select('.node-label').attr('fill', '#fff').attr('font-weight', 'bold');
        
        // Add temporary scanning ring on hover
        d3.select(this).append('circle')
          .attr('class', 'hover-ring')
          .attr('r', 35)
          .attr('fill', 'none')
          .attr('stroke', '#06b6d4')
          .attr('stroke-width', 1.5)
          .attr('opacity', 0)
          .transition()
          .duration(300)
          .attr('opacity', 0.6)
          .attr('r', 45);
      })
      .on('mouseout', function(event, d) {
        d3.select(this).select('.node-bg').attr('fill', '#050505').attr('stroke-width', 2);
        d3.select(this).select('.node-label').attr('fill', '#888').attr('font-weight', 'normal');
        d3.select(this).selectAll('.hover-ring').remove();
      });

    // Node outer ring (pulse for compromised)
    node.filter(d => d.status === 'compromised')
      .append('circle')
      .attr('r', 32)
      .attr('fill', 'none')
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 2.5)
      .style('transform-origin', '0 0')
      .style('animation', 'pulse-ring 2.5s ease-out infinite');

    // Glitch effect for compromised nodes
    node.filter(d => d.status === 'compromised')
      .style('animation', 'glitch-flicker 2s ease-in-out infinite');

    // Node background (Hexagon)
    node.append('path')
      .attr('class', 'node-bg')
      .attr('d', 'M0,-30 L25.98,-15 L25.98,15 L0,30 L-25.98,15 L-25.98,-15 Z')
      .attr('fill', '#050505')
      .attr('stroke', d => {
        if (d.status === 'secure') return '#10b981';
        if (d.status === 'vulnerable') return '#f59e0b';
        return '#ef4444';
      })
      .attr('stroke-width', 2)
      .attr('filter', 'url(#glow)')
      .style('transition', 'all 0.3s ease');

    // Node Icons using foreignObject for React/Lucide integration
    node.append('foreignObject')
      .attr('x', -15)
      .attr('y', -15)
      .attr('width', 30)
      .attr('height', 30)
      .style('pointer-events', 'none')
      .html(d => {
        const color = d.status === 'secure' ? '#10b981' : d.status === 'vulnerable' ? '#f59e0b' : '#ef4444';
        let icon = '';
        if (d.type === 'server') icon = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>`;
        else if (d.type === 'router') icon = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><rect width="20" height="11" x="2" y="7" rx="2" ry="2"/><path d="M15 18v2a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-2"/><path d="M15 12h.01"/><path d="M18 12h.01"/><path d="M12 12h.01"/><path d="M9 12h.01"/><path d="M6 12h.01"/></svg>`;
        else if (d.type === 'firewall') icon = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>`;
        else if (d.type === 'database') icon = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>`;
        else if (d.type === 'cloud') icon = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19x.5.5 0 0 1 .5-.5c2.2 0 4-1.8 4-4 0-2.1-1.6-3.8-3.6-4a7.5 7.5 0 0 0-14.4 2C2.8 12.9 2 14.4 2 16c0 2.2 1.8 4 4 4h11.5z"/></svg>`;
        else if (d.type === 'iot') icon = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12s2.545-5 7-5c4.454 0 7 5 7 5s-2.546 5-7 5c-4.455 0-7-5-7-5z"/><circle cx="12" cy="12" r="3"/></svg>`;
        else icon = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="12" x="3" y="4" rx="2" ry="2"/><line x1="2" x2="22" y1="20" y2="20"/></svg>`;
        return `<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">${icon}</div>`;
      });

    // Node labels
    node.append('text')
      .attr('class', 'node-label')
      .attr('dy', 45)
      .attr('text-anchor', 'middle')
      .text(d => d.label)
      .attr('fill', '#888')
      .attr('font-size', '11px')
      .attr('font-family', 'monospace')
      .style('transition', 'fill 0.3s ease');

    // IP labels (only if zoomed in)
    node.append('text')
      .attr('dy', 58)
      .attr('text-anchor', 'middle')
      .text(d => d.ip || '')
      .attr('fill', '#555')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .attr('opacity', zoomLevel > 1.2 ? 1 : 0);

    const updatePositions = () => {
      link.attr('d', (d: any) => {
        const sourceX = d.source.x;
        const sourceY = d.source.y;
        const targetX = d.target.x;
        const targetY = d.target.y;
        
        const midY = (sourceY + targetY) / 2;
        return `M${sourceX},${sourceY} C${sourceX},${midY} ${targetX},${midY} ${targetX},${targetY}`;
      });

      node
        .attr('transform', d => `translate(${d.x},${d.y})`);
        
      attackLine
        .attr('x1', d => {
          const source = filteredNodes.find(n => n.id === d.from);
          return source?.x || 0;
        })
        .attr('y1', d => {
          const source = filteredNodes.find(n => n.id === d.from);
          return source?.y || 0;
        })
        .attr('x2', d => {
          const target = filteredNodes.find(n => n.id === d.to);
          return target?.x || 0;
        })
        .attr('y2', d => {
          const target = filteredNodes.find(n => n.id === d.to);
          return target?.y || 0;
        });
    };

    // Pre-calculate layout for a static feel
    for (let i = 0; i < 300; ++i) simulation.tick();
    updatePositions();

    simulation.on('tick', updatePositions);

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    // Handle resize
    const handleResize = () => {
      const newWidth = containerRef.current?.clientWidth || 800;
      const newHeight = containerRef.current?.clientHeight || 600;
      svg.attr('width', newWidth).attr('height', newHeight);
      simulation.force('center', d3.forceCenter(newWidth / 2, newHeight / 2)).alpha(0.3).restart();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      simulation.stop();
      window.removeEventListener('resize', handleResize);
    };
  }, [nodes, zoomLevel, activeAttacks, filter, searchQuery]);

  return (
    <div className={cn(
      "flex flex-col cyber-card rounded-lg overflow-hidden bg-[#020202] backdrop-blur-sm border border-cyber-border relative",
      isFullScreen ? "fixed inset-0 z-50 h-screen w-screen rounded-none" : "h-full",
      "before:content-[''] before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] before:pointer-events-none before:z-[5]",
      "after:content-[''] after:absolute after:inset-0 after:bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] after:bg-[length:100%_2px,3px_100%] after:pointer-events-none after:z-[6]"
    )}>
      {/* HUD Scan Line */}
      <div className="absolute inset-0 pointer-events-none z-[7] opacity-10">
        <div className="w-full h-1 bg-cyber-green/30 blur-[2px] animate-[scan-line_8s_linear_infinite]" />
      </div>

      <div className="corner-accent corner-tl" />
      <div className="corner-accent corner-tr" />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between p-4 gap-4 border-b border-cyber-border bg-cyber-card/40 z-10">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="p-2 bg-cyber-green/10 rounded-lg border border-cyber-green/20">
            <Globe className="w-5 h-5 text-cyber-green" />
          </div>
          <div>
            <h2 className="text-sm font-mono font-bold uppercase tracking-widest text-cyber-header">Network Topology</h2>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-pulse" />
              <span className="text-[10px] font-mono text-cyber-green/60 uppercase">Real-time Monitoring Active</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          {/* Search and Filter */}
          <div className="flex items-center gap-2 bg-black/40 border border-cyber-border rounded-lg px-3 py-1.5 w-full md:w-64">
            <Search size={14} className="text-cyber-green/50" />
            <input 
              type="text" 
              placeholder="Search nodes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none focus:outline-none text-xs font-mono text-cyber-green w-full placeholder:text-cyber-green/20"
            />
          </div>

          <div className="flex items-center gap-1 bg-black/40 border border-cyber-border rounded-lg p-1">
            {(['all', 'compromised', 'vulnerable'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-2 py-1 rounded text-[9px] font-mono uppercase transition-all",
                  filter === f ? "bg-cyber-green/20 text-cyber-green" : "text-cyber-text/40 hover:text-cyber-text/80"
                )}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="hidden lg:flex gap-4 border-l border-cyber-border pl-4">
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-mono text-cyber-text/60 uppercase">Traffic</span>
              <span className="text-xs font-mono text-cyber-green">{stats.traffic}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-mono text-cyber-text/60 uppercase">Latency</span>
              <span className="text-xs font-mono text-cyan-400">{stats.avgLatency}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-mono text-red-500 uppercase">Breaches</span>
              <span className="text-xs font-mono text-red-500">{stats.compromised}</span>
            </div>
          </div>
          
          <div className="flex gap-2 ml-auto">
            <button 
              onClick={handleScan}
              disabled={isScanning}
              className={cn(
                "p-2 rounded-lg border transition-all flex items-center gap-2",
                isScanning 
                  ? "bg-cyber-green/20 border-cyber-green/40 text-cyber-green" 
                  : "bg-cyber-card/5 border-cyber-border text-cyber-text/60 hover:text-cyber-header hover:bg-cyber-card/10"
              )}
            >
              <Zap size={14} className={isScanning ? "animate-pulse" : ""} />
              <span className="text-[10px] font-mono uppercase hidden sm:inline">Deep Scan</span>
            </button>
            <button 
              onClick={fetchNetworkData}
              className="p-2 bg-cyber-card/5 border border-cyber-border rounded-lg text-cyber-text/60 hover:text-cyber-header hover:bg-cyber-card/10 transition-all"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Visualization Area */}
      <div 
        ref={containerRef} 
        className={cn(
          "flex-1 relative overflow-hidden transition-colors duration-1000",
          stats.compromised > 0 
            ? "bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-black to-black" 
            : "bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900/10 via-black to-black"
        )}
      >
        {/* Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d415_1px,transparent_1px),linear-gradient(to_bottom,#06b6d415_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)] pointer-events-none" />
        
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-cyber-bg/60 backdrop-blur-sm z-20">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 border-2 border-cyan-500/20 rounded-full" />
                <div className="absolute inset-0 w-16 h-16 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                <Globe className="absolute inset-0 m-auto w-6 h-6 text-cyan-400 animate-pulse" />
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xs font-mono text-cyan-400 tracking-[0.2em] uppercase">Initializing Neural Map</span>
                <span className="text-[10px] font-mono text-cyan-500/40 mt-1">Mapping network interfaces...</span>
              </div>
            </div>
          </div>
        )}

        {isScanning && (
          <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
            <div className="absolute inset-0 bg-cyan-500/5 animate-pulse" />
            <motion.div 
              initial={{ top: '-10%' }}
              animate={{ top: '110%' }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)] z-20"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[80%] h-[80%] border border-cyan-500/20 rounded-full animate-[ping_3s_linear_infinite]" />
            </div>
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-cyan-500/20 border border-cyan-500/40 rounded-full backdrop-blur-md shadow-[0_0_15px_rgba(34,211,238,0.3)]">
              <span className="text-[10px] font-mono text-cyan-400 animate-pulse uppercase tracking-widest">Active Deep Scan in Progress...</span>
            </div>
          </div>
        )}

        <svg 
          ref={svgRef} 
          className="w-full h-full"
          onClick={() => setSelectedNode(null)}
        />

        {/* Zoom Controls */}
        <div className="absolute bottom-6 left-6 flex flex-col gap-2 z-10">
          <button 
            onClick={() => {
              if (svgRef.current && zoomRef.current) {
                d3.select(svgRef.current).transition().duration(500).call(zoomRef.current.scaleBy as any, 1.5);
              }
            }}
            className="p-2 bg-cyber-card/60 border border-cyber-border rounded-lg text-cyber-text/60 hover:text-cyber-header hover:bg-cyber-card/80 transition-all shadow-xl"
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
          <button 
            onClick={() => {
              if (svgRef.current && zoomRef.current) {
                d3.select(svgRef.current).transition().duration(500).call(zoomRef.current.scaleBy as any, 0.667);
              }
            }}
            className="p-2 bg-cyber-card/60 border border-cyber-border rounded-lg text-cyber-text/60 hover:text-cyber-header hover:bg-cyber-card/80 transition-all shadow-xl"
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          <button 
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-2 bg-cyber-card/60 border border-cyber-border rounded-lg text-cyber-text/60 hover:text-cyber-header hover:bg-cyber-card/80 transition-all shadow-xl mt-2"
            title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
          >
            {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>

        {/* Full Screen Close Button */}
        {isFullScreen && (
          <button 
            onClick={() => setIsFullScreen(false)}
            className="absolute top-4 right-4 z-50 p-3 bg-red-500/20 backdrop-blur-md border border-red-500/50 rounded-full text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)]"
            title="Close Full Screen"
          >
            <X size={24} />
          </button>
        )}

        {/* Legend */}
        <div className="absolute bottom-6 right-6 p-4 bg-cyber-card/60 border border-cyber-border rounded-xl backdrop-blur-md z-10 shadow-xl">
          <h4 className="text-[10px] font-mono text-cyber-text/60 uppercase mb-3 tracking-widest">Node Status</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-mono text-cyber-text uppercase">Secure</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
              <span className="text-[10px] font-mono text-cyber-text uppercase">Vulnerable</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse" />
              <span className="text-[10px] font-mono text-cyber-text uppercase">Compromised</span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-6 left-6 p-4 bg-black/60 border border-cyber-border rounded-xl backdrop-blur-md z-20">
          <h4 className="text-[10px] font-mono text-cyber-header uppercase mb-3 tracking-widest">Node Status</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[9px] font-mono text-cyber-text/60 uppercase tracking-wider">Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
              <span className="text-[9px] font-mono text-cyber-text/60 uppercase tracking-wider">Vulnerable</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse" />
              <span className="text-[9px] font-mono text-cyber-text/60 uppercase tracking-wider">Compromised</span>
            </div>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-20">
          <button 
            onClick={() => zoomRef.current && d3.select(svgRef.current!).transition().call(zoomRef.current.scaleBy, 1.3)}
            className="p-2 bg-black/60 border border-cyber-border rounded-lg text-cyber-text/60 hover:text-cyber-header hover:bg-cyber-card/10 transition-all"
          >
            <Plus size={16} />
          </button>
          <button 
            onClick={() => zoomRef.current && d3.select(svgRef.current!).transition().call(zoomRef.current.scaleBy, 0.7)}
            className="p-2 bg-black/60 border border-cyber-border rounded-lg text-cyber-text/60 hover:text-cyber-header hover:bg-cyber-card/10 transition-all"
          >
            <Minus size={16} />
          </button>
          <button 
            onClick={() => zoomRef.current && d3.select(svgRef.current!).transition().call(zoomRef.current.transform, d3.zoomIdentity)}
            className="p-2 bg-black/60 border border-cyber-border rounded-lg text-cyber-text/60 hover:text-cyber-header hover:bg-cyber-card/10 transition-all"
          >
            <Maximize size={16} />
          </button>
        </div>

        {/* Network Health Dashboard */}
        <div className="absolute top-6 left-6 flex flex-col gap-4 z-20">
          <div className="p-4 bg-black/60 border border-cyber-border rounded-xl backdrop-blur-md w-48">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-mono text-cyber-text/60 uppercase">Network Health</span>
              <span className="text-[10px] font-mono text-cyber-green">94%</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-4">
              <div className="h-full bg-cyber-green w-[94%] shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col">
                <span className="text-[8px] font-mono text-cyber-text/40 uppercase">Nodes</span>
                <span className="text-xs font-mono text-cyber-header">{stats.totalNodes}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-mono text-cyber-text/40 uppercase">Uptime</span>
                <span className="text-xs font-mono text-cyan-400">{stats.uptime}</span>
              </div>
            </div>
          </div>
          
          <div className="p-3 bg-black/60 border border-cyber-border rounded-xl backdrop-blur-md flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
              <AlertTriangle size={14} className="text-red-500" />
            </div>
            <div>
              <span className="text-[8px] font-mono text-cyber-text/40 uppercase block">Active Threats</span>
              <span className="text-xs font-mono text-red-500">{stats.compromised} Detected</span>
            </div>
          </div>
        </div>

        {/* MiniMap Placeholder (Visual only for now) */}
        <div className="absolute top-6 left-56 w-32 h-32 bg-black/40 border border-cyber-border rounded-xl backdrop-blur-sm z-10 hidden xl:block overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="w-full h-full border border-cyber-green/20 grid grid-cols-4 grid-rows-4">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="border-[0.5px] border-cyber-green/10" />
              ))}
            </div>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-cyber-green rounded-full animate-ping" />
          <div className="absolute bottom-1 left-1 text-[7px] font-mono text-cyber-green/40 uppercase">Sector 7G</div>
        </div>

        {/* Detail Panel */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="absolute top-6 right-6 w-80 bg-black/90 border border-cyber-border rounded-2xl backdrop-blur-2xl z-30 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
            >
              {/* Panel Header */}
              <div className={cn(
                "p-4 flex items-center justify-between border-b relative overflow-hidden",
                selectedNode.status === 'secure' ? "bg-emerald-500/10 border-emerald-500/20" :
                selectedNode.status === 'vulnerable' ? "bg-amber-500/10 border-amber-500/20" :
                "bg-red-500/10 border-red-500/20"
              )}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_2s_infinite]" />
                <div className="flex items-center gap-3 relative z-10">
                  <div className={cn(
                    "p-2 rounded-lg shadow-lg",
                    selectedNode.status === 'secure' ? "bg-emerald-500/20 text-emerald-400" :
                    selectedNode.status === 'vulnerable' ? "bg-amber-500/20 text-amber-400" :
                    "bg-red-500/20 text-red-400"
                  )}>
                    {selectedNode.type === 'server' ? <Server size={18} /> :
                     selectedNode.type === 'router' ? <Router size={18} /> :
                     selectedNode.type === 'firewall' ? <Shield size={18} /> :
                     selectedNode.type === 'database' ? <Database size={18} /> :
                     selectedNode.type === 'cloud' ? <Globe size={18} /> :
                     selectedNode.type === 'iot' ? <Cpu size={18} /> :
                     <Laptop size={18} />}
                  </div>
                  <div>
                    <h3 className="text-sm font-mono font-bold text-cyber-header uppercase tracking-tight">{selectedNode.label}</h3>
                    <span className="text-[10px] font-mono text-cyber-text/60">{selectedNode.ip}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedNode(null)}
                  className="p-1 text-cyber-text/60 hover:text-cyber-header transition-colors relative z-10"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Panel Content */}
              <div className="p-5 space-y-6">
                {/* Resource Usage */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] font-mono uppercase">
                      <span className="text-cyber-text/60">CPU Load</span>
                      <span className="text-cyber-header">{selectedNode.cpuUsage}%</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${selectedNode.cpuUsage}%` }}
                        className={cn(
                          "h-full rounded-full",
                          selectedNode.cpuUsage! > 80 ? "bg-red-500" : selectedNode.cpuUsage! > 50 ? "bg-amber-500" : "bg-cyber-green"
                        )}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] font-mono uppercase">
                      <span className="text-cyber-text/60">Memory Usage</span>
                      <span className="text-cyber-header">{selectedNode.memUsage}%</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${selectedNode.memUsage}%` }}
                        className={cn(
                          "h-full rounded-full",
                          selectedNode.memUsage! > 80 ? "bg-red-500" : selectedNode.memUsage! > 50 ? "bg-amber-500" : "bg-cyan-500"
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <Activity size={12} className="text-cyber-green" />
                      <span className="text-[9px] font-mono text-cyber-text/60 uppercase">Traffic</span>
                    </div>
                    <span className="text-sm font-mono text-cyber-header">{selectedNode.traffic}%</span>
                  </div>
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield size={12} className={cn(
                        selectedNode.threatLevel! > 70 ? "text-red-500" : "text-emerald-500"
                      )} />
                      <span className="text-[9px] font-mono text-cyber-text/60 uppercase">Threat</span>
                    </div>
                    <span className="text-sm font-mono text-cyber-header">{selectedNode.threatLevel}%</span>
                  </div>
                </div>

                {/* System Info */}
                <div className="space-y-3 p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-cyber-text/60 uppercase">Operating System</span>
                    <span className="text-cyber-header">{selectedNode.os}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-cyber-text/60 uppercase">System Uptime</span>
                    <span className="text-cyber-header">{selectedNode.uptime}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-cyber-text/60 uppercase">Last Seen</span>
                    <span className="text-cyber-header">{selectedNode.lastSeen}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-cyber-text/60 uppercase">Status</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase",
                      selectedNode.status === 'secure' ? "bg-emerald-500/20 text-emerald-400" :
                      selectedNode.status === 'vulnerable' ? "bg-amber-500/20 text-amber-400" :
                      "bg-red-500/20 text-red-400"
                    )}>
                      {selectedNode.status}
                    </span>
                  </div>
                </div>

                {/* Analysis Box */}
                <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <Info size={14} className="text-cyan-400" />
                    <span className="text-[10px] font-mono text-white uppercase tracking-widest">Core Analysis</span>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-relaxed font-sans italic">
                    {selectedNode.status === 'secure' ? 
                      'Node integrity verified. All cryptographic signatures match. Traffic patterns are consistent with baseline behavior.' :
                      selectedNode.status === 'vulnerable' ?
                      'Potential entry point detected. Outdated software versions found. Immediate patching recommended to prevent lateral movement.' :
                      'ACTIVE BREACH DETECTED. Unauthorized access in progress. System isolation required to prevent data exfiltration.'
                    }
                  </p>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleNodeAction('isolate')}
                    className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-mono text-white transition-all group"
                  >
                    <Lock size={12} className="text-gray-500 group-hover:text-white" />
                    ISOLATE
                  </button>
                  <button 
                    onClick={() => handleNodeAction(selectedNode.status === 'secure' ? 'scan' : 'remediate')}
                    className="flex items-center justify-center gap-2 py-3 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-[10px] font-mono text-cyan-400 transition-all"
                  >
                    {selectedNode.status === 'secure' ? <Search size={12} /> : <Zap size={12} />}
                    {selectedNode.status === 'secure' ? 'DEEP SCAN' : 'REMEDIATE'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
