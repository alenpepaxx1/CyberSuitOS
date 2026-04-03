/* COPYRIGHT ALEN PEPA */
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, ShieldCheck, Zap, Search, Globe, X, Terminal as TerminalIcon, Activity, Maximize2, Minimize2, ZoomIn, ZoomOut } from 'lucide-react';
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

  // High-frequency "Live" simulation for visual activity
  useEffect(() => {
    if (nodes.length < 2) return;
    
    const interval = setInterval(() => {
      setActiveAttacks(prev => {
        // Occasionally add a new random "simulated" attack to keep it busy
        if (Math.random() > 0.7 && prev.length < 40) {
          const from = nodes[Math.floor(Math.random() * nodes.length)];
          const to = nodes[Math.floor(Math.random() * nodes.length)];
          if (from.id !== to.id) {
            return [...prev, { from, to, isSimulated: true }];
          }
        }
        // Occasionally remove a simulated attack
        if (Math.random() > 0.8 && prev.length > 15) {
          const simulatedIndices = prev.map((a, i) => a.isSimulated ? i : -1).filter(i => i !== -1);
          if (simulatedIndices.length > 0) {
            const indexToRemove = simulatedIndices[Math.floor(Math.random() * simulatedIndices.length)];
            return prev.filter((_, i) => i !== indexToRemove);
          }
        }
        return prev;
      });
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [nodes]);

  useEffect(() => {
    d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(data => setMapData(data))
      .catch(err => console.error('Failed to load map data:', err));
  }, []);

  useEffect(() => {
    if (!svgRef.current || !mapData) return;

    const width = 800;
    const height = 300;
    const svg = d3.select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .on('zoom', (event) => {
        svg.selectAll('g').attr('transform', event.transform);
      });

    svg.call(zoom);

    // Clear previous
    svg.selectAll('*').remove();

    // Projection
    const projection = d3.geoMercator()
      .scale(120)
      .translate([width / 2, height / 1.5]);

    const path = d3.geoPath().projection(projection);

    // 0. Draw Coordinate Grid
    const gridGroup = svg.append('g').attr('class', 'grid-lines').attr('opacity', 0.05);
    const graticule = d3.geoGraticule();
    gridGroup.append('path')
      .datum(graticule)
      .attr('class', 'graticule')
      .attr('d', path as any)
      .attr('fill', 'none')
      .attr('stroke', '#00ff41')
      .attr('stroke-width', 0.5);

    // Draw world map (simplified)
    const countries = topojson.feature(mapData, mapData.objects.countries) as any;

    // 1. Generate Nodes
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
          // If explicitly empty, we still want to show the map but maybe fewer random nodes
          generatedNodes = [];
        } else {
          // Fallback random nodes if initialNodes is undefined
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
            { long: -70.6483, lat: -33.4489, city: 'Santiago', country: 'Chile' },
            { long: 55.2708, lat: 25.2048, city: 'Dubai', country: 'UAE' },
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

        // 2. Calculate Attacks
        let attacks: any[] = [];
        if (initialLines && initialLines.length > 0) {
          attacks = initialLines.map(line => {
            const from = generatedNodes.find(n => n.id === line.fromId);
            const to = generatedNodes.find(n => n.id === line.toId);
            return from && to ? { from, to } : null;
          }).filter(Boolean);
        } else if (generatedNodes.length > 0) {
          attacks = Array.from({ length: 30 }, () => ({
            from: generatedNodes[Math.floor(Math.random() * generatedNodes.length)],
            to: generatedNodes[Math.floor(Math.random() * generatedNodes.length)]
          })).filter(a => a.from && a.to && a.from.id !== a.to.id);
        }

        setNodes(generatedNodes);
        setActiveAttacks(attacks);

        // 3. Draw Countries
        svg.append('g')
          .selectAll('path')
          .data(countries.features)
          .enter()
          .append('path')
          .attr('d', path as any)
          .attr('fill', (d: any) => {
            const countryName = d.properties.name;
            const isSource = attacks.some(a => a.from.country === countryName);
            const isTarget = attacks.some(a => a.to.country === countryName);
            if (isSource) return '#ef444422';
            if (isTarget) return '#3b82f622';
            return '#0a0a0a';
          })
          .attr('stroke', (d: any) => {
            const countryName = d.properties.name;
            const isSource = attacks.some(a => a.from.country === countryName);
            const isTarget = attacks.some(a => a.to.country === countryName);
            if (isSource) return '#ef444444';
            if (isTarget) return '#3b82f644';
            return '#222';
          })
          .attr('stroke-width', 0.5)
          .attr('class', 'country-path')
          .style('transition', 'fill 0.5s, stroke 0.5s');

        // 4. Draw Ripples
        const rippleGroup = svg.append('g').attr('class', 'ripples');
        attacks.forEach(attack => {
          const [x, y] = projection([attack.to.long, attack.to.lat])!;
          rippleGroup.append('circle')
            .attr('cx', x)
            .attr('cy', y)
            .attr('r', 0)
            .attr('fill', 'none')
            .attr('stroke', '#ef4444')
            .attr('stroke-width', 1)
            .attr('opacity', 0.8)
            .append('animate')
            .attr('attributeName', 'r')
            .attr('from', '0')
            .attr('to', '20')
            .attr('dur', '2s')
            .attr('repeatCount', 'indefinite');
            
          rippleGroup.append('circle')
            .attr('cx', x)
            .attr('cy', y)
            .attr('r', 0)
            .attr('fill', 'none')
            .attr('stroke', '#ef4444')
            .attr('stroke-width', 1)
            .attr('opacity', 0.8)
            .append('animate')
            .attr('attributeName', 'opacity')
            .attr('from', '0.8')
            .attr('to', '0')
            .attr('dur', '2s')
            .attr('repeatCount', 'indefinite');
        });

        // 5. Draw Nodes
        const nodeGroup = svg.append('g').attr('class', 'nodes');
        const labelGroup = svg.append('g').attr('class', 'labels').attr('pointer-events', 'none');

        nodeGroup.selectAll('circle')
          .data(generatedNodes)
          .enter()
          .append('circle')
          .attr('cx', d => projection([d.long, d.lat])![0])
          .attr('cy', d => projection([d.long, d.lat])![1])
          .attr('r', d => d.type === 'attack' ? 4 : 3)
          .attr('fill', d => d.type === 'attack' ? '#ef4444' : '#00ff41')
          .attr('class', 'map-node')
          .style('cursor', 'pointer')
          .style('filter', d => d.type === 'attack' ? 'drop-shadow(0 0 4px #ef4444)' : 'drop-shadow(0 0 4px #00ff41)')
          .on('click', (event, d) => {
            event.stopPropagation();
            setSelectedItem(d);
          })
          .on('mouseover', function() {
            d3.select(this).transition().duration(200).attr('r', 6);
          })
          .on('mouseout', function(event, d) {
            d3.select(this).transition().duration(200).attr('r', d.type === 'attack' ? 4 : 3);
          })
          .each(function(d) {
            if (d.type === 'attack') {
              d3.select(this)
                .append('animate')
                .attr('attributeName', 'r')
                .attr('values', '4;7;4')
                .attr('dur', '1.5s')
                .attr('repeatCount', 'indefinite');
              
              d3.select(this)
                .append('animate')
                .attr('attributeName', 'opacity')
                .attr('values', '0.8;0.3;0.8')
                .attr('dur', '1.5s')
                .attr('repeatCount', 'indefinite');
            }

            // Add labels for high threat nodes
            if (d.threatLevel === 'critical' || d.threatLevel === 'high') {
              const [x, y] = projection([d.long, d.lat])!;
              labelGroup.append('text')
                .attr('x', x + 8)
                .attr('y', y + 3)
                .attr('fill', d.type === 'attack' ? '#ef4444' : '#00ff41')
                .attr('font-family', 'monospace')
                .attr('font-size', '6px')
                .attr('font-weight', 'bold')
                .attr('opacity', 0.6)
                .text(d.city.toUpperCase());
            }
          });

        const attackGroup = svg.append('g').attr('class', 'attacks');

        attacks.forEach((d, i) => {
          const start = projection([d.from.long, d.from.lat])!;
          const end = projection([d.to.long, d.to.lat])!;
          const dx = end[0] - start[0];
          const dy = end[1] - start[1];
          const dr = Math.sqrt(dx * dx + dy * dy);
          const pathId = `attack-path-${i}`;
          const pathD = `M${start[0]},${start[1]}A${dr},${dr} 0 0,1 ${end[0]},${end[1]}`;

          // The path itself
          attackGroup.append('path')
            .attr('id', pathId)
            .attr('d', pathD)
            .attr('fill', 'none')
            .attr('stroke', '#ef4444')
            .attr('stroke-width', 0.8)
            .attr('stroke-dasharray', '4,4')
            .attr('opacity', 0.3)
            .style('cursor', 'pointer')
            .on('click', (event) => {
              event.stopPropagation();
              setSelectedItem({
                id: `attack-${Math.random()}`,
                long: (d.from.long + d.to.long) / 2,
                lat: (d.from.lat + d.to.lat) / 2,
                type: 'attack',
                country: d.to.country,
                city: d.to.city,
                ip: d.from.ip,
                threatLevel: 'critical',
                status: 'compromised',
                lastSeen: 'Active',
                attackType: ['DDoS Flood', 'Exfiltration', 'Zero-day Exploit'][Math.floor(Math.random() * 3)],
                targetedPorts: [443, 8080],
                reputation: 0
              });
            })
            .on('mouseover', function() {
              d3.select(this).transition().duration(200).attr('stroke-width', 2).attr('opacity', 0.8);
            })
            .on('mouseout', function() {
              d3.select(this).transition().duration(200).attr('stroke-width', 0.8).attr('opacity', 0.3);
            });

          // The animated particle
          const particle = attackGroup.append('circle')
            .attr('r', 1.5)
            .attr('fill', '#ef4444')
            .style('filter', 'drop-shadow(0 0 3px #ef4444)');

          particle.append('animateMotion')
            .attr('dur', `${Math.random() * 2 + 1.5}s`)
            .attr('repeatCount', 'indefinite')
            .append('mpath')
            .attr('xlink:href', `#${pathId}`);
            
          // Add a second, trailing particle for more "flow"
          const particle2 = attackGroup.append('circle')
            .attr('r', 1)
            .attr('fill', '#ef4444')
            .attr('opacity', 0.6);

          particle2.append('animateMotion')
            .attr('dur', `${Math.random() * 2 + 1.5}s`)
            .attr('begin', '0.5s')
            .attr('repeatCount', 'indefinite')
            .append('mpath')
            .attr('xlink:href', `#${pathId}`);

          // Add a "Data Burst" particle occasionally
          if (Math.random() > 0.5) {
            const burst = attackGroup.append('circle')
              .attr('r', 2.5)
              .attr('fill', '#fff')
              .attr('opacity', 0.8)
              .style('filter', 'drop-shadow(0 0 5px #ef4444)');

            burst.append('animateMotion')
              .attr('dur', `${Math.random() * 1 + 1}s`)
              .attr('repeatCount', 'indefinite')
              .attr('begin', `${Math.random() * 3}s`)
              .append('mpath')
              .attr('xlink:href', `#${pathId}`);
          }
        });
  }, [initialNodes, initialLines, mapData]);

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
      "w-full h-full relative group overflow-hidden bg-black",
      isFullScreen ? "fixed inset-0 z-[100]" : ""
    )}>
      {/* Map Controls */}
      <div className="absolute bottom-4 left-4 z-30 flex gap-2">
        <button 
          onClick={() => {
            const svg = d3.select(svgRef.current);
            svg.transition().duration(750).call(d3.zoom<SVGSVGElement, unknown>().transform as any, d3.zoomIdentity.scale(1.5));
          }}
          className="p-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          title="Zoom In"
        >
          <ZoomIn size={16} />
        </button>
        <button 
          onClick={() => {
            const svg = d3.select(svgRef.current);
            svg.transition().duration(750).call(d3.zoom<SVGSVGElement, unknown>().transform as any, d3.zoomIdentity);
          }}
          className="p-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          title="Reset Zoom"
        >
          <ZoomOut size={16} />
        </button>
        <button 
          onClick={toggleFullScreen}
          className="p-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          title="Toggle Full Screen"
        >
          {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>

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
                    key={`${attack.from.id}-${attack.to.id}-${i}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3, delay: i * 0.1 }}
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
            className="absolute bottom-6 left-6 right-6 md:left-auto md:w-80 bg-cyber-card/95 backdrop-blur-xl border border-cyber-border rounded-2xl shadow-2xl overflow-hidden z-30"
          >
            <div className="p-4 border-b border-cyber-border flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-2">
                {selectedItem.type === 'attack' ? (
                  <ShieldAlert className="text-red-500" size={16} />
                ) : (
                  <Activity className="text-cyber-green" size={16} />
                )}
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-white">
                  {selectedItem.type === 'attack' ? 'Threat Detected' : 'Node Intelligence'}
                </span>
              </div>
              <button 
                onClick={() => setSelectedItem(null)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors text-gray-500 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-bold text-white leading-tight">{selectedItem.city}</h4>
                    <p className="text-[10px] font-mono text-gray-500 uppercase">{selectedItem.country}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-mono uppercase border",
                      selectedItem.threatLevel === 'critical' ? "bg-red-500/20 text-red-500 border-red-500/30" :
                      selectedItem.threatLevel === 'high' ? "bg-orange-500/20 text-orange-500 border-orange-500/30" :
                      "bg-cyber-green/20 text-cyber-green border-cyber-green/30"
                    )}>
                      {selectedItem.threatLevel} risk
                    </span>
                    {selectedItem.reputation !== undefined && (
                      <span className="text-[8px] font-mono text-gray-600 uppercase">Reputation: {selectedItem.reputation}/100</span>
                    )}
                  </div>
                </div>

                {selectedItem.type === 'attack' && (
                  <div className="p-2 bg-red-500/5 border border-red-500/10 rounded-lg">
                    <div className="text-[9px] font-mono text-red-400 uppercase mb-1">Attack Intelligence</div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white">{selectedItem.attackType}</span>
                      <span className="text-[10px] font-mono text-gray-500">Ports: {selectedItem.targetedPorts?.join(', ')}</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 py-3 border-y border-cyber-border/50">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-gray-600 uppercase">IP Address</span>
                    <div className="text-xs font-mono text-gray-300">{selectedItem.ip}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-gray-600 uppercase">Status</span>
                    <div className={cn(
                      "text-xs font-mono uppercase",
                      selectedItem.status === 'compromised' ? "text-red-500" : "text-cyber-green"
                    )}>
                      {selectedItem.status}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => onAction?.('scanner', selectedItem.ip)}
                  className="flex items-center justify-center gap-2 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-[10px] font-mono font-bold text-red-500 transition-all uppercase"
                >
                  <Search size={12} /> Scan Target
                </button>
                <button 
                  onClick={() => onAction?.('network', selectedItem.ip)}
                  className="flex items-center justify-center gap-2 py-2 bg-cyber-green/10 hover:bg-cyber-green/20 border border-cyber-green/20 rounded-lg text-[10px] font-mono font-bold text-cyber-green transition-all uppercase"
                >
                  <Globe size={12} /> OSINT Trace
                </button>
                <button 
                  onClick={() => onAction?.('topology', selectedItem.ip)}
                  className="flex items-center justify-center gap-2 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg text-[10px] font-mono font-bold text-blue-500 transition-all uppercase"
                >
                  <Activity size={12} /> Map Topology
                </button>
                <button 
                  onClick={() => onAction?.('payloads', selectedItem.ip)}
                  className="flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-mono font-bold text-gray-400 hover:text-white transition-all uppercase"
                >
                  <TerminalIcon size={12} /> Deploy Payload
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
