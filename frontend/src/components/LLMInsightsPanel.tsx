/**
 * LLM Insights Panel - AI-Powered Data Pattern Analysis
 * 
 * Displays AI-generated insights from the Hugging Face LLM
 * in a user-friendly format with actionable recommendations.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Target,
  Zap,
  TrendingUp,
  Shield,
  Clock,
  MapPin,
  Sparkles,
} from 'lucide-react';

interface ContextualFactor {
  factor_type: string;
  description: string;
  relevance_score: number;
  source?: string;
}

interface Recommendation {
  priority: number;
  recommendation: string;
  rationale: string;
  expected_impact: string;
  implementation_complexity: 'low' | 'medium' | 'high';
  affected_regions?: string[];
  timeline?: string;
}

interface LLMInsightsProps {
  executiveSummary?: string;
  rootCauses?: string[];
  contextualFactors?: ContextualFactor[];
  recommendations?: Recommendation[];
  riskAssessment?: string;
  confidenceScore?: number;
  isLoading?: boolean;
  error?: string;
}

const getComplexityColor = (complexity: string) => {
  switch (complexity) {
    case 'low': return 'text-green-400 bg-green-400/10';
    case 'medium': return 'text-yellow-400 bg-yellow-400/10';
    case 'high': return 'text-red-400 bg-red-400/10';
    default: return 'text-gray-400 bg-gray-400/10';
  }
};

const getPriorityBadge = (priority: number) => {
  if (priority <= 1) return { color: 'bg-red-500', label: 'Critical' };
  if (priority <= 2) return { color: 'bg-orange-500', label: 'High' };
  if (priority <= 3) return { color: 'bg-yellow-500', label: 'Medium' };
  return { color: 'bg-blue-500', label: 'Low' };
};

const getFactorIcon = (factorType: string) => {
  switch (factorType) {
    case 'policy': return Shield;
    case 'weather': return Zap;
    case 'infrastructure': return Target;
    case 'demographic': return TrendingUp;
    default: return Lightbulb;
  }
};

export const LLMInsightsPanel: React.FC<LLMInsightsProps> = ({
  executiveSummary,
  rootCauses = [],
  contextualFactors = [],
  recommendations = [],
  riskAssessment,
  confidenceScore,
  isLoading = false,
  error,
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['summary', 'recommendations'])
  );
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };
  
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-xl p-6 border border-purple-500/30"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Brain className="w-8 h-8 text-purple-400" />
            <motion.div
              className="absolute inset-0"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className="w-8 h-8 text-purple-300 opacity-50" />
            </motion.div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">AI Analysis in Progress</h3>
            <p className="text-sm text-gray-400">Analyzing patterns with Llama 3.1...</p>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {[1, 2, 3].map(i => (
            <motion.div
              key={i}
              className="h-4 bg-gray-700/50 rounded"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </motion.div>
    );
  }
  
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-red-900/20 rounded-xl p-6 border border-red-500/30"
      >
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-400" />
          <div>
            <h3 className="text-lg font-semibold text-white">Analysis Error</h3>
            <p className="text-sm text-gray-400">{error}</p>
          </div>
        </div>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Brain className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">AI-Powered Insights</h2>
            <p className="text-sm text-gray-400">Pattern analysis by Llama 3.1</p>
          </div>
        </div>
        {confidenceScore !== undefined && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-full">
            <Target className="w-4 h-4 text-green-400" />
            <span className="text-sm text-white font-medium">
              {(confidenceScore * 100).toFixed(0)}% Confidence
            </span>
          </div>
        )}
      </div>
      
      {/* Executive Summary */}
      {executiveSummary && (
        <motion.div
          layout
          className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-xl border border-blue-500/30 overflow-hidden"
        >
          <button
            onClick={() => toggleSection('summary')}
            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-blue-400" />
              <span className="font-semibold text-white">Executive Summary</span>
            </div>
            {expandedSections.has('summary') ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          <AnimatePresence>
            {expandedSections.has('summary') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-4 pb-4"
              >
                <p className="text-gray-300 leading-relaxed">{executiveSummary}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
      
      {/* Root Causes */}
      {rootCauses.length > 0 && (
        <motion.div
          layout
          className="bg-gray-900/50 rounded-xl border border-gray-700 overflow-hidden"
        >
          <button
            onClick={() => toggleSection('causes')}
            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              <span className="font-semibold text-white">Root Causes ({rootCauses.length})</span>
            </div>
            {expandedSections.has('causes') ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          <AnimatePresence>
            {expandedSections.has('causes') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-4 pb-4"
              >
                <ul className="space-y-2">
                  {rootCauses.map((cause, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg"
                    >
                      <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-orange-500/20 text-orange-400 rounded-full text-sm font-medium">
                        {index + 1}
                      </span>
                      <span className="text-gray-300">{cause}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
      
      {/* Contextual Factors */}
      {contextualFactors.length > 0 && (
        <motion.div
          layout
          className="bg-gray-900/50 rounded-xl border border-gray-700 overflow-hidden"
        >
          <button
            onClick={() => toggleSection('factors')}
            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Lightbulb className="w-5 h-5 text-yellow-400" />
              <span className="font-semibold text-white">Contextual Factors ({contextualFactors.length})</span>
            </div>
            {expandedSections.has('factors') ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          <AnimatePresence>
            {expandedSections.has('factors') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-4 pb-4"
              >
                <div className="grid gap-3 md:grid-cols-2">
                  {contextualFactors.map((factor, index) => {
                    const Icon = getFactorIcon(factor.factor_type);
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-3 bg-gray-800/50 rounded-lg"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="w-4 h-4 text-yellow-400" />
                          <span className="text-xs text-yellow-400 uppercase tracking-wide font-medium">
                            {factor.factor_type}
                          </span>
                          <span className="ml-auto text-xs text-gray-500">
                            {(factor.relevance_score * 100).toFixed(0)}% relevant
                          </span>
                        </div>
                        <p className="text-sm text-gray-300">{factor.description}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
      
      {/* Strategic Recommendations */}
      {recommendations.length > 0 && (
        <motion.div
          layout
          className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-xl border border-green-500/30 overflow-hidden"
        >
          <button
            onClick={() => toggleSection('recommendations')}
            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="font-semibold text-white">Strategic Recommendations ({recommendations.length})</span>
            </div>
            {expandedSections.has('recommendations') ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          <AnimatePresence>
            {expandedSections.has('recommendations') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-4 pb-4"
              >
                <div className="space-y-4">
                  {recommendations
                    .sort((a, b) => a.priority - b.priority)
                    .map((rec, index) => {
                      const badge = getPriorityBadge(rec.priority);
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.15 }}
                          className="p-4 bg-gray-800/50 rounded-lg border border-gray-700"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${badge.color} text-white`}>
                                {badge.label}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-xs ${getComplexityColor(rec.implementation_complexity)}`}>
                                {rec.implementation_complexity} complexity
                              </span>
                            </div>
                            {rec.timeline && (
                              <div className="flex items-center gap-1 text-xs text-gray-400">
                                <Clock className="w-3 h-3" />
                                {rec.timeline}
                              </div>
                            )}
                          </div>
                          
                          <h4 className="font-medium text-white mb-2">{rec.recommendation}</h4>
                          
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="text-gray-500">Rationale: </span>
                              <span className="text-gray-300">{rec.rationale}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Expected Impact: </span>
                              <span className="text-green-400">{rec.expected_impact}</span>
                            </div>
                            {rec.affected_regions && rec.affected_regions.length > 0 && (
                              <div className="flex items-center gap-2 flex-wrap">
                                <MapPin className="w-3 h-3 text-gray-500" />
                                {rec.affected_regions.map((region, i) => (
                                  <span key={i} className="px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-300">
                                    {region}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
      
      {/* Risk Assessment */}
      {riskAssessment && (
        <motion.div
          layout
          className="bg-red-900/20 rounded-xl p-4 border border-red-500/30"
        >
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-red-400 mt-0.5" />
            <div>
              <h4 className="font-semibold text-white mb-1">Risk Assessment</h4>
              <p className="text-sm text-gray-300">{riskAssessment}</p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default LLMInsightsPanel;
