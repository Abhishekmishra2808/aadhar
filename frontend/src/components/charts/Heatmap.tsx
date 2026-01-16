/**
 * Interactive Heatmap Component for Dimensional Analysis
 * 
 * Displays multi-dimensional data patterns with color gradients
 * to visualize correlations, anomalies, and regional distributions.
 */

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Info, ZoomIn, ZoomOut, Download } from 'lucide-react';

interface HeatmapCell {
  x: string;
  y: string;
  value: number;
  label?: string;
  metadata?: Record<string, any>;
}

interface HeatmapProps {
  data: HeatmapCell[];
  title?: string;
  xLabel?: string;
  yLabel?: string;
  colorScale?: 'diverging' | 'sequential' | 'categorical';
  minValue?: number;
  maxValue?: number;
  showValues?: boolean;
  onCellClick?: (cell: HeatmapCell) => void;
}

// Color scales
const getSequentialColor = (value: number, min: number, max: number): string => {
  const normalized = (value - min) / (max - min || 1);
  const r = Math.round(255 * normalized);
  const g = Math.round(100 + 100 * (1 - normalized));
  const b = Math.round(255 * (1 - normalized));
  return `rgb(${r}, ${g}, ${b})`;
};

const getDivergingColor = (value: number, min: number, max: number): string => {
  const mid = (max + min) / 2;
  const normalized = (value - mid) / (Math.max(Math.abs(max - mid), Math.abs(min - mid)) || 1);
  
  if (normalized > 0) {
    // Positive: blue to purple
    const intensity = Math.min(normalized, 1);
    return `rgb(${Math.round(100 + 100 * intensity)}, ${Math.round(50 + 50 * (1 - intensity))}, ${Math.round(200 + 55 * intensity)})`;
  } else {
    // Negative: yellow to red
    const intensity = Math.min(Math.abs(normalized), 1);
    return `rgb(${Math.round(255)}, ${Math.round(200 * (1 - intensity))}, ${Math.round(100 * (1 - intensity))})`;
  }
};

const getCategoricalColor = (index: number): string => {
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];
  return colors[index % colors.length];
};

