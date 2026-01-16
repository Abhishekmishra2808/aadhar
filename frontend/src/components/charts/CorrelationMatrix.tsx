/**
 * Correlation Matrix Heatmap Component
 * 
 * Interactive visualization of variable correlations
 * with tooltips and significance indicators.
 */

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { GitBranch, Info } from 'lucide-react';
import type { CorrelationResult } from '../services/analyticsApi';

interface CorrelationMatrixProps {
  correlationMatrix: Record<string, Record<string, number>>;
  strongCorrelations: CorrelationResult[];
  driverVariables: Array<{
    variable: string;
    driver_score: number;
    average_correlation: number;
    max_correlation: number;
  }>;
}

const getCorrelationColor = (value: number): string => {
  if (value >= 0.8) return 'bg-green-500';
  if (value >= 0.6) return 'bg-green-400';
  if (value >= 0.4) return 'bg-green-300';
  if (value >= 0.2) return 'bg-green-200';
  if (value >= 0) return 'bg-gray-500';
  if (value >= -0.2) return 'bg-red-200';
  if (value >= -0.4) return 'bg-red-300';
  if (value >= -0.6) return 'bg-red-400';
  if (value >= -0.8) return 'bg-red-500';
  return 'bg-red-600';
};

const getCorrelationTextColor = (value: number): string => {
  const absValue = Math.abs(value);
  if (absValue >= 0.6) return 'text-white';
  return 'text-gray-800';
};

