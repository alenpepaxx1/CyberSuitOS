/* COPYRIGHT ALEN PEPA */
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, ShieldCheck, Zap, Search, Globe, X, Terminal as TerminalIcon, Activity, Maximize2, Minimize2, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface MapItem {
  id: string;
  long: number;
  lat: number;
  type: 'attack' | 'node';
  country: string;
  city: string;
  ip: string;
  threatLevel?: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'compromised' | 'secure';
  lastSeen: string;
  attackType?: string;
  targetedPorts?: number[];
  reputation?: number;
}

interface ThreatMapProps {
  onAction?: (toolId: string, target?: string) => void;
  initialNodes?: MapItem[];
  initialLines?: { fromId: string; toId: string }[];
}

export default function ThreatMap({ onAction, initialNodes, initialLines }: ThreatMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedItem, setSelectedItem] = useState<MapItem | null>(null);
  const [nodes, setNodes] = useState<MapItem[]>([]);
  const [activeAttacks, setActiveAttacks] = useState<any[]>([]);
  const [mapData, setMapData] = useState<any>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const nodesRef = useRef<MapItem[]>([]);
  const attacksRef = useRef<any[]>([]);

  // High-frequency "Live" simulation for visual activity
  useEffect(() => {
    if (nodes.length < 2) return;
    
    const interval = setInterval(() => {
      setActiveAttacks(prev => {
        const now = Date.now();
        // Remove attacks older than 3 seconds
        let updated = prev.filter(a => !a.isSimulated || (now - (a.timestamp || now)) < 3000);

        // Add 2-4 new attacks per tick
        const numToAdd = Math.floor(Math.random() * 3) + 2;
        const newAttacks = [];
        
        for (let i = 0; i < numToAdd; i++) {
          if (updated.length + newAttacks.length < 50) { 
            const from = nodes[Math.floor(Math.random() * nodes.length)];
            const to = nodes[Math.floor(Math.random() * nodes.length)];
            if (from.id !== to.id) {
              newAttacks.push({ 
                from, 
                to, 
                isSimulated: true, 
                id: `sim-${Math.random().toString(36).substr(2, 9)}`,
                timestamp: now
              });
            }
          }
        }
        
        const nextAttacks = [...updated, ...newAttacks];
        attacksRef.current = nextAttacks;
        return nextAttacks;
      });
    }, 800); 

    return () => clearInterval(interval);
  }, [nodes]);

  useEffect(() => {
    d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(data => setMapData(data))
      .catch(err => console.error('Failed to load map data:', err));
  }, []);

  // Initialize nodes
  useEffect(() => {
    let generatedNodes: MapItem[] = [];
    if (initialNodes && initialNodes.length > 0) {
      generatedNodes = initialNodes.map((node, i) => ({
        ...node,
        id: node.id || `node-${i}`,
        status: node.status || 'active',
        lastSeen: node.lastSeen || 'Just now',
        reputation: node.reputation ?? Math.floor(Math.random() * 100)
      }));
    } else if (initialNodes && initialNodes.length === 0) {
      generatedNodes = [];
    } else {
      const locations = [
        { long: -74.006, lat: 40.7128, city: 'New York', country: 'USA' },
        { long: 0.1278, lat: 51.5074, city: 'London', country: 'UK' },
        { long: 139.6503, lat: 35.6762, city: 'Tokyo', country: 'Japan' },
        { long: 37.6173, lat: 55.7558, city: 'Moscow', country: 'Russia' },
        { long: 116.4074, lat: 39.9042, city: 'Beijing', country: 'China' },
        { long: 151.2093, lat: -33.8688, city: 'Sydney', country: 'Australia' },
        { long: -43.1729, lat: -22.9068, city: 'Rio de Janeiro', country: 'Brazil' },
        { long: 18.4241, lat: -33.9249, city: 'Cape Town', country: 'South Africa' },
        { long: 77.209, lat: 28.6139, city: 'New Delhi', country: 'India' },
        { long: 103.8198, lat: 1.3521, city: 'Singapore', country: 'Singapore' },
        { long: -122.4194, lat: 37.7749, city: 'San Francisco', country: 'USA' },
        { long: 2.3522, lat: 48.8566, city: 'Paris', country: 'France' },
        { long: 12.4964, lat: 41.9028, city: 'Rome', country: 'Italy' },
        { long: 55.2708, lat: 25.2048, city: 'Dubai', country: 'UAE' },
        { long: 121.4737, lat: 31.2304, city: 'Shanghai', country: 'China' },
        { long: 100.5018, lat: 13.7563, city: 'Bangkok', country: 'Thailand' },
        { long: 28.9784, lat: 41.0082, city: 'Istanbul', country: 'Turkey' },
        { long: -58.3816, lat: -34.6037, city: 'Buenos Aires', country: 'Argentina' },
        { long: 3.3792, lat: 6.5244, city: 'Lagos', country: 'Nigeria' },
        { long: 36.8219, lat: -1.2921, city: 'Nairobi', country: 'Kenya' },
        { long: 13.4050, lat: 52.5200, city: 'Berlin', country: 'Germany' },
        { long: 30.5234, lat: 50.4501, city: 'Kyiv', country: 'Ukraine' },
      ];

      generatedNodes = locations.map((loc, i) => {
        const type = Math.random() > 0.7 ? 'attack' : 'node';
        return {
          id: `node-${i}`,
          ...loc,
          type,
          ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          threatLevel: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as any,
          status: Math.random() > 0.8 ? 'compromised' : Math.random() > 0.5 ? 'active' : 'secure',
          lastSeen: 'Just now',
          attackType: type === 'attack' ? ['DDoS', 'SQL Injection', 'Brute Force', 'Malware C2'][Math.floor(Math.random() * 4)] : undefined,
          targetedPorts: type === 'attack' ? [80, 443, 22, 3389].sort(() => Math.random() - 0.5).slice(0, 2) : undefined,
          reputation: Math.floor(Math.random() * 100)
        };
      });
    }

    setNodes(generatedNodes);
    nodesRef.current = generatedNodes;
  }, [initialNodes]);

  // Main D3 Render
  useEffect(() => {
    if (!svgRef.current || !mapData || nodes.length === 0) return;

    const width = 800;
    const height = 450;
    const svg = d3.select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    svg.selectAll('*').remove();

    // 3D Orthographic Projection
    const projection = d3.geoOrthographic()
      .scale(200)
      .translate([width / 2, height / 2])
      .clipAngle(90);

    const path = d3.geoPath().projection(projection);

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 8])
      .on('zoom', (event) => {
        svgGroup.attr('transform', event.transform);
      });

    zoomRef.current = zoom;
    svg.call(zoom);

    const svgGroup = svg.append('g');

    // Ocean / Globe background
    svgGroup.append('circle')
      .attr('cx', width / 2)
      .attr('cy', height / 2)
      .attr('r', projection.scale())
      .attr('fill', '#050505')
      .attr('stroke', '#00ff41')
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.3)
      .style('filter', 'drop-shadow(0 0 20px rgba(0,255,65,0.1))');

    // Graticule (Grid)
    const graticule = d3.geoGraticule();
    const gridPath = svgGroup.append('path')
      .datum(graticule)
      .attr('class', 'graticule')
      .attr('fill', 'none')
      .attr('stroke', '#00ff41')
      .attr('stroke-width', 0.2)
      .attr('opacity', 0.3);

    // Countries
    const countries = topojson.feature(mapData, mapData.objects.countries) as any;
    const countryPaths = svgGroup.append('g').attr('class', 'countries')
      .selectAll('path')
      .data(countries.features)
      .enter()
      .append('path')
      .attr('fill', '#0a0a0a')
      .attr('stroke', '#00ff41')
      .attr('stroke-width', 0.5)
      .attr('stroke-opacity', 0.5)
      .attr('class', 'country-path');

    // Groups for dynamic elements
    const attackLinesGroup = svgGroup.append('g').attr('class', 'attack-lines');
    const nodesGroup = svgGroup.append('g').attr('class', 'nodes');

    // Rotation state
    let rotation = 0;
    const velocity = 0.5; // degrees per frame

    const timer = d3.timer((elapsed) => {
      rotation = (elapsed * 0.01 * velocity) % 360;
      projection.rotate([rotation, -15]);

      // Update globe background radius in case of zoom/scale changes
      svgGroup.select('circle').attr('r', projection.scale());

      // Update grid
      gridPath.attr('d', path as any);

      // Update countries
      countryPaths.attr('d', path as any);

      // Update Nodes
      const currentNodes = nodesRef.current;
      const nodeSelection = nodesGroup.selectAll<SVGCircleElement, MapItem>('circle')
        .data(currentNodes, d => d.id);

      nodeSelection.enter()
        .append('circle')
        .attr('r', d => d.type === 'attack' ? 3 : 2)
        .attr('fill', d => d.type === 'attack' ? '#ef4444' : '#00ff41')
        .style('cursor', 'pointer')
        .style('filter', d => d.type === 'attack' ? 'drop-shadow(0 0 4px #ef4444)' : 'drop-shadow(0 0 4px #00ff41)')
        .on('click', (event, d) => {
          event.stopPropagation();
          setSelectedItem(d);
        })
        .merge(nodeSelection)
        .attr('cx', d => {
          const p = projection([d.long, d.lat]);
          return p ? p[0] : 0;
        })
        .attr('cy', d => {
          const p = projection([d.long, d.lat]);
          return p ? p[1] : 0;
        })
        .attr('display', d => {
          // Hide nodes on the back of the globe
          const pointPath = path({ type: 'Point', coordinates: [d.long, d.lat] } as any);
          return pointPath ? 'block' : 'none';
        });

      nodeSelection.exit().remove();

      // Update Attacks (Arcs)
      const currentAttacks = attacksRef.current;
      const attackSelection = attackLinesGroup.selectAll<SVGPathElement, any>('path')
        .data(currentAttacks, d => d.id);

      attackSelection.enter()
        .append('path')
        .attr('fill', 'none')
        .attr('stroke', '#ef4444')
        .attr('stroke-width', 1.5)
        .attr('opacity', 0.8)
        .style('filter', 'drop-shadow(0 0 4px #ef4444)')
        .attr('stroke-dasharray', '4, 8')
        .merge(attackSelection)
        .attr('d', d => {
          const route = {
            type: "LineString",
            coordinates: [
              [d.from.long, d.from.lat],
              [d.to.long, d.to.lat]
            ]
          };
          return path(route as any);
        })
        .attr('display', d => {
          const route = {
            type: "LineString",
            coordinates: [
              [d.from.long, d.from.lat],
              [d.to.long, d.to.lat]
            ]
          };
          return path(route as any) ? 'block' : 'none';
        })
        .attr('stroke-dashoffset', -(elapsed * 0.05) % 12); // Flowing animation

      attackSelection.exit().remove();

    });

    return () => {
      timer.stop();
    };
  }, [mapData, nodes]);

  // Dynamic country highlighting based on active attacks
  useEffect(() => {
    if (!svgRef.current || !activeAttacks.length || !mapData) return;
    
    const svg = d3.select(svgRef.current);
    
    svg.selectAll('.country-path')
      .transition()
      .duration(500)
      .attr('fill', (d: any) => {
        const countryName = d?.properties?.name;
        if (!countryName) return '#0a0a0a';
        const isSource = activeAttacks.some(a => a.from.country === countryName);
        const isTarget = activeAttacks.some(a => a.to.country === countryName);
        if (isSource) return '#ef444444'; // Red for attackers
        if (isTarget) return '#00ff4144'; // Green for targets
        return '#0a0a0a';
      })
      .attr('stroke', (d: any) => {
        const countryName = d?.properties?.name;
        if (!countryName) return '#00ff41';
        const isSource = activeAttacks.some(a => a.from.country === countryName);
        const isTarget = activeAttacks.some(a => a.to.country === countryName);
        if (isSource) return '#ef4444';
        if (isTarget) return '#00ff41';
        return '#00ff41';
      })
      .attr('stroke-opacity', (d: any) => {
        const countryName = d?.properties?.name;
        if (!countryName) return 0.5;
        const isSource = activeAttacks.some(a => a.from.country === countryName);
        const isTarget = activeAttacks.some(a => a.to.country === countryName);
        if (isSource || isTarget) return 1;
        return 0.5;
      });
  }, [activeAttacks, mapData]);

  const toggleFullScreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  return (
    <div ref={containerRef} className={cn(
      "w-full h-full relative group overflow-hidden bg-[#050505]",
      isFullScreen ? "fixed inset-0 z-[100]" : ""
    )}>
      {/* Map Controls */}
      <div className="absolute bottom-4 left-4 z-30 flex gap-2">
        <button 
          onClick={() => {
            if (svgRef.current && zoomRef.current) {
              d3.select(svgRef.current).transition().duration(500).call(zoomRef.current.scaleBy as any, 1.5);
            }
          }}
          className="p-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all shadow-[0_0_10px_rgba(0,255,65,0.1)] hover:shadow-[0_0_15px_rgba(0,255,65,0.3)] hover:border-cyber-green/50"
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
          className="p-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all shadow-[0_0_10px_rgba(0,255,65,0.1)] hover:shadow-[0_0_15px_rgba(0,255,65,0.3)] hover:border-cyber-green/50"
          title="Zoom Out"
        >
          <ZoomOut size={16} />
        </button>
        <button 
          onClick={() => {
            if (svgRef.current && zoomRef.current) {
              d3.select(svgRef.current).transition().duration(750).call(zoomRef.current.transform as any, d3.zoomIdentity);
            }
          }}
          className="p-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all shadow-[0_0_10px_rgba(0,255,65,0.1)] hover:shadow-[0_0_15px_rgba(0,255,65,0.3)] hover:border-cyber-green/50"
          title="Reset Zoom"
        >
          <RefreshCw size={16} />
        </button>
        <button 
          onClick={toggleFullScreen}
          className="p-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all shadow-[0_0_10px_rgba(0,255,65,0.1)] hover:shadow-[0_0_15px_rgba(0,255,65,0.3)] hover:border-cyber-green/50"
          title="Toggle Full Screen"
        >
          {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>

      {/* Full Screen Close Button */}
      {isFullScreen && (
        <button 
          onClick={toggleFullScreen}
          className="absolute top-4 right-4 z-50 p-3 bg-red-500/20 backdrop-blur-md border border-red-500/50 rounded-full text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)]"
          title="Close Full Screen"
        >
          <X size={24} />
        </button>
      )}

      {/* Live Attack Feed Overlay */}
      <div className="absolute top-4 left-4 z-20 w-64 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md border border-[#ef4444]/30 rounded-lg p-3 shadow-2xl">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-[#ef4444] animate-pulse shadow-[0_0_8px_#ef4444]" />
            <span className="text-[10px] font-bold text-[#ef4444] uppercase tracking-widest font-mono">Live Inter-State Feed</span>
          </div>
          <div className="space-y-2 max-h-[240px] overflow-hidden">
            <AnimatePresence mode="popLayout">
              {activeAttacks.length > 0 ? (
                activeAttacks.slice(0, 6).map((attack, i) => (
                  <motion.div 
                    key={`${attack.from.id}-${attack.to.id}-${attack.id}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="text-[9px] font-mono border-l-2 border-[#ef4444]/50 pl-3 py-1.5 bg-white/5 rounded-r"
                  >
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-gray-400 uppercase tracking-tighter">{attack.from.country}</span>
                      <span className="text-[#ef4444] px-1 opacity-50">→</span>
                      <span className="text-gray-300 uppercase tracking-tighter text-right">{attack.to.country}</span>
                    </div>
                    <div className="text-[#ef4444] font-bold truncate text-[8px] uppercase">{attack.from.attackType || 'Cyber Incursion'}</div>
                  </motion.div>
                ))
              ) : (
                <div className="text-[9px] font-mono text-gray-500 italic py-4 text-center">
                  <Activity className="mx-auto mb-2 opacity-20 animate-pulse" size={16} />
                  Scanning global topology...
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="w-full h-full flex items-center justify-center p-4">
        <AnimatePresence>
        {!mapData && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm"
          >
            <div className="relative">
              <Globe className="w-12 h-12 text-cyber-green animate-pulse" />
              <div className="absolute inset-0 border-2 border-cyber-green rounded-full animate-ping opacity-20" />
            </div>
            <span className="mt-4 text-xs font-mono text-cyber-green uppercase tracking-widest animate-pulse">
              Initializing Topology...
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <svg ref={svgRef} className="w-full h-full" />
      </div>

      {/* Advanced Overlay Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* HUD Threat Level */}
        <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg">
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-mono text-gray-500 uppercase">Global Threat Level</span>
              <span className="text-xs font-mono text-red-500 font-bold animate-pulse">CRITICAL</span>
            </div>
            <div className="w-10 h-10 relative">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#ef444422"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="3"
                  strokeDasharray="85, 100"
                  className="animate-[dash_2s_ease-in-out_infinite]"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-mono font-bold text-red-500">85%</span>
              </div>
            </div>
          </div>
          <div className="text-[8px] font-mono text-gray-600 uppercase tracking-tighter">
            Active Incursions: {activeAttacks.length} | Nodes: {nodes.length}
          </div>
        </div>

        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none" />
        <motion.div 
          animate={{ y: ['0%', '100%'] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#ef4444]/20 to-transparent shadow-[0_0_15px_rgba(239,68,68,0.3)] z-10"
        />
      </div>

      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-6 left-6 right-6 md:left-auto md:w-80 bg-black/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-30"
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-2">
                {selectedItem.type === 'attack' ? (
                  <ShieldAlert className="text-red-500" size={18} />
                ) : (
                  <ShieldCheck className="text-cyber-green" size={18} />
                )}
                <h3 className="font-mono font-bold text-white uppercase tracking-wider text-sm">
                  {selectedItem.type === 'attack' ? 'Threat Detected' : 'Node Status'}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedItem(null)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] font-mono text-gray-500 uppercase mb-1">Location</div>
                  <div className="text-xs font-mono text-white">{selectedItem.city}, {selectedItem.country}</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-gray-500 uppercase mb-1">IP Address</div>
                  <div className="text-xs font-mono text-white">{selectedItem.ip}</div>
                </div>
              </div>

              {selectedItem.type === 'attack' && (
                <>
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="text-[10px] font-mono text-red-500 uppercase mb-1">Attack Vector</div>
                    <div className="text-sm font-mono text-red-400 font-bold">{selectedItem.attackType}</div>
                  </div>
                  
                  {selectedItem.targetedPorts && (
                    <div>
                      <div className="text-[10px] font-mono text-gray-500 uppercase mb-2">Targeted Ports</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedItem.targetedPorts.map(port => (
                          <span key={port} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] font-mono text-gray-300">
                            PORT {port}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {selectedItem.type === 'node' && (
                <div>
                  <div className="text-[10px] font-mono text-gray-500 uppercase mb-2">System Integrity</div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full",
                        selectedItem.status === 'secure' ? "bg-cyber-green" :
                        selectedItem.status === 'active' ? "bg-blue-500" : "bg-red-500"
                      )}
                      style={{ width: `${selectedItem.reputation}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-white/10 flex justify-end">
                <button 
                  onClick={() => {
                    if (onAction) {
                      onAction('scanner', selectedItem.ip);
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-cyber-green/10 hover:bg-cyber-green/20 border border-cyber-green/30 rounded-lg text-xs font-mono text-cyber-green transition-all"
                >
                  <Search size={14} />
                  INITIATE SCAN
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
