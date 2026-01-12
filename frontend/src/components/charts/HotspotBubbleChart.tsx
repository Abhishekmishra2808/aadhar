import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { stateHotspots } from '../../data/mockData';

interface HotspotTooltipProps {
  hotspot: typeof stateHotspots[0];
  position: { x: number; y: number };
}

function HotspotTooltip({ hotspot, position }: HotspotTooltipProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="absolute glass rounded-xl p-4 border border-white/20 z-50 pointer-events-none min-w-[200px]"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -120%)',
      }}
    >
      <h4 className="text-white font-semibold mb-2">{hotspot.state}</h4>
      <div className="space-y-1 text-sm">
        <p className="text-white/60">
          <span className="text-red-400">{hotspot.anomalyCount.toLocaleString()}</span> anomalies
        </p>
        <p className="text-white/50">{hotspot.primaryIssue}</p>
      </div>
    </motion.div>
  );
}

export function HotspotBubbleChart() {
  const [activeHotspot, setActiveHotspot] = useState<typeof stateHotspots[0] | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const maxAnomalyCount = Math.max(...stateHotspots.map(h => h.anomalyCount));

  const getSeverityColor = (count: number) => {
    const ratio = count / maxAnomalyCount;
    if (ratio > 0.7) return { fill: 'rgba(239, 68, 68, 0.6)', stroke: '#EF4444' };
    if (ratio > 0.4) return { fill: 'rgba(251, 191, 36, 0.5)', stroke: '#FBB024' };
    return { fill: 'rgba(34, 197, 94, 0.4)', stroke: '#22C55E' };
  };

  return (
    <motion.div
      className="glass rounded-2xl p-6 h-full relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <h3 className="text-lg font-semibold text-white/90 mb-1">Anomaly Hotspots</h3>
      <p className="text-sm text-white/40 mb-6">Geographic distribution of issues</p>

      {/* India Map Placeholder with Bubbles */}
      <div className="relative h-64 rounded-xl bg-white/5 overflow-hidden">
        {/* Grid pattern background */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
          }}
        />

        {/* India outline hint */}
        <svg
          className="absolute inset-0 w-full h-full opacity-20"
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
        >
          <path
            d="M50,15 L65,20 L75,35 L80,50 L75,65 L65,75 L50,85 L40,80 L35,70 L30,55 L35,40 L45,25 Z"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
          />
        </svg>

        {/* Hotspot Bubbles */}
        {stateHotspots.map((hotspot, index) => {
          const colors = getSeverityColor(hotspot.anomalyCount);
          return (
            <motion.div
              key={hotspot.state}
              className="absolute cursor-pointer"
              style={{
                left: `${hotspot.x}%`,
                top: `${hotspot.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              onMouseEnter={(e) => {
                setActiveHotspot(hotspot);
                const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                if (rect) {
                  setMousePosition({
                    x: hotspot.x,
                    y: hotspot.y,
                  });
                }
              }}
              onMouseLeave={() => setActiveHotspot(null)}
            >
              <motion.div
                className="rounded-full"
                style={{
                  width: hotspot.size,
                  height: hotspot.size,
                  backgroundColor: colors.fill,
                  border: `2px solid ${colors.stroke}`,
                  boxShadow: `0 0 20px ${colors.fill}`,
                }}
                whileHover={{ scale: 1.2 }}
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: index * 0.2,
                }}
              />
            </motion.div>
          );
        })}

        {/* Tooltip */}
        <AnimatePresence>
          {activeHotspot && (
            <HotspotTooltip hotspot={activeHotspot} position={mousePosition} />
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/60 border border-red-500" />
          <span className="text-xs text-white/50">High</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500/50 border border-yellow-500" />
          <span className="text-xs text-white/50">Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500/40 border border-green-500" />
          <span className="text-xs text-white/50">Low</span>
        </div>
      </div>
    </motion.div>
  );
}
