/**
 * Dimensional Analysis Component
 * 
 * Visualizes multi-dimensional outlier analysis results
 * with interactive slice exploration.
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Target, Filter, ChevronRight, AlertCircle } from 'lucide-react';
import type { DimensionalSlice } from '../services/analyticsApi';

interface DimensionalAnalysisProps {
  dimensionalSlices: DimensionalSlice[];
  outlierClusters: Array<{
    cluster_id: string;
    regions: string[];
    time_periods: string[];
    common_characteristics: string[];
    severity_score: number;
  }>;
}

const getZScoreColor = (zScore: number): string => {
  const absZ = Math.abs(zScore);
  if (absZ >= 3) return 'text-red-400';
  if (absZ >= 2.5) return 'text-orange-400';
  if (absZ >= 2) return 'text-yellow-400';
  return 'text-blue-400';
};

const getZScoreBgColor = (zScore: number): string => {
  const absZ = Math.abs(zScore);
  if (absZ >= 3) return 'bg-red-500/20 border-red-500/30';
  if (absZ >= 2.5) return 'bg-orange-500/20 border-orange-500/30';
  if (absZ >= 2) return 'bg-yellow-500/20 border-yellow-500/30';
  return 'bg-blue-500/20 border-blue-500/30';
};

export const DimensionalAnalysis: React.FC<DimensionalAnalysisProps> = ({
  dimensionalSlices,
  outlierClusters,
}) => {
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [filterRegion, setFilterRegion] = useState<string>('');
  const [filterTimePeriod, setFilterTimePeriod] = useState<string>('');
  const [sortByZScore, setSortByZScore] = useState(true);

  // Generate unique ID for cluster based on its dimensions
  const getClusterId = (cluster: OutlierCluster, index: number) => {
    const dimStr = Object.entries(cluster.dimensions)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join('|');
    return `cluster-${index}-${dimStr}`;
  };

  // Get unique regions and time periods
  const { regions, timePeriods } = useMemo(() => {
    const regions = new Set<string>();
    const timePeriods = new Set<string>();
    
    dimensionalSlices.forEach(slice => {
      if (slice.region) regions.add(slice.region);
      if (slice.time_period) timePeriods.add(slice.time_period);
    });
    
    return {
      regions: Array.from(regions).filter(Boolean).sort(),
      timePeriods: Array.from(timePeriods).filter(Boolean).sort(),
    };
  }, [dimensionalSlices]);

  // Filter and sort slices
  const filteredSlices = useMemo(() => {
    let filtered = dimensionalSlices.filter(slice => slice.is_outlier);
    
    if (filterRegion) {
      filtered = filtered.filter(slice => slice.region === filterRegion);
    }
    if (filterTimePeriod) {
      filtered = filtered.filter(slice => slice.time_period === filterTimePeriod);
    }
    
    if (sortByZScore) {
      filtered.sort((a, b) => Math.abs(b.z_score) - Math.abs(a.z_score));
    }
    
    return filtered;
  }, [dimensionalSlices, filterRegion, filterTimePeriod, sortByZScore]);

  // Stats
  const stats = useMemo(() => {
    const outliers = dimensionalSlices.filter(s => s.is_outlier);
    return {
      totalSlices: dimensionalSlices.length,
      outlierCount: outliers.length,
      outlierRate: outliers.length / dimensionalSlices.length * 100,
      maxZScore: Math.max(...outliers.map(s => Math.abs(s.z_score)), 0),
      avgZScore: outliers.length > 0
        ? outliers.reduce((acc, s) => acc + Math.abs(s.z_score), 0) / outliers.length
        : 0,
    };
  }, [dimensionalSlices]);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Box className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-gray-400">Total Slices</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {stats.totalSlices.toLocaleString()}
          </div>
        </div>
        
        <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-xs text-gray-400">Outliers</span>
          </div>
          <div className="text-2xl font-bold text-red-400">
            {stats.outlierCount}
            <span className="text-sm text-gray-500 ml-1">
              ({stats.outlierRate.toFixed(1)}%)
            </span>
          </div>
        </div>
        
        <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-orange-400" />
            <span className="text-xs text-gray-400">Max Z-Score</span>
          </div>
          <div className="text-2xl font-bold text-orange-400">
            {stats.maxZScore.toFixed(2)}
          </div>
        </div>
        
        <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-gray-400">Avg Z-Score</span>
          </div>
          <div className="text-2xl font-bold text-yellow-400">
            {stats.avgZScore.toFixed(2)}
          </div>
        </div>
      </motion.div>

      {/* Outlier Clusters */}
      {outlierClusters.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-900/50 rounded-xl p-4 border border-gray-700"
        >
          <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-400" />
            Outlier Clusters
          </h4>
          
          <div className="grid gap-3">
            {outlierClusters.map((cluster, index) => {
              const clusterId = getClusterId(cluster, index);
              return (
              <motion.div
                key={clusterId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedCluster === clusterId
                    ? 'bg-purple-500/20 border-purple-500/30'
                    : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800'
                }`}
                onClick={() => setSelectedCluster(
                  selectedCluster === clusterId ? null : clusterId
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      cluster.severity_score >= 0.7 ? 'bg-red-500' :
                      cluster.severity_score >= 0.4 ? 'bg-orange-500' : 'bg-yellow-500'
                    }`} />
                    <div>
                      <span className="font-medium text-white">{cluster.cluster_id}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        Severity: {(cluster.severity_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${
                    selectedCluster === cluster.cluster_id ? 'rotate-90' : ''
                  }`} />
                </div>
                
                <AnimatePresence>
                  {selectedCluster === cluster.cluster_id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-4 space-y-3"
                    >
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Dimensions</div>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(cluster.dimensions || {}).map(([key, value]) => (
                            <span key={key} className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">
                              {key}: {value}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mt-3">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Metric Value</div>
                          <div className="text-lg font-mono text-white">{cluster.metric_value?.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Z-Score</div>
                          <div className="text-lg font-mono text-white">{cluster.z_score?.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Sample Size</div>
                          <div className="text-lg font-mono text-white">{cluster.sample_size?.toLocaleString()}</div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Deviation</div>
                        <div className="text-sm text-white">
                          {cluster.deviation_percentage?.toFixed(1)}% from national mean
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
            })}
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-wrap gap-4"
      >
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-400">Filters:</span>
        </div>
        
        <select
          value={filterRegion}
          onChange={e => setFilterRegion(e.target.value)}
          className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Regions</option>
          {regions.map(region => (
            <option key={region} value={region}>{region}</option>
          ))}
        </select>
        
        <select
          value={filterTimePeriod}
          onChange={e => setFilterTimePeriod(e.target.value)}
          className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Time Periods</option>
          {timePeriods.map(period => (
            <option key={period} value={period}>{period}</option>
          ))}
        </select>
        
        <button
          onClick={() => setSortByZScore(!sortByZScore)}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            sortByZScore
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Sort by Z-Score
        </button>
      </motion.div>

      {/* Dimensional Slices Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gray-900/50 rounded-xl p-4 border border-gray-700"
      >
        <h4 className="font-semibold text-white mb-4">Outlier Slices ({filteredSlices.length})</h4>
        
        {filteredSlices.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filteredSlices.slice(0, 24).map((slice, index) => (
              <motion.div
                key={`slice-${index}-${slice.region || 'none'}-${slice.time_period || 'none'}-${slice.dimension}-${slice.value}-${slice.z_score}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.02 }}
                className={`p-4 rounded-lg border ${getZScoreBgColor(slice.z_score)}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-medium text-white">{slice.region}</div>
                    <div className="text-xs text-gray-500">{slice.time_period}</div>
                  </div>
                  <div className={`text-lg font-mono font-bold ${getZScoreColor(slice.z_score)}`}>
                    Z = {slice.z_score.toFixed(2)}
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Dimension:</span>
                    <span className="text-white">{slice.dimension}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Value:</span>
                    <span className="text-white font-mono">{slice.value.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Expected:</span>
                    <span className="text-gray-400 font-mono">
                      {slice.expected_range[0].toLocaleString()} - {slice.expected_range[1].toLocaleString()}
                    </span>
                  </div>
                </div>
                
                {slice.is_outlier && (
                  <div className="mt-3 pt-3 border-t border-gray-600/50">
                    <div className={`text-xs ${getZScoreColor(slice.z_score)}`}>
                      {Math.abs(slice.z_score) >= 3 ? '⚠️ Critical deviation' :
                       Math.abs(slice.z_score) >= 2.5 ? '⚠️ High deviation' :
                       '⚠️ Moderate deviation'}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No outlier slices found matching the filters
          </div>
        )}
        
        {filteredSlices.length > 24 && (
          <div className="mt-4 text-center text-sm text-gray-500">
            Showing 24 of {filteredSlices.length} outlier slices
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default DimensionalAnalysis;
