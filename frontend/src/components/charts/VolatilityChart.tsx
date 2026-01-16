/**
 * Volatility Chart Component
 * 
 * Visualizes regional volatility scores using bar charts
 * and highlights high-volatility areas.
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, AlertTriangle, MapPin, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import type { VolatilityResult, SeasonalPattern } from '../services/analyticsApi';

interface VolatilityChartProps {
  volatilityResults: VolatilityResult[];
  seasonalPatterns?: SeasonalPattern[];
}

const getVolatilityColor = (cv: number): string => {
  if (cv >= 0.5) return 'bg-red-500';
  if (cv >= 0.3) return 'bg-orange-500';
  if (cv >= 0.2) return 'bg-yellow-500';
  if (cv >= 0.1) return 'bg-blue-500';
  return 'bg-green-500';
};

const getVolatilityLabel = (cv: number): { label: string; color: string } => {
  if (cv >= 0.5) return { label: 'Critical', color: 'text-red-400' };
  if (cv >= 0.3) return { label: 'High', color: 'text-orange-400' };
  if (cv >= 0.2) return { label: 'Moderate', color: 'text-yellow-400' };
  if (cv >= 0.1) return { label: 'Low', color: 'text-blue-400' };
  return { label: 'Stable', color: 'text-green-400' };
};

export const VolatilityChart: React.FC<VolatilityChartProps> = ({
  volatilityResults,
  seasonalPatterns = [],
}) => {
  const [sortBy, setSortBy] = useState<'cv' | 'region' | 'mean'>('cv');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);
  const [showSeasonalPatterns, setShowSeasonalPatterns] = useState(false);

  const sortedResults = useMemo(() => {
    const sorted = [...volatilityResults].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'cv':
          comparison = a.coefficient_of_variation - b.coefficient_of_variation;
          break;
        case 'region':
          comparison = a.region.localeCompare(b.region);
          break;
        case 'mean':
          comparison = a.mean - b.mean;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [volatilityResults, sortBy, sortOrder]);

  const maxCV = useMemo(
    () => Math.max(...volatilityResults.map(r => r.coefficient_of_variation), 0.01),
    [volatilityResults]
  );

  const stats = useMemo(() => {
    if (volatilityResults.length === 0) return null;
    const cvValues = volatilityResults.map(r => r.coefficient_of_variation);
    return {
      avgCV: cvValues.reduce((a, b) => a + b, 0) / cvValues.length,
      maxCV: Math.max(...cvValues),
      minCV: Math.min(...cvValues),
      highVolatilityCount: cvValues.filter(cv => cv >= 0.3).length,
    };
  }, [volatilityResults]);

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-gray-400">Avg Volatility</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {(stats.avgCV * 100).toFixed(1)}%
            </div>
          </div>
          
          <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-xs text-gray-400">Max Volatility</span>
            </div>
            <div className="text-2xl font-bold text-red-400">
              {(stats.maxCV * 100).toFixed(1)}%
            </div>
          </div>
          
          <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-green-400" />
              <span className="text-xs text-gray-400">Min Volatility</span>
            </div>
            <div className="text-2xl font-bold text-green-400">
              {(stats.minCV * 100).toFixed(1)}%
            </div>
          </div>
          
          <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              <span className="text-xs text-gray-400">High Volatility Regions</span>
            </div>
            <div className="text-2xl font-bold text-orange-400">
              {stats.highVolatilityCount}
              <span className="text-sm text-gray-500 ml-1">/ {volatilityResults.length}</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Sort Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-2"
      >
        <span className="text-xs text-gray-500 self-center">Sort by:</span>
        {[
          { key: 'cv' as const, label: 'Volatility' },
          { key: 'region' as const, label: 'Region' },
          { key: 'mean' as const, label: 'Mean Value' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => toggleSort(key)}
            className={`px-3 py-1 text-sm rounded-lg flex items-center gap-1 transition-colors ${
              sortBy === key
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {label}
            {sortBy === key && (
              sortOrder === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
            )}
          </button>
        ))}
      </motion.div>

      {/* Volatility Bars */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-900/50 rounded-xl p-4 border border-gray-700"
      >
        <h4 className="font-semibold text-white mb-4">Regional Volatility Scores</h4>
        
        {sortedResults.length > 0 ? (
          <div className="space-y-3">
            {sortedResults.map((result, index) => {
              const { label, color } = getVolatilityLabel(result.coefficient_of_variation);
              const barWidth = (result.coefficient_of_variation / maxCV) * 100;
              const isExpanded = expandedRegion === result.region;
              
              return (
                <motion.div
                  key={result.region}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gray-800/50 rounded-lg overflow-hidden"
                >
                  <div
                    className="p-3 cursor-pointer hover:bg-gray-800 transition-colors"
                    onClick={() => setExpandedRegion(isExpanded ? null : result.region)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-white font-medium">{result.region}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${color} bg-gray-700`}>
                          {label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xl font-mono font-bold text-white">
                          {(result.coefficient_of_variation * 100).toFixed(1)}%
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{ duration: 0.5, delay: index * 0.05 }}
                        className={`h-full ${getVolatilityColor(result.coefficient_of_variation)} rounded-full`}
                      />
                    </div>
                  </div>
                  
                  {/* Expanded Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-700"
                      >
                        <div className="p-4 grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-xs text-gray-500 mb-1">Mean</div>
                            <div className="text-lg font-mono text-white">
                              {result.mean?.toLocaleString() ?? 'N/A'}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-500 mb-1">Std Dev (σ)</div>
                            <div className="text-lg font-mono text-white">
                              {result.std_deviation?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? 'N/A'}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-500 mb-1">CV Score</div>
                            <div className="text-lg font-mono text-white">
                              {result.coefficient_of_variation?.toFixed(4) ?? 'N/A'}
                            </div>
                          </div>
                        </div>
                        
                        {result.interpretation && (
                          <div className="px-4 pb-4">
                            <div className="p-3 bg-gray-900/50 rounded-lg text-sm text-gray-300">
                              {result.interpretation}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No volatility data available
          </div>
        )}
      </motion.div>

      {/* Seasonal Patterns */}
      {seasonalPatterns.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-900/50 rounded-xl border border-gray-700 overflow-hidden"
        >
          <button
            onClick={() => setShowSeasonalPatterns(!showSeasonalPatterns)}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400" />
              <span className="font-semibold text-white">Seasonal Patterns</span>
              <span className="text-xs text-gray-500">({seasonalPatterns.length} detected)</span>
            </div>
            {showSeasonalPatterns ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>
          
          <AnimatePresence>
            {showSeasonalPatterns && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-gray-700"
              >
                <div className="p-4 space-y-3">
                  {seasonalPatterns.map((pattern, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-800/50 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-white">{pattern.pattern_type}</span>
                        <span className={`text-sm ${
                          pattern.strength > 0.7 ? 'text-green-400' :
                          pattern.strength > 0.4 ? 'text-yellow-400' : 'text-gray-400'
                        }`}>
                          Strength: {(pattern.strength * 100).toFixed(0)}%
                        </span>
                      </div>
                      
                      {pattern.peak_periods.length > 0 && (
                        <div className="text-sm text-gray-400 mb-2">
                          <span className="text-gray-500">Peak periods: </span>
                          {pattern.peak_periods.join(', ')}
                        </div>
                      )}
                      
                      {pattern.trough_periods.length > 0 && (
                        <div className="text-sm text-gray-400">
                          <span className="text-gray-500">Trough periods: </span>
                          {pattern.trough_periods.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default VolatilityChart;