export const Heatmap: React.FC<HeatmapProps> = ({
  data,
  title = 'Heatmap Analysis',
  xLabel = 'X Axis',
  yLabel = 'Y Axis',
  colorScale = 'diverging',
  minValue,
  maxValue,
  showValues = true,
  onCellClick,
}) => {
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);
  const [zoom, setZoom] = useState(1);
  
  // Extract unique x and y values
  const { xValues, yValues, cellMap, min, max } = useMemo(() => {
    const xSet = new Set<string>();
    const ySet = new Set<string>();
    const map = new Map<string, HeatmapCell>();
    let min = Infinity;
    let max = -Infinity;
    
    data.forEach(cell => {
      xSet.add(cell.x);
      ySet.add(cell.y);
      map.set(`${cell.x}-${cell.y}`, cell);
      if (cell.value < min) min = cell.value;
      if (cell.value > max) max = cell.value;
    });
    
    return {
      xValues: Array.from(xSet).sort(),
      yValues: Array.from(ySet).sort(),
      cellMap: map,
      min: minValue ?? min,
      max: maxValue ?? max,
    };
  }, [data, minValue, maxValue]);
  
  const getColor = (value: number): string => {
    switch (colorScale) {
      case 'sequential':
        return getSequentialColor(value, min, max);
      case 'categorical':
        return getCategoricalColor(Math.floor(value));
      default:
        return getDivergingColor(value, min, max);
    }
  };
  
  const cellSize = Math.max(30, Math.min(60, 600 / Math.max(xValues.length, yValues.length))) * zoom;
  
  const downloadAsSVG = () => {
    const svg = document.getElementById('heatmap-svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `heatmap-${Date.now()}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900/50 rounded-xl p-6 border border-gray-700"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
            className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-400">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(z => Math.min(2, z + 0.25))}
            className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={downloadAsSVG}
            className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Heatmap Container */}
      <div className="overflow-auto max-h-[500px]">
        <svg
          id="heatmap-svg"
          width={xValues.length * cellSize + 120}
          height={yValues.length * cellSize + 80}
          className="min-w-full"
        >
          {/* Y-axis label */}
          <text
            x={10}
            y={(yValues.length * cellSize) / 2 + 40}
            fill="#9CA3AF"
            fontSize={12}
            transform={`rotate(-90, 10, ${(yValues.length * cellSize) / 2 + 40})`}
            textAnchor="middle"
          >
            {yLabel}
          </text>
          
          {/* X-axis label */}
          <text
            x={(xValues.length * cellSize) / 2 + 100}
            y={yValues.length * cellSize + 70}
            fill="#9CA3AF"
            fontSize={12}
            textAnchor="middle"
          >
            {xLabel}
          </text>
          
          {/* Y-axis labels */}
          {yValues.map((y, yi) => (
            <text
              key={`y-${yi}`}
              x={95}
              y={yi * cellSize + cellSize / 2 + 40}
              fill="#D1D5DB"
              fontSize={Math.min(10, cellSize / 3)}
              textAnchor="end"
              dominantBaseline="middle"
            >
              {y.length > 12 ? y.slice(0, 12) + '...' : y}
            </text>
          ))}
          
          {/* X-axis labels */}
          {xValues.map((x, xi) => (
            <text
              key={`x-${xi}`}
              x={xi * cellSize + cellSize / 2 + 100}
              y={yValues.length * cellSize + 55}
              fill="#D1D5DB"
              fontSize={Math.min(10, cellSize / 3)}
              textAnchor="middle"
              transform={`rotate(-45, ${xi * cellSize + cellSize / 2 + 100}, ${yValues.length * cellSize + 55})`}
            >
              {x.length > 8 ? x.slice(0, 8) + '...' : x}
            </text>
          ))}
          
          {/* Heatmap cells */}
          {yValues.map((y, yi) =>
            xValues.map((x, xi) => {
              const cell = cellMap.get(`${x}-${y}`);
              const value = cell?.value ?? 0;
              const isHovered = hoveredCell?.x === x && hoveredCell?.y === y;
              
              return (
                <g key={`cell-${xi}-${yi}`}>
                  <rect
                    x={xi * cellSize + 100}
                    y={yi * cellSize + 40}
                    width={cellSize - 1}
                    height={cellSize - 1}
                    fill={getColor(value)}
                    stroke={isHovered ? '#FFFFFF' : 'transparent'}
                    strokeWidth={isHovered ? 2 : 0}
                    rx={2}
                    className="cursor-pointer transition-all duration-150"
                    onMouseEnter={() => cell && setHoveredCell(cell)}
                    onMouseLeave={() => setHoveredCell(null)}
                    onClick={() => cell && onCellClick?.(cell)}
                  />
                  {showValues && cellSize >= 35 && (
                    <text
                      x={xi * cellSize + cellSize / 2 + 100}
                      y={yi * cellSize + cellSize / 2 + 40}
                      fill="#FFFFFF"
                      fontSize={Math.min(10, cellSize / 4)}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="pointer-events-none"
                    >
                      {value.toFixed(1)}
                    </text>
                  )}
                </g>
              );
            })
          )}
        </svg>
      </div>
      
      {/* Color Legend */}
      <div className="flex items-center justify-center mt-4 gap-2">
        <span className="text-xs text-gray-400">{min.toFixed(1)}</span>
        <div 
          className="h-3 w-32 rounded"
          style={{
            background: colorScale === 'diverging' 
              ? 'linear-gradient(to right, #FF6B35, #FFC800, #9747FF, #3B82F6)'
              : 'linear-gradient(to right, #3B82F6, #8B5CF6, #EC4899, #EF4444)'
          }}
        />
        <span className="text-xs text-gray-400">{max.toFixed(1)}</span>
      </div>
      
      {/* Tooltip */}
      {hoveredCell && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-xl z-50 pointer-events-none"
          style={{
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: '20px'
          }}
        >
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-400 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-white">
                {hoveredCell.x} × {hoveredCell.y}
              </div>
              <div className="text-lg font-bold text-blue-400">
                {hoveredCell.value.toFixed(2)}
              </div>
              {hoveredCell.label && (
                <div className="text-xs text-gray-400 mt-1">{hoveredCell.label}</div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Heatmap;
