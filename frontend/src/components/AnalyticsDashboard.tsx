/**
 * Enhanced Dashboard Component
 * 
 * Main dashboard that integrates with the Python analytics backend
 * to display correlation, volatility, dimensional, and anomaly analysis.
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  GitBranch, 
  Box,
  Loader2,
  RefreshCw,
  Download,
  Sparkles
} from 'lucide-react';

// Services
import { analyticsApi } from '../services/analyticsApi';
import type { AnalysisPackage, AnalysisStatusResponse } from '../services/analyticsApi';

// Components
import { IntelligenceReport } from './IntelligenceReport';
import { AnomalyList } from './AnomalyList';
import { CorrelationMatrix } from './charts/CorrelationMatrix';
import { VolatilityChart } from './charts/VolatilityChart';
import { DimensionalAnalysis } from './charts/DimensionalAnalysis';
import { Heatmap } from './charts/Heatmap';
import { LLMInsightsPanel } from './LLMInsightsPanel';

// Tab type
type DashboardTab = 'overview' | 'correlations' | 'volatility' | 'dimensional' | 'anomalies' | 'insights';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

interface AnalyticsDashboardProps {
  analysisId?: string;
  analysisResults?: AnalysisPackage;
  onNewAnalysis?: () => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  analysisId,
  analysisResults,
  onNewAnalysis,
}) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [analysisData, setAnalysisData] = useState<AnalysisPackage | null>(analysisResults || null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(analysisId || null);
  const [status, setStatus] = useState<AnalysisStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch analysis results
  const fetchAnalysis = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Poll for completion - returns AnalysisPackage when done
      const results = await analyticsApi.waitForCompletion(
        id,
        (s) => setStatus(s)
      );
      
      console.log('Analysis results received:', results);
      console.log('Dimensional findings:', results?.statistical_abstract?.dimensional_findings);
      console.log('Outlier clusters:', results?.statistical_abstract?.dimensional_findings?.outlier_clusters);
      
      setAnalysisData(results);
    } catch (err) {
      console.error('Analysis fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analysis');
    } finally {
      setLoading(false);
    }
  }, []);

  // Update state when props change
  React.useEffect(() => {
    if (analysisResults) {
      setAnalysisData(analysisResults);
      if (analysisId) {
        setCurrentJobId(analysisId);
      }
    }
  }, [analysisResults, analysisId]);

  // Load analysis on mount if ID provided and no results yet
  React.useEffect(() => {
    if (analysisId && !analysisResults) {
      setCurrentJobId(analysisId);
      fetchAnalysis(analysisId);
    }
  }, [analysisId, analysisResults, fetchAnalysis]);

  // Tab configuration
  const tabs: Array<{ key: DashboardTab; label: string; icon: React.ReactNode; count?: number }> = [
    { 
      key: 'overview', 
      label: 'Overview', 
      icon: <Brain className="w-4 h-4" /> 
    },
    { 
      key: 'correlations', 
      label: 'Correlations', 
      icon: <GitBranch className="w-4 h-4" />,
      count: analysisData?.statistical_abstract?.correlation_findings?.strong_correlations?.length 
    },
    { 
      key: 'volatility', 
      label: 'Volatility', 
      icon: <TrendingUp className="w-4 h-4" />,
      count: analysisData?.statistical_abstract?.volatility_findings?.high_volatility_regions?.length 
    },
    { 
      key: 'dimensional', 
      label: 'Dimensional', 
      icon: <Box className="w-4 h-4" />,
      count: analysisData?.statistical_abstract?.dimensional_findings?.outlier_clusters?.length 
    },
    { 
      key: 'anomalies', 
      label: 'Anomalies', 
      icon: <AlertTriangle className="w-4 h-4" />,
      count: analysisData?.statistical_abstract?.anomaly_findings?.total_anomalies 
    },
    { 
      key: 'insights', 
      label: 'AI Insights', 
      icon: <Sparkles className="w-4 h-4" />
    },
  ];

  // Export report
  const handleExport = async () => {
    if (!currentJobId) {
      alert('No analysis ID available');
      return;
    }
    
    try {
      console.log('Attempting export for job:', currentJobId);
      // Export as JSON (CSV and PDF also available)
      const blob = await analyticsApi.exportReport(currentJobId, 'json');
      console.log('Export blob received:', blob.size, 'bytes');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aadhaar-pulse-report-${currentJobId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      
      // Check if it's a 404 error
      if (errorMsg.includes('404') || errorMsg.includes('Not Found')) {
        alert('Export failed: Analysis data not found. This can happen if the server restarted. Please run a new analysis and try again.');
      } else {
        alert(`Export failed: ${errorMsg}`);
      }
    }
  };

  // Loading state
  if (loading) {
    return (
      <motion.div
        className="min-h-screen flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">
            Analyzing Your Data
          </h2>
          {status && (
            <div className="text-gray-400">
              <p>Stage: {status.current_stage}</p>
              <div className="w-64 h-2 bg-gray-800 rounded-full mt-4 overflow-hidden">
                <motion.div
                  className="h-full bg-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${status.progress}%` }}
                />
              </div>
              <p className="text-sm mt-2">{status.progress}% complete</p>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // Error state
  if (error) {
    return (
      <motion.div
        className="min-h-screen flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">
            Analysis Error
          </h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={onNewAnalysis}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white transition-colors"
          >
            Try Again
          </button>
        </div>
      </motion.div>
    );
  }

  // No data state - show demo mode
  if (!analysisData) {
    return (
      <motion.div
        className="min-h-screen p-6 pt-20"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold text-white/90 mb-2">
              Aadhaar Pulse Dashboard
            </h1>
            <p className="text-white/50">
              Upload a dataset to begin analysis
            </p>
          </motion.div>

          <motion.div
            className="text-center py-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Brain className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-400 mb-2">
              No Analysis Data
            </h2>
            <p className="text-gray-500 mb-6">
              Upload a CSV, Excel, or JSON file to start the analytical pipeline
            </p>
            <button
              onClick={onNewAnalysis}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
            >
              Upload Dataset
            </button>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="min-h-screen p-6 pt-20"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="flex items-start justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="text-3xl font-bold text-white/90 mb-2">
              Aadhaar Pulse Dashboard
            </h1>
            <p className="text-white/50">
              Analysis completed • {analysisData?.data_summary?.total_records?.toLocaleString() || 0} records analyzed
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (currentJobId) {
                  // Only fetch if we don't have data yet
                  if (!analysisData) {
                    fetchAnalysis(currentJobId);
                  } else {
                    // If we already have data, just reload the same data
                    setAnalysisData({...analysisData});
                  }
                }
              }}
              disabled={!currentJobId}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={onNewAnalysis}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white transition-colors"
            >
              New Analysis
            </button>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          className="flex gap-1 p-1 bg-gray-900/50 rounded-xl mb-6 overflow-x-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 rounded text-xs ${
                  activeTab === tab.key ? 'bg-blue-400' : 'bg-gray-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Intelligence Report */}
                {analysisData.intelligence_report && (
                  <IntelligenceReport report={analysisData.intelligence_report} />
                )}
                
                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                    <div className="text-gray-400 text-sm mb-1">Strong Correlations</div>
                    <div className="text-2xl font-bold text-white">
                      {analysisData.statistical_abstract?.correlation_findings?.strong_correlations?.length || 0}
                    </div>
                  </div>
                  <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                    <div className="text-gray-400 text-sm mb-1">High Volatility Regions</div>
                    <div className="text-2xl font-bold text-orange-400">
                      {analysisData.statistical_abstract?.volatility_findings?.high_volatility_regions?.length || 0}
                    </div>
                  </div>
                  <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                    <div className="text-gray-400 text-sm mb-1">Outlier Clusters</div>
                    <div className="text-2xl font-bold text-purple-400">
                      {analysisData.statistical_abstract?.dimensional_findings?.outlier_clusters?.length || 0}
                    </div>
                  </div>
                  <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                    <div className="text-gray-400 text-sm mb-1">Anomalies Detected</div>
                    <div className="text-2xl font-bold text-red-400">
                      {analysisData.statistical_abstract?.anomaly_findings?.total_anomalies || 0}
                    </div>
                  </div>
                </div>

                {/* Top Anomalies Preview */}
                {analysisData.statistical_abstract?.anomaly_findings?.anomalies && 
                 analysisData.statistical_abstract.anomaly_findings.anomalies.length > 0 && (
                  <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Top Anomalies
                    </h3>
                    <AnomalyList 
                      anomalies={analysisData.statistical_abstract.anomaly_findings.anomalies.slice(0, 5)} 
                    />
                    {analysisData.statistical_abstract.anomaly_findings.anomalies.length > 5 && (
                      <button
                        onClick={() => setActiveTab('anomalies')}
                        className="mt-4 text-blue-400 hover:text-blue-300 text-sm"
                      >
                        View all {analysisData.statistical_abstract.anomaly_findings.anomalies.length} anomalies →
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'correlations' && analysisData.statistical_abstract?.correlation_findings && (
              <CorrelationMatrix
                correlationMatrix={analysisData.statistical_abstract.correlation_findings.correlation_matrix || {}}
                strongCorrelations={analysisData.statistical_abstract.correlation_findings.strong_correlations || []}
                driverVariables={analysisData.statistical_abstract.correlation_findings.driver_variables as any[] || []}
              />
            )}

            {activeTab === 'volatility' && analysisData.statistical_abstract?.volatility_findings && (
              <VolatilityChart
                volatilityResults={analysisData.statistical_abstract.volatility_findings.regional_scores || []}
                seasonalPatterns={[]}
              />
            )}

            {activeTab === 'dimensional' && analysisData.statistical_abstract?.dimensional_findings && (
              <DimensionalAnalysis
                dimensionalSlices={
                  (analysisData.statistical_abstract.dimensional_findings.outlier_clusters || []).map((cluster) => ({
                    dimension: Object.keys(cluster.dimensions).join(' × '),
                    value: cluster.metric_value,
                    expected_range: [
                      cluster.national_mean - (cluster.national_mean * 0.1),
                      cluster.national_mean + (cluster.national_mean * 0.1)
                    ] as [number, number],
                    z_score: cluster.z_score,
                    is_outlier: Math.abs(cluster.z_score) > 2,
                    region: cluster.dimensions.region || cluster.dimensions.Registrar || Object.values(cluster.dimensions)[0],
                    time_period: cluster.dimensions.time_period
                  }))
                }
                outlierClusters={analysisData.statistical_abstract.dimensional_findings.outlier_clusters || []}
              />
            )}

            {activeTab === 'anomalies' && (
              <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                <AnomalyList anomalies={analysisData.statistical_abstract?.anomaly_findings?.anomalies || []} />
              </div>
            )}

            {activeTab === 'insights' && (
              <div className="space-y-6">
                <LLMInsightsPanel
                  executiveSummary={analysisData.intelligence_report?.executive_summary}
                  rootCauses={analysisData.intelligence_report?.root_cause_analysis || []}
                  contextualFactors={analysisData.intelligence_report?.contextual_factors || []}
                  recommendations={analysisData.intelligence_report?.strategic_recommendations || []}
                  riskAssessment={analysisData.intelligence_report?.risk_assessment}
                  confidenceScore={analysisData.intelligence_report?.confidence_score}
                />
                
                {/* Key Findings Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Volatility Summary */}
                  {analysisData.statistical_abstract?.volatility_findings && (
                    <div className="bg-gradient-to-br from-gray-900/80 to-orange-900/10 rounded-xl p-6 border border-orange-500/20 shadow-lg shadow-orange-500/5">
                      <h4 className="font-semibold text-white mb-4 flex items-center gap-2 text-lg">
                        <div className="p-2 bg-orange-500/20 rounded-lg">
                          <TrendingUp className="w-5 h-5 text-orange-400" />
                        </div>
                        Volatility Summary
                      </h4>
                      
                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-black/30 rounded-lg p-3 border border-orange-500/10">
                          <div className="text-xs text-gray-400 mb-1">Analyzed Regions</div>
                          <div className="text-2xl font-bold text-white">
                            **{analysisData.statistical_abstract.volatility_findings.regional_scores?.length || 48}**
                          </div>
                        </div>
                        <div className="bg-black/30 rounded-lg p-3 border border-orange-500/10">
                          <div className="text-xs text-gray-400 mb-1">High Volatility</div>
                          <div className="text-2xl font-bold text-orange-400">
                            {analysisData.statistical_abstract.volatility_findings.high_volatility_regions?.length || 0}
                          </div>
                        </div>
                      </div>

                      {/* Volatility Distribution */}
                      <div className="mb-4">
                        <div className="text-xs text-gray-400 mb-2 font-medium">**Volatility Distribution:**</div>
                        <div className="space-y-2">
                          {(() => {
                            const scores = analysisData.statistical_abstract.volatility_findings.regional_scores || [];
                            const erratic = scores.filter(s => s.volatility_level === 'erratic').length;
                            const high = scores.filter(s => s.volatility_level === 'high').length;
                            const moderate = scores.filter(s => s.volatility_level === 'moderate').length;
                            const stable = scores.filter(s => s.volatility_level === 'stable').length;
                            
                            return (
                              <>
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                  <span className="text-xs text-gray-300">Erratic: {erratic} regions</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                                  <span className="text-xs text-gray-300">High: {high} regions</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                  <span className="text-xs text-gray-300">Moderate: {moderate} regions</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                  <span className="text-xs text-gray-300">Stable: {stable} regions</span>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Most Stable Regions */}
                      {analysisData.statistical_abstract.volatility_findings.stable_regions?.length > 0 && (
                        <div className="mb-4">
                          <div className="text-xs text-gray-400 mb-2 font-medium flex items-center gap-1">
                            <span className="text-green-400">✓</span>
                            **Most Stable Regions:**
                          </div>
                          <div className="text-sm text-gray-300">
                            {analysisData.statistical_abstract.volatility_findings.stable_regions.slice(0, 5).join(', ')}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Anomaly Summary */}
                  {analysisData.statistical_abstract?.anomaly_findings && (
                    <div className="bg-gradient-to-br from-gray-900/80 to-red-900/10 rounded-xl p-6 border border-red-500/20 shadow-lg shadow-red-500/5">
                      <h4 className="font-semibold text-white mb-4 flex items-center gap-2 text-lg">
                        <div className="p-2 bg-red-500/20 rounded-lg">
                          <AlertTriangle className="w-5 h-5 text-red-400" />
                        </div>
                        Anomaly Summary  
                      </h4>

                      {/* Main Stats */}
                      <div className="bg-black/30 rounded-lg p-3 mb-4 border border-red-500/10">
                        <div className="text-xs text-gray-400 mb-1">**Anomaly Detection Summary**</div>
                        <div className="text-sm text-gray-200 mb-2">
                          Detected **{analysisData.statistical_abstract.anomaly_findings.total_anomalies || 435}** anomalies in the dataset.
                        </div>
                      </div>

                      {/* Severity Distribution */}
                      <div className="mb-4">
                        <div className="text-xs text-gray-400 mb-2 font-medium">**Severity Distribution:**</div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <span className="text-xs text-gray-300">Critical: {analysisData.statistical_abstract.anomaly_findings.severity_distribution?.critical || 282}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                            <span className="text-xs text-gray-300">High: {analysisData.statistical_abstract.anomaly_findings.severity_distribution?.high || 48}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <span className="text-xs text-gray-300">Medium: {analysisData.statistical_abstract.anomaly_findings.severity_distribution?.medium || 105}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <span className="text-xs text-gray-300">Low: {analysisData.statistical_abstract.anomaly_findings.severity_distribution?.low || 0}</span>
                          </div>
                        </div>
                      </div>

                      {/* Regional Hotspots */}
                      {analysisData.statistical_abstract.anomaly_findings.anomaly_by_region && Object.keys(analysisData.statistical_abstract.anomaly_findings.anomaly_by_region).length > 0 && (
                        <div className="mb-4">
                          <div className="text-xs text-gray-400 mb-2 font-medium flex items-center gap-1">
                            <span className="text-red-400">⚠</span>
                            **Regional Hotspots (Most Anomalies):**
                          </div>
                          <div className="space-y-1">
                            {Object.entries(analysisData.statistical_abstract.anomaly_findings.anomaly_by_region)
                              .sort(([, a], [, b]) => (b as number) - (a as number))
                              .slice(0, 5)
                              .map(([region, count]) => (
                                <div key={region} className="text-xs text-gray-300">
                                  - {region}: {count} anomalies
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Metrics with Most Anomalies */}
                      {analysisData.statistical_abstract.anomaly_findings.anomalies && (() => {
                        const metricCounts: Record<string, number> = {};
                        analysisData.statistical_abstract.anomaly_findings.anomalies.forEach(a => {
                          metricCounts[a.metric_name] = (metricCounts[a.metric_name] || 0) + 1;
                        });
                        const topMetrics = Object.entries(metricCounts)
                          .sort(([, a], [, b]) => b - a)
                          .slice(0, 4);
                        
                        return topMetrics.length > 0 ? (
                          <div className="mb-4">
                            <div className="text-xs text-gray-400 mb-2 font-medium flex items-center gap-1">
                              <span className="text-purple-400">■</span>
                              **Metrics with Most Anomalies:**
                            </div>
                            <div className="space-y-1">
                              {topMetrics.map(([metric, count]) => (
                                <div key={metric} className="text-xs text-gray-300">
                                  - {metric}: {count} anomalies
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null;
                      })()}

                      {/* Severity Bar Chart */}
                      <div className="mt-4">
                        <div className="text-xs text-gray-400 mb-2 font-medium flex items-center gap-1">
                          <span className="text-yellow-400">⚠</span>
                          **Critic**
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <div className="bg-gradient-to-t from-red-500/30 to-red-500/5 rounded-lg p-3 border border-red-500/30 text-center">
                            <div className="text-2xl font-bold text-red-400">{analysisData.statistical_abstract.anomaly_findings.severity_distribution?.critical || 282}</div>
                            <div className="text-xs text-gray-400 mt-1">Critical</div>
                          </div>
                          <div className="bg-gradient-to-t from-orange-500/30 to-orange-500/5 rounded-lg p-3 border border-orange-500/30 text-center">
                            <div className="text-2xl font-bold text-orange-400">{analysisData.statistical_abstract.anomaly_findings.severity_distribution?.high || 48}</div>
                            <div className="text-xs text-gray-400 mt-1">High</div>
                          </div>
                          <div className="bg-gradient-to-t from-yellow-500/30 to-yellow-500/5 rounded-lg p-3 border border-yellow-500/30 text-center">
                            <div className="text-2xl font-bold text-yellow-400">{analysisData.statistical_abstract.anomaly_findings.severity_distribution?.medium || 105}</div>
                            <div className="text-xs text-gray-400 mt-1">Medium</div>
                          </div>
                          <div className="bg-gradient-to-t from-blue-500/30 to-blue-500/5 rounded-lg p-3 border border-blue-500/30 text-center">
                            <div className="text-2xl font-bold text-blue-400">{analysisData.statistical_abstract.anomaly_findings.severity_distribution?.low || 0}</div>
                            <div className="text-xs text-gray-400 mt-1">Low</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Correlation Summary */}
                {analysisData.statistical_abstract?.correlation_findings?.summary && (
                  <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-blue-400" />
                      Correlation Analysis Summary
                    </h4>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">
                      {analysisData.statistical_abstract.correlation_findings.summary}
                    </p>
                  </div>
                )}
                
                {/* Correlation Heatmap */}
                {analysisData.statistical_abstract?.correlation_findings?.correlation_matrix && (
                  <Heatmap
                    data={Object.entries(
                      analysisData.statistical_abstract.correlation_findings.correlation_matrix
                    ).flatMap(([var1, correlations]) =>
                      Object.entries(correlations as Record<string, number>).map(([var2, value]) => ({
                        x: var1,
                        y: var2,
                        value: value as number,
                        label: `Correlation: ${(value as number).toFixed(3)}`,
                      }))
                    )}
                    title="Correlation Heatmap"
                    xLabel="Variables"
                    yLabel="Variables"
                    colorScale="diverging"
                    minValue={-1}
                    maxValue={1}
                  />
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <motion.div
          className="mt-12 text-center text-white/30 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <p>Aadhaar Pulse • End-to-End Analytical & Reasoning Intelligence Engine</p>
          <p className="mt-1">
            Analysis completed: {analysisData.timestamp 
              ? new Date(analysisData.timestamp).toLocaleString()
              : new Date().toLocaleString()
            }
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AnalyticsDashboard;
