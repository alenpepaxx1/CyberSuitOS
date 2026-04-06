/* COPYRIGHT ALEN PEPA */
import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  Shield, Server, Laptop, Router, AlertTriangle, 
  Info, Activity, Zap, Globe, Database, Cpu, 
  Lock, Unlock, Radio, Wifi, Search, RefreshCw,
  Maximize2, Minimize2, ZoomIn, ZoomOut, X
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
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
  value?: number;
  active?: boolean;
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
    traffic: '0 KB/s'
  });

  const fetchNetworkData = async () => {
    try {
      const res = await fetch('/api/network');
      const data = await res.json();
      
      setNodes(data.nodes);
      setLinks(data.links);
      
      setStats({
        totalNodes: data.nodes.length,
        compromised: data.nodes.filter((n: any) => n.status === 'compromised').length,
        vulnerable: data.nodes.filter((n: any) => n.status === 'vulnerable').length,
        traffic: `${(Math.random() * 500 + 100).toFixed(1)} KB/s`
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
    if (!svgRef.current || nodes.length === 0) return;

    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Initialize persistent groups if they don't exist
    if (svg.select('defs').empty()) {
      const defs = svg.append('defs');
      
      // Glow filter
      const filter = defs.append('filter')
        .attr('id', 'glow')
        .attr('x', '-50%')
        .attr('y', '-50%')
        .attr('width', '200%')
        .attr('height', '200%');

      filter.append('feGaussianBlur')
        .attr('stdDeviation', '3')
        .attr('result', 'blur');
      filter.append('feComposite')
        .attr('in', 'SourceGraphic')
        .attr('in2', 'blur')
        .attr('operator', 'over');

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
      for (let i = 0; i < 15; i++) {
        streamGroup.append('line')
          .attr('x1', -1000)
          .attr('y1', -1000 + i * 150)
          .attr('x2', 1000)
          .attr('y2', -1000 + i * 150)
          .attr('stroke', '#06b6d4')
          .attr('stroke-width', 0.5)
          .attr('opacity', 0.05)
          .attr('stroke-dasharray', '10,20')
          .style('animation', `data-flow ${30 + Math.random() * 30}s linear infinite`);
      }

      // Radar Background (Static)
      const radarGroup = mainG.append('g').attr('class', 'radar-background');
      for (let i = 1; i <= 4; i++) {
        radarGroup.append('circle')
          .attr('cx', 0)
          .attr('cy', 0)
          .attr('r', i * 150)
          .attr('fill', 'none')
          .attr('stroke', '#06b6d4')
          .attr('stroke-width', 0.5)
          .attr('opacity', 0.2)
          .attr('stroke-dasharray', i % 2 === 0 ? '4,4' : 'none');
      }
      radarGroup.append('line').attr('x1', -600).attr('y1', 0).attr('x2', 600).attr('y2', 0).attr('stroke', '#06b6d4').attr('stroke-width', 0.5).attr('opacity', 0.2);
      radarGroup.append('line').attr('x1', 0).attr('y1', -600).attr('x2', 0).attr('y2', 600).attr('stroke', '#06b6d4').attr('stroke-width', 0.5).attr('opacity', 0.2);

      // Radar sweep with CSS animation
      const sweep = radarGroup.append('path')
        .attr('d', 'M0,0 L0,-600 A600,600 0 0,1 155,-579 Z')
        .attr('fill', 'url(#radar-gradient)')
        .attr('opacity', 0.4)
        .style('transform-origin', '0 0')
        .style('animation', 'radar-rotate 8s linear infinite');

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
            50% { opacity: 0.9; }
            100% { opacity: 1; }
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
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        mainG.attr('transform', event.transform);
        setZoomLevel(event.transform.k);
      });
    zoomRef.current = zoom;
    svg.call(zoom);

    const simulation = d3.forceSimulation<Node>(nodes)
      .alphaDecay(0.05)
      .force('link', d3.forceLink<Node, Link>(links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-600))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('x', d3.forceX(width / 2).strength(0.2))
      .force('y', d3.forceY((d: any) => {
        const id = d.id;
        if (id === 'internet') return height * 0.15;
        if (id === 'ext-fw') return height * 0.3;
        if (['dmz-switch', 'web-01', 'web-02', 'vpn-gw'].includes(id)) return height * 0.45;
        if (id === 'int-fw') return height * 0.6;
        if (id === 'core-switch') return height * 0.75;
        return height * 0.9;
      }).strength(2.5))
      .force('collision', d3.forceCollide().radius(70));

    // Layer Labels
    const layers = [
      { y: height * 0.15, label: 'External / WAN' },
      { y: height * 0.3, label: 'Edge Security' },
      { y: height * 0.45, label: 'DMZ / Public Services' },
      { y: height * 0.6, label: 'Internal Security' },
      { y: height * 0.75, label: 'Core Infrastructure' },
      { y: height * 0.9, label: 'Internal Assets' }
    ];

    mainG.selectAll('.layer-indicator').remove();
    const layerGroup = mainG.append('g').attr('class', 'layer-indicator').lower();
    
    layers.forEach(layer => {
      layerGroup.append('line')
        .attr('x1', -width)
        .attr('y1', layer.y)
        .attr('x2', width * 2)
        .attr('y2', layer.y)
        .attr('stroke', '#06b6d4')
        .attr('stroke-width', 0.5)
        .attr('stroke-dasharray', '5,10')
        .attr('opacity', 0.1);

      layerGroup.append('text')
        .attr('x', 20)
        .attr('y', layer.y - 10)
        .attr('fill', '#06b6d4')
        .attr('font-size', '8px')
        .attr('font-family', 'monospace')
        .attr('opacity', 0.3)
        .attr('text-anchor', 'start')
        .text(layer.label.toUpperCase());
    });

    // Links
    const link = linkGroup
      .selectAll('path')
      .data(links)
      .join('path')
      .attr('id', (d, i) => `link-${i}`)
      .attr('fill', 'none')
      .attr('stroke', d => (d.source as Node).status === 'compromised' || (d.target as Node).status === 'compromised' ? '#ef4444' : '#333')
      .attr('stroke-width', d => (d.source as Node).status === 'compromised' || (d.target as Node).status === 'compromised' ? 2 : 1.5)
      .attr('stroke-dasharray', d => (d.source as Node).status === 'compromised' || (d.target as Node).status === 'compromised' ? '4,4' : 'none')
      .attr('opacity', 0.6);

    // Packet Animation
    const animatePackets = () => {
      packetGroup.selectAll('g').remove();
      links.forEach((l, i) => {
        const source = l.source as Node;
        const target = l.target as Node;
        if (Math.random() > 0.1) {
          const isCompromised = source.status === 'compromised' || target.status === 'compromised';
          const pG = packetGroup.append('g');
          // Slower, more rhythmic packets
          const duration = 4 + Math.random() * 4;
          pG.append('circle').attr('r', isCompromised ? 3 : 2).attr('fill', isCompromised ? '#ef4444' : '#06b6d4').attr('filter', 'url(#glow)')
            .append('animateMotion').attr('dur', `${duration}s`).attr('repeatCount', 'indefinite').append('mpath').attr('xlink:href', `#link-${i}`);
          pG.append('circle').attr('r', isCompromised ? 2 : 1.5).attr('fill', isCompromised ? '#ef4444' : '#06b6d4').attr('opacity', 0.5)
            .append('animateMotion').attr('dur', `${duration}s`).attr('begin', '0.2s').attr('repeatCount', 'indefinite').append('mpath').attr('xlink:href', `#link-${i}`);
        }
      });
    };
    animatePackets();

    // Attack Lines
    const attackLine = attackGroup
      .selectAll('line')
      .data(activeAttacks)
      .join('line')
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 3)
      .attr('stroke-dasharray', '5,5')
      .attr('opacity', 0.8)
      .attr('filter', 'url(#glow)');

    attackLine
      .style('animation', 'attack-dash 2s linear infinite');

    // Nodes
    const node = nodeGroup
      .selectAll('g')
      .data(nodes)
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
        d3.select(this).select('.node-bg').attr('fill', '#1a1a1a').attr('stroke-width', 4);
        d3.select(this).select('.node-label').attr('fill', '#fff');
        
        // Add temporary scanning ring on hover
        d3.select(this).append('circle')
          .attr('class', 'hover-ring')
          .attr('r', 30)
          .attr('fill', 'none')
          .attr('stroke', '#06b6d4')
          .attr('stroke-width', 1)
          .attr('opacity', 0)
          .transition()
          .duration(300)
          .attr('opacity', 0.5)
          .attr('r', 35);
      })
      .on('mouseout', function(event, d) {
        d3.select(this).select('.node-bg').attr('fill', '#0a0a0a').attr('stroke-width', 2);
        d3.select(this).select('.node-label').attr('fill', '#888');
        d3.select(this).selectAll('.hover-ring').remove();
      });

    // Node outer ring (pulse for compromised)
    node.filter(d => d.status === 'compromised')
      .append('circle')
      .attr('r', 25)
      .attr('fill', 'none')
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 2)
      .style('transform-origin', '0 0')
      .style('animation', 'pulse-ring 3s ease-out infinite');

    // Glitch effect for compromised nodes
    node.filter(d => d.status === 'compromised')
      .style('animation', 'glitch-flicker 3s ease-in-out infinite');

    // Node background
    node.append('circle')
      .attr('class', 'node-bg')
      .attr('r', 24)
      .attr('fill', '#0a0a0a')
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
      .attr('x', -12)
      .attr('y', -12)
      .attr('width', 24)
      .attr('height', 24)
      .style('pointer-events', 'none')
      .html(d => {
        const color = d.status === 'secure' ? '#10b981' : d.status === 'vulnerable' ? '#f59e0b' : '#ef4444';
        let icon = '';
        if (d.type === 'server') icon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>`;
        else if (d.type === 'router') icon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>`; // Simplified
        else if (d.type === 'firewall') icon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>`;
        else if (d.type === 'database') icon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>`;
        else if (d.type === 'cloud') icon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19x.5.5 0 0 1 .5-.5c2.2 0 4-1.8 4-4 0-2.1-1.6-3.8-3.6-4a7.5 7.5 0 0 0-14.4 2C2.8 12.9 2 14.4 2 16c0 2.2 1.8 4 4 4h11.5z"/></svg>`;
        else if (d.type === 'iot') icon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12s2.545-5 7-5c4.454 0 7 5 7 5s-2.546 5-7 5c-4.455 0-7-5-7-5z"/><circle cx="12" cy="12" r="3"/></svg>`;
        else icon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="12" x="3" y="4" rx="2" ry="2"/><line x1="2" x2="22" y1="20" y2="20"/></svg>`;
        return `<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">${icon}</div>`;
      });

    // Node labels
    node.append('text')
      .attr('class', 'node-label')
      .attr('dy', 35)
      .attr('text-anchor', 'middle')
      .text(d => d.label)
      .attr('fill', '#888')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .style('transition', 'fill 0.3s ease');

    // IP labels (only if zoomed in)
    node.append('text')
      .attr('dy', 45)
      .attr('text-anchor', 'middle')
      .text(d => d.ip || '')
      .attr('fill', '#444')
      .attr('font-size', '8px')
      .attr('font-family', 'monospace')
      .attr('opacity', zoomLevel > 1.2 ? 1 : 0);

    simulation.on('tick', () => {
      link.attr('d', (d: any) => {
        const sourceX = d.source.x;
        const sourceY = d.source.y;
        const targetX = d.target.x;
        const targetY = d.target.y;
        
        // Use a more structured "schematic" curve
        const midY = (sourceY + targetY) / 2;
        return `M${sourceX},${sourceY} C${sourceX},${midY} ${targetX},${midY} ${targetX},${targetY}`;
      });

      node
        .attr('transform', d => `translate(${d.x},${d.y})`);
        
      attackLine
        .attr('x1', d => {
          const source = nodes.find(n => n.id === d.from);
          return source?.x || 0;
        })
        .attr('y1', d => {
          const source = nodes.find(n => n.id === d.from);
          return source?.y || 0;
        })
        .attr('x2', d => {
          const target = nodes.find(n => n.id === d.to);
          return target?.x || 0;
        })
        .attr('y2', d => {
          const target = nodes.find(n => n.id === d.to);
          return target?.y || 0;
        });
        
      // Packets are animated via SVG animateMotion, which automatically follows the path 'd' attribute.
    });

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
  }, [nodes, zoomLevel, activeAttacks]);

  return (
    <div className={cn(
      "flex flex-col cyber-card rounded-lg overflow-hidden bg-black/20 backdrop-blur-sm border border-white/5 relative",
      isFullScreen ? "fixed inset-0 z-50 h-screen w-screen rounded-none" : "h-full"
    )}>
      <div className="corner-accent corner-tl" />
      <div className="corner-accent corner-tr" />
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-black/40 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
            <Globe className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-sm font-mono font-bold uppercase tracking-widest text-white">Network Topology</h2>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
              <span className="text-[10px] font-mono text-cyan-500/60 uppercase">Real-time Monitoring Active</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-mono text-gray-500 uppercase">Traffic</span>
              <span className="text-xs font-mono text-cyan-400">{stats.traffic}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-mono text-gray-500 uppercase">Nodes</span>
              <span className="text-xs font-mono text-white">{stats.totalNodes}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-mono text-red-500 uppercase">Breaches</span>
              <span className="text-xs font-mono text-red-500">{stats.compromised}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={handleScan}
              disabled={isScanning}
              className={cn(
                "p-2 rounded-lg border transition-all flex items-center gap-2",
                isScanning 
                  ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400" 
                  : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
              )}
            >
              <Search size={14} className={isScanning ? "animate-spin" : ""} />
              <span className="text-[10px] font-mono uppercase hidden sm:inline">Deep Scan</span>
            </button>
            <button 
              onClick={fetchNetworkData}
              className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
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
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20">
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
            className="p-2 bg-black/60 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-black/80 transition-all shadow-xl"
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
            className="p-2 bg-black/60 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-black/80 transition-all shadow-xl"
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          <button 
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-2 bg-black/60 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-black/80 transition-all shadow-xl mt-2"
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
        <div className="absolute bottom-6 right-6 p-4 bg-black/60 border border-white/10 rounded-xl backdrop-blur-md z-10 shadow-xl">
          <h4 className="text-[10px] font-mono text-gray-500 uppercase mb-3 tracking-widest">Node Status</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-mono text-gray-300 uppercase">Secure</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
              <span className="text-[10px] font-mono text-gray-300 uppercase">Vulnerable</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse" />
              <span className="text-[10px] font-mono text-gray-300 uppercase">Compromised</span>
            </div>
          </div>
        </div>

        {/* Detail Panel */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="absolute top-6 right-6 w-80 bg-black/80 border border-white/10 rounded-2xl backdrop-blur-2xl z-30 shadow-2xl overflow-hidden"
            >
              {/* Panel Header */}
              <div className={cn(
                "p-4 flex items-center justify-between border-b",
                selectedNode.status === 'secure' ? "bg-emerald-500/10 border-emerald-500/20" :
                selectedNode.status === 'vulnerable' ? "bg-amber-500/10 border-amber-500/20" :
                "bg-red-500/10 border-red-500/20"
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    selectedNode.status === 'secure' ? "bg-emerald-500/20 text-emerald-400" :
                    selectedNode.status === 'vulnerable' ? "bg-amber-500/20 text-amber-400" :
                    "bg-red-500/20 text-red-400"
                  )}>
                    {selectedNode.type === 'server' ? <Server size={18} /> :
                     selectedNode.type === 'router' ? <Router size={18} /> :
                     selectedNode.type === 'firewall' ? <Shield size={18} /> :
                     <Laptop size={18} />}
                  </div>
                  <div>
                    <h3 className="text-sm font-mono font-bold text-white uppercase tracking-tight">{selectedNode.label}</h3>
                    <span className="text-[10px] font-mono text-gray-500">{selectedNode.ip}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedNode(null)}
                  className="p-1 text-gray-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Panel Content */}
              <div className="p-5 space-y-6">
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <Activity size={12} className="text-cyan-400" />
                      <span className="text-[9px] font-mono text-gray-500 uppercase">Traffic</span>
                    </div>
                    <span className="text-sm font-mono text-white">{selectedNode.traffic}%</span>
                  </div>
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield size={12} className={cn(
                        selectedNode.threatLevel! > 70 ? "text-red-500" : "text-emerald-500"
                      )} />
                      <span className="text-[9px] font-mono text-gray-500 uppercase">Threat</span>
                    </div>
                    <span className="text-sm font-mono text-white">{selectedNode.threatLevel}%</span>
                  </div>
                </div>

                {/* System Info */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-gray-500 uppercase">Operating System</span>
                    <span className="text-white">{selectedNode.os}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-gray-500 uppercase">System Uptime</span>
                    <span className="text-white">{selectedNode.uptime}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-gray-500 uppercase">Status</span>
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
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <Info size={14} className="text-cyan-400" />
                    <span className="text-[10px] font-mono text-white uppercase tracking-widest">Core Analysis</span>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-relaxed font-sans">
                    {selectedNode.status === 'secure' ? 
                      'Node integrity verified. All cryptographic signatures match. Traffic patterns are consistent with baseline behavior.' :
                      selectedNode.status === 'vulnerable' ?
                      'Potential entry point detected. Outdated software versions found. Immediate patching recommended to prevent lateral movement.' :
                      'ACTIVE BREACH DETECTED. Unauthorized access in progress. System isolation required to prevent data exfiltration.'
                    }
                  </p>
                </div>

                {/* Simulated Logs */}
                <div className="p-3 bg-black/60 border border-white/10 rounded-xl space-y-1 h-24 overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-b from-black/60 to-transparent z-10" />
                  <div className="absolute bottom-0 left-0 w-full h-4 bg-gradient-to-t from-black/60 to-transparent z-10" />
                  <motion.div 
                    animate={{ y: [0, -40] }} 
                    transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                    className="flex flex-col gap-1"
                  >
                    <span className="text-[8px] font-mono text-gray-500">[SYS] Initializing diagnostic routine...</span>
                    <span className="text-[8px] font-mono text-gray-500">[NET] Pinging {selectedNode.ip}... OK</span>
                    <span className="text-[8px] font-mono text-gray-500">[SEC] Checking firewall rules...</span>
                    <span className={cn("text-[8px] font-mono", selectedNode.status === 'secure' ? "text-emerald-500" : "text-amber-500")}>
                      [SEC] {selectedNode.status === 'secure' ? 'No anomalies detected.' : 'Warning: Unusual port activity.'}
                    </span>
                    <span className="text-[8px] font-mono text-gray-500">[SYS] Memory dump analysis complete.</span>
                    <span className="text-[8px] font-mono text-gray-500">[NET] Connection established.</span>
                    <span className="text-[8px] font-mono text-gray-500">[SYS] Awaiting further instructions.</span>
                  </motion.div>
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
