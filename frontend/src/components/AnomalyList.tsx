/**
 * Anomaly List Component
 * 
 * Displays detected anomalies with severity indicators,
 * filtering, and drill-down capabilities.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  ChevronDown, 
  ChevronUp,
  MapPin,
  Calendar,
  TrendingUp,
  TrendingDown,
  Filter
} from 'lucide-react';
import type { Anomaly } from '../services/analyticsApi';

interface AnomalyListProps {
  anomalies: Anomaly[];
  title?: string;
}

const severityConfig = {
  critical: {
    color: 'bg-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    textColor: 'text-red-400',
    icon: AlertCircle,
  },
  high: {
    color: 'bg-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    textColor: 'text-orange-400',
    icon: AlertTriangle,
  },
  medium: {
    color: 'bg-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    textColor: 'text-yellow-400',
    icon: AlertTriangle,
  },
  low: {
    color: 'bg-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-400',
    icon: Info,
  },
};

const AnomalyCard: React.FC<{ anomaly: Anomaly; index: number }> = ({ anomaly, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = severityConfig[anomaly.severity];
  const SeverityIcon = config.icon;
  
  const isPositiveDeviation = anomaly.z_score > 0;
  const TrendIcon = isPositiveDeviation ? TrendingUp : TrendingDown;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`${config.bgColor} ${config.borderColor} border rounded-lg overflow-hidden`}
    >
      <div 
        className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${config.bgColor}`}>
            <SeverityIcon className={`w-5 h-5 ${config.textColor}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.color} text-white uppercase`}>
                {anomaly.severity}
              </span>
              <span className="text-sm text-gray-400 font-mono">
                {anomaly.metric_name}
              </span>
            </div>
            
            <p className="text-gray-300 text-sm line-clamp-2">{anomaly.description}</p>
            
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              {anomaly.location?.region && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{anomaly.location.region}</span>
                </div>
              )}
              {anomaly.time_period && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{anomaly.time_period}</span>
                </div>
              )}
              <div className={`flex items-center gap-1 ${isPositiveDeviation ? 'text-red-400' : 'text-green-400'}`}>
                <TrendIcon className="w-3 h-3" />
                <span>{Math.abs(anomaly.deviation_percentage).toFixed(1)}%</span>
              </div>
            </div>
          </div>
          
          <div className="flex-shrink-0">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </div>
        </div>
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-700"
          >
            <div className="p-4 bg-black/20">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Observed Value</div>
                  <div className="text-lg font-mono text-white">
                    {anomaly.observed_value?.toLocaleString() ?? 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Expected Value</div>
                  <div className="text-lg font-mono text-gray-400">
                    {anomaly.expected_value?.toLocaleString() ?? 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Z-Score</div>
                  <div className={`text-lg font-mono ${Math.abs(anomaly.z_score) > 3 ? 'text-red-400' : 'text-yellow-400'}`}>
                    {anomaly.z_score.toFixed(2)}σ
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Deviation</div>
                  <div className={`text-lg font-mono ${isPositiveDeviation ? 'text-red-400' : 'text-green-400'}`}>
                    {isPositiveDeviation ? '+' : ''}{anomaly.deviation_percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
              
              {anomaly.location && Object.keys(anomaly.location).length > 1 && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="text-xs text-gray-500 mb-2">Location Details</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(anomaly.location).map(([key, value]) => (
                      <span key={key} className="px-2 py-1 bg-gray-800 rounded text-xs">
                        <span className="text-gray-500">{key}:</span>{' '}
                        <span className="text-gray-300">{value}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const AnomalyList: React.FC<AnomalyListProps> = ({ anomalies, title = 'Detected Anomalies' }) => {
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  const filteredAnomalies = severityFilter
    ? anomalies.filter(a => a.severity === severityFilter)
    : anomalies;
  
  const severityCounts = {
    critical: anomalies.filter(a => a.severity === 'critical').length,
    high: anomalies.filter(a => a.severity === 'high').length,
    medium: anomalies.filter(a => a.severity === 'medium').length,
    low: anomalies.filter(a => a.severity === 'low').length,
  };
  
  return (
    <div className="bg-gray-900/50 rounded-xl border border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <span className="px-2 py-0.5 bg-gray-800 rounded text-sm text-gray-400">
              {filteredAnomalies.length} {severityFilter ? `(${severityFilter})` : 'total'}
            </span>
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-colors ${showFilters ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-gray-800 text-gray-400'}`}
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
        
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 flex flex-wrap gap-2"
            >
              <button
                onClick={() => setSeverityFilter(null)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  !severityFilter ? 'bg-white text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                All ({anomalies.length})
              </button>
              {Object.entries(severityCounts).map(([severity, count]) => (
                <button
                  key={severity}
                  onClick={() => setSeverityFilter(severity)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    severityFilter === severity 
                      ? `${severityConfig[severity as keyof typeof severityConfig].color} text-white` 
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {severity.charAt(0).toUpperCase() + severity.slice(1)} ({count})
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
        {filteredAnomalies.length > 0 ? (
          filteredAnomalies.map((anomaly, index) => (
            <AnomalyCard key={anomaly.id} anomaly={anomaly} index={index} />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            {severityFilter 
              ? `No ${severityFilter} severity anomalies found` 
              : 'No anomalies detected'}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnomalyList;