export const CorrelationMatrix: React.FC<CorrelationMatrixProps> = ({
  correlationMatrix,
  strongCorrelations,
  driverVariables,
}) => {
  const [hoveredCell, setHoveredCell] = useState<{ row: string; col: string } | null>(null);
  const [selectedCorrelation, setSelectedCorrelation] = useState<CorrelationResult | null>(null);

  const variables = useMemo(() => Object.keys(correlationMatrix), [correlationMatrix]);
  
  // Truncate variable names for display
  const truncateName = (name: string, maxLength = 12) => {
    if (name.length <= maxLength) return name;
    return name.slice(0, maxLength) + '...';
  };

  const findCorrelationDetails = (var1: string, var2: string): CorrelationResult | undefined => {
    return strongCorrelations.find(
      c => (c.variable_1 === var1 && c.variable_2 === var2) ||
           (c.variable_1 === var2 && c.variable_2 === var1)
    );
  };

  return (
    <div className="space-y-6">
      {/* Driver Variables Summary */}
      {driverVariables.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-900/20 rounded-xl p-4 border border-blue-500/20"
        >
          <div className="flex items-center gap-2 mb-3">
            <GitBranch className="w-5 h-5 text-blue-400" />
            <h4 className="font-semibold text-white">Key Driver Variables</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {driverVariables.slice(0, 4).map((driver, index) => (
              <div
                key={driver.variable}
                className="bg-gray-800/50 rounded-lg p-3"
              >
                <div className="text-sm text-gray-400 mb-1">#{index + 1}</div>
                <div className="font-medium text-white truncate" title={driver.variable}>
                  {driver.variable}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Score: {(driver.driver_score * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Correlation Matrix */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gray-900/50 rounded-xl p-4 border border-gray-700 overflow-x-auto"
      >
        <h4 className="font-semibold text-white mb-4">Correlation Matrix</h4>
        
        {variables.length > 0 ? (
          <div className="inline-block">
            <table className="border-collapse">
              <thead>
                <tr>
                  <th className="p-1"></th>
                  {variables.map(variable => (
                    <th
                      key={variable}
                      className="p-1 text-xs text-gray-400 font-normal transform -rotate-45 origin-left h-20"
                      title={variable}
                    >
                      {truncateName(variable)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {variables.map(rowVar => (
                  <tr key={rowVar}>
                    <td
                      className="p-1 text-xs text-gray-400 text-right pr-2 whitespace-nowrap"
                      title={rowVar}
                    >
                      {truncateName(rowVar)}
                    </td>
                    {variables.map(colVar => {
                      const value = correlationMatrix[rowVar]?.[colVar] ?? 0;
                      const isHovered = hoveredCell?.row === rowVar && hoveredCell?.col === colVar;
                      const correlationDetails = findCorrelationDetails(rowVar, colVar);
                      
                      return (
                        <td
                          key={colVar}
                          className="p-0.5"
                          onMouseEnter={() => setHoveredCell({ row: rowVar, col: colVar })}
                          onMouseLeave={() => setHoveredCell(null)}
                          onClick={() => correlationDetails && setSelectedCorrelation(correlationDetails)}
                        >
                          <div
                            className={`
                              w-8 h-8 flex items-center justify-center text-xs font-mono rounded
                              ${getCorrelationColor(value)}
                              ${getCorrelationTextColor(value)}
                              ${isHovered ? 'ring-2 ring-white' : ''}
                              ${correlationDetails ? 'cursor-pointer' : ''}
                              transition-all duration-150
                            `}
                            title={`${rowVar} ↔ ${colVar}: ${value.toFixed(3)}`}
                          >
                            {rowVar === colVar ? '1' : value.toFixed(1)}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Color Legend */}
            <div className="flex items-center gap-2 mt-4 text-xs text-gray-400">
              <span>Negative</span>
              <div className="flex">
                {[-1, -0.5, 0, 0.5, 1].map(v => (
                  <div
                    key={v}
                    className={`w-6 h-4 ${getCorrelationColor(v)}`}
                  />
                ))}
              </div>
              <span>Positive</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No correlation data available
          </div>
        )}
      </motion.div>

      {/* Strong Correlations List */}
      {strongCorrelations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-900/50 rounded-xl p-4 border border-gray-700"
        >
          <h4 className="font-semibold text-white mb-4">Strong Correlations</h4>
          <div className="space-y-2">
            {strongCorrelations.slice(0, 8).map((corr, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
                onClick={() => setSelectedCorrelation(corr)}
              >
                <div className={`w-3 h-3 rounded-full ${corr.correlation_coefficient > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{corr.variable_1}</span>
                    <span className="text-gray-500">↔</span>
                    <span className="text-white font-medium">{corr.variable_2}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {corr.relationship_type.replace('_', ' ')}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-mono font-bold ${corr.correlation_coefficient > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {corr.correlation_coefficient > 0 ? '+' : ''}{corr.correlation_coefficient.toFixed(3)}
                  </div>
                  <div className="text-xs text-gray-500">
                    p = {corr.p_value.toFixed(4)}
                  </div>
                </div>
                {corr.is_significant && (
                  <div className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                    Significant
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Correlation Detail Modal */}
      {selectedCorrelation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedCorrelation(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gray-900 rounded-xl p-6 max-w-md w-full border border-gray-700"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Correlation Details</h3>
            </div>
            
            <div className="space-y-4">
              <div className="text-center py-4 bg-gray-800 rounded-lg">
                <div className="text-gray-400 text-sm mb-1">Variables</div>
                <div className="text-white font-medium">
                  {selectedCorrelation.variable_1} ↔ {selectedCorrelation.variable_2}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-800 rounded-lg">
                  <div className="text-gray-400 text-xs mb-1">Correlation</div>
                  <div className={`text-2xl font-mono font-bold ${
                    selectedCorrelation.correlation_coefficient > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {selectedCorrelation.correlation_coefficient.toFixed(4)}
                  </div>
                </div>
                <div className="text-center p-3 bg-gray-800 rounded-lg">
                  <div className="text-gray-400 text-xs mb-1">P-Value</div>
                  <div className="text-2xl font-mono text-white">
                    {selectedCorrelation.p_value.toFixed(6)}
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <div className="text-gray-400 text-xs mb-2">Interpretation</div>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {selectedCorrelation.interpretation}
                </p>
              </div>
              
              <button
                onClick={() => setSelectedCorrelation(null)}
                className="w-full py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default CorrelationMatrix;
