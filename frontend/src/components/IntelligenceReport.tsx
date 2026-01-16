/**
 * Intelligence Report Component
 * 
 * Displays LLM-generated insights, recommendations, and risk assessments
 * in a clean, actionable format.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  AlertTriangle, 
  CheckCircle, 
  Target, 
  TrendingUp, 
  Clock,
  Lightbulb,
  Shield
} from 'lucide-react';
import type { IntelligenceReport, StrategicRecommendation } from '../services/analyticsApi';

interface IntelligenceReportProps {
  report: IntelligenceReport;
}

const priorityColors: Record<number, string> = {
  1: 'bg-red-500/20 border-red-500/50 text-red-300',
  2: 'bg-orange-500/20 border-orange-500/50 text-orange-300',
  3: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300',
  4: 'bg-blue-500/20 border-blue-500/50 text-blue-300',
  5: 'bg-gray-500/20 border-gray-500/50 text-gray-300',
};

const complexityColors: Record<string, string> = {
  low: 'text-green-400',
  medium: 'text-yellow-400',
  high: 'text-red-400',
};

const RecommendationCard: React.FC<{ rec: StrategicRecommendation; index: number }> = ({ rec, index }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.1 }}
    className={`p-4 rounded-lg border ${priorityColors[rec.priority]} mb-3`}
  >
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold">
        P{rec.priority}
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-white mb-1">{rec.recommendation}</h4>
        <p className="text-sm text-gray-400 mb-2">{rec.rationale}</p>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-green-400" />
            <span className="text-gray-400">Impact:</span>
            <span className="text-gray-300">{rec.expected_impact}</span>
          </div>
          <div className="flex items-center gap-1">
            <Target className="w-3 h-3" />
            <span className="text-gray-400">Complexity:</span>
            <span className={complexityColors[rec.implementation_complexity]}>
              {rec.implementation_complexity}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-blue-400" />
            <span className="text-gray-400">Timeline:</span>
            <span className="text-gray-300">{rec.timeline}</span>
          </div>
          {rec.affected_regions.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-gray-400">Regions:</span>
              <span className="text-gray-300">{rec.affected_regions.slice(0, 2).join(', ')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  </motion.div>
);

export const IntelligenceReportCard: React.FC<IntelligenceReportProps> = ({ report }) => {
  const confidencePercentage = Math.round(report.confidence_score * 100);
  
  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-xl p-6 border border-purple-500/20"
      >
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-6 h-6 text-purple-400" />
          <h2 className="text-xl font-bold text-white">Executive Summary</h2>
          <div className="ml-auto flex items-center gap-2 text-sm">
            <span className="text-gray-400">Confidence:</span>
            <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                style={{ width: `${confidencePercentage}%` }}
              />
            </div>
            <span className="text-purple-400 font-mono">{confidencePercentage}%</span>
          </div>
        </div>
        <p className="text-gray-300 leading-relaxed">{report.executive_summary}</p>
      </motion.div>

      {/* Root Cause Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gray-900/50 rounded-xl p-6 border border-gray-700"
      >
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-yellow-400" />
          <h3 className="text-lg font-semibold text-white">Root Cause Analysis</h3>
        </div>
        <ul className="space-y-2">
          {report.root_cause_analysis.map((cause, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="flex items-start gap-2"
            >
              <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-300">{cause}</span>
            </motion.li>
          ))}
        </ul>
      </motion.div>

      {/* Strategic Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-900/50 rounded-xl p-6 border border-gray-700"
      >
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Strategic Recommendations</h3>
          <span className="text-xs text-gray-500 ml-auto">Sorted by priority</span>
        </div>
        <div>
          {report.strategic_recommendations.map((rec, index) => (
            <RecommendationCard key={index} rec={rec} index={index} />
          ))}
        </div>
      </motion.div>

      {/* Risk Assessment */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-red-900/20 rounded-xl p-6 border border-red-500/20"
      >
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-red-400" />
          <h3 className="text-lg font-semibold text-white">Risk Assessment</h3>
        </div>
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-gray-300">{report.risk_assessment}</p>
        </div>
      </motion.div>

      {/* Contextual Factors */}
      {report.contextual_factors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-900/50 rounded-xl p-6 border border-gray-700"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Contextual Factors</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {report.contextual_factors.map((factor, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg"
              >
                <div className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-300 capitalize">
                  {factor.factor_type}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-300">{factor.description}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                    <span>Relevance: {Math.round(factor.relevance_score * 100)}%</span>
                    {factor.source && <span>• {factor.source}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Export with both names for compatibility
export { IntelligenceReportCard as IntelligenceReport };
export default IntelligenceReportCard;
