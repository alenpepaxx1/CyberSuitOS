/* COPYRIGHT ALEN PEPA */
import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  Shield, Server, Laptop, Router, AlertTriangle, 
  Info, Activity, Zap, Globe, Database, Cpu, 
  Lock, Unlock, Radio, Wifi, Search, RefreshCw,
  Maximize2, Minimize2, ZoomIn, ZoomOut
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
      
      // Enhance data with more properties for "advance" look
      const enhancedNodes = data.nodes.map((n: any) => ({
        ...n,
        os: n.type === 'server' ? 'Linux Kernel 5.15' : 'Windows 11 Pro',
        uptime: '14d 06h 22m',
        traffic: Math.floor(Math.random() * 100),
        threatLevel: n.status === 'compromised' ? 95 : n.status === 'vulnerable' ? 45 : 5
      }));

      setNodes(enhancedNodes);
      setLinks(data.links);
      
      setStats({
        totalNodes: enhancedNodes.length,
        compromised: enhancedNodes.filter((n: any) => n.status === 'compromised').length,
        vulnerable: enhancedNodes.filter((n: any) => n.status === 'vulnerable').length,
        traffic: `${(Math.random() * 500 + 100).toFixed(1)} KB/s`
      });

      setIsLoading(false);
    } catch (e) {
      console.error("Failed to fetch network data:", e);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNetworkData();
    const interval = setInterval(fetchNetworkData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      fetchNetworkData();
    }, 3000);
  };

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    svg.selectAll('*').remove();

    // Define gradients and filters
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

    const g = svg.append('g');

    // Radar Background
    const radarGroup = g.append('g').attr('class', 'radar-background');
    
    // Draw concentric circles
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

    // Draw crosshairs
    radarGroup.append('line').attr('x1', -600).attr('y1', 0).attr('x2', 600).attr('y2', 0).attr('stroke', '#06b6d4').attr('stroke-width', 0.5).attr('opacity', 0.2);
    radarGroup.append('line').attr('x1', 0).attr('y1', -600).attr('x2', 0).attr('y2', 600).attr('stroke', '#06b6d4').attr('stroke-width', 0.5).attr('opacity', 0.2);

    // Radar sweep
    const sweep = radarGroup.append('path')
      .attr('d', 'M0,0 L0,-600 A600,600 0 0,1 155,-579 Z') // 15 degrees arc
      .attr('fill', 'url(#radar-gradient)')
      .attr('opacity', 0.4);

    const animateRadar = () => {
      sweep
        .attr('transform', 'rotate(0)')
        .transition()
        .duration(4000)
        .ease(d3.easeLinear)
        .attr('transform', 'rotate(360)')
        .on('end', animateRadar);
    };
    animateRadar();

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoomLevel(event.transform.k);
      });
    zoomRef.current = zoom;

    svg.call(zoom);

    const simulation = d3.forceSimulation<Node>(nodes)
      .force('link', d3.forceLink<Node, Link>(links).id(d => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-800))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(60));

    // Links
    const link = g.append('g')
      .selectAll('path')
      .data(links)
      .join('path')
      .attr('id', (d, i) => `link-${i}`)
      .attr('fill', 'none')
      .attr('stroke', d => (d.source as Node).status === 'compromised' || (d.target as Node).status === 'compromised' ? '#ef4444' : '#333')
      .attr('stroke-width', d => (d.source as Node).status === 'compromised' || (d.target as Node).status === 'compromised' ? 2 : 1.5)
      .attr('stroke-dasharray', d => (d.source as Node).status === 'compromised' || (d.target as Node).status === 'compromised' ? '4,4' : 'none')
      .attr('opacity', 0.6);

    // Packet Animation (Particles)
    const packets = g.append('g');
    
    const animatePackets = () => {
      packets.selectAll('g').remove();
      
      links.forEach((l, i) => {
        const source = l.source as Node;
        const target = l.target as Node;
        
        // Add more packets for a busier network
        if (Math.random() > 0.1) {
          const isCompromised = source.status === 'compromised' || target.status === 'compromised';
          const packetGroup = packets.append('g');
          
          const packet = packetGroup.append('circle')
            .attr('r', isCompromised ? 3 : 2)
            .attr('fill', isCompromised ? '#ef4444' : '#06b6d4')
            .attr('filter', 'url(#glow)');

          const tail = packetGroup.append('circle')
            .attr('r', isCompromised ? 2 : 1.5)
            .attr('fill', isCompromised ? '#ef4444' : '#06b6d4')
            .attr('opacity', 0.5);

          const duration = 1.5 + Math.random() * 2; // in seconds
          
          packet.append('animateMotion')
            .attr('dur', `${duration}s`)
            .attr('repeatCount', 'indefinite')
            .append('mpath')
            .attr('xlink:href', `#link-${i}`);
            
          tail.append('animateMotion')
            .attr('dur', `${duration}s`)
            .attr('begin', '0.1s')
            .attr('repeatCount', 'indefinite')
            .append('mpath')
            .attr('xlink:href', `#link-${i}`);
        }
      });
    };

    animatePackets();

    // Nodes
    const node = g.append('g')
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
        d3.select(this).select('.node-bg').attr('fill', '#1a1a1a');
        d3.select(this).select('.node-label').attr('fill', '#fff');
      })
      .on('mouseout', function(event, d) {
        d3.select(this).select('.node-bg').attr('fill', '#0a0a0a');
        d3.select(this).select('.node-label').attr('fill', '#888');
      });

    // Node outer ring (pulse for compromised)
    node.filter(d => d.status === 'compromised')
      .append('circle')
      .attr('r', 25)
      .attr('fill', 'none')
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 2)
      .append('animate')
      .attr('attributeName', 'r')
      .attr('from', '25')
      .attr('to', '40')
      .attr('dur', '1.5s')
      .attr('begin', '0s')
      .attr('repeatCount', 'indefinite');

    node.filter(d => d.status === 'compromised')
      .select('circle')
      .append('animate')
      .attr('attributeName', 'opacity')
      .attr('from', '1')
      .attr('to', '0')
      .attr('dur', '1.5s')
      .attr('begin', '0s')
      .attr('repeatCount', 'indefinite');

    // Node background
    node.append('circle')
      .attr('class', 'node-bg')
      .attr('r', 22)
      .attr('fill', '#0a0a0a')
      .attr('stroke', d => {
        if (d.status === 'secure') return '#10b981';
        if (d.status === 'vulnerable') return '#f59e0b';
        return '#ef4444';
      })
      .attr('stroke-width', 2)
      .attr('filter', 'url(#glow)')
      .style('transition', 'fill 0.3s ease');

    // Node Icons (using simple shapes to represent icons)
    node.each(function(d) {
      const g = d3.select(this);
      if (d.type === 'server') {
        g.append('rect').attr('x', -8).attr('y', -10).attr('width', 16).attr('height', 20).attr('fill', 'none').attr('stroke', '#fff').attr('stroke-width', 1);
        g.append('line').attr('x1', -4).attr('y1', -4).attr('x2', 4).attr('y2', -4).attr('stroke', '#fff').attr('stroke-width', 1);
        g.append('line').attr('x1', -4).attr('y1', 2).attr('x2', 4).attr('y2', 2).attr('stroke', '#fff').attr('stroke-width', 1);
      } else if (d.type === 'router' || d.type === 'firewall') {
        g.append('circle').attr('r', 10).attr('fill', 'none').attr('stroke', '#fff').attr('stroke-width', 1);
        g.append('line').attr('x1', -6).attr('y1', 0).attr('x2', 6).attr('y2', 0).attr('stroke', '#fff').attr('stroke-width', 1);
        g.append('line').attr('x1', 0).attr('y1', -6).attr('x2', 0).attr('y2', 6).attr('stroke', '#fff').attr('stroke-width', 1);
      } else if (d.type === 'cloud') {
        g.append('path').attr('d', 'M-10,2 Q-12,-8 -2,-8 Q0,-12 8,-8 Q12,-8 10,2 Z').attr('fill', 'none').attr('stroke', '#fff').attr('stroke-width', 1);
      } else if (d.type === 'database') {
        g.append('ellipse').attr('cx', 0).attr('cy', -6).attr('rx', 8).attr('ry', 4).attr('fill', 'none').attr('stroke', '#fff').attr('stroke-width', 1);
        g.append('path').attr('d', 'M-8,-6 L-8,6 Q0,10 8,6 L8,-6').attr('fill', 'none').attr('stroke', '#fff').attr('stroke-width', 1);
      } else if (d.type === 'iot') {
        g.append('circle').attr('r', 6).attr('fill', 'none').attr('stroke', '#fff').attr('stroke-width', 1);
        g.append('circle').attr('r', 10).attr('fill', 'none').attr('stroke', '#fff').attr('stroke-width', 0.5).attr('stroke-dasharray', '2,2');
      } else {
        g.append('rect').attr('x', -10).attr('y', -6).attr('width', 20).attr('height', 12).attr('fill', 'none').attr('stroke', '#fff').attr('stroke-width', 1);
        g.append('line').attr('x1', -12).attr('y1', 8).attr('x2', 12).attr('y2', 8).attr('stroke', '#fff').attr('stroke-width', 1);
      }
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
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dr = Math.sqrt(dx * dx + dy * dy) * 1.5; // Curve radius
        return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
      });

      node
        .attr('transform', d => `translate(${d.x},${d.y})`);
        
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
  }, [nodes, zoomLevel]);

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
      <div ref={containerRef} className="flex-1 relative overflow-hidden bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900/10 via-black to-black">
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
            <motion.div 
              initial={{ top: '-10%' }}
              animate={{ top: '110%' }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 right-0 h-32 bg-gradient-to-b from-transparent via-cyan-500/10 to-cyan-500/30 border-b-2 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.4)]"
            />
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
                  <button className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-mono text-white transition-all group">
                    <Lock size={12} className="text-gray-500 group-hover:text-white" />
                    ISOLATE
                  </button>
                  <button className="flex items-center justify-center gap-2 py-3 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-[10px] font-mono text-cyan-400 transition-all">
                    <Zap size={12} />
                    DIAGNOSE
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

function X({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}
