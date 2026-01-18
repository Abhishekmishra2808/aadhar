/**
 * Analytics API Service
 * 
 * Connects the React frontend to the Python Analytics Backend
 * for Aadhaar Pulse intelligence engine.
 */

const ANALYTICS_API_URL = import.meta.env.VITE_ANALYTICS_URL || 'http://localhost:8000';

export interface DataQualityReport {
  total_rows: number;
  total_columns: number;
  missing_values: Record<string, number>;
  duplicate_rows: number;
  data_types: Record<string, string>;
  numeric_columns: string[];
  categorical_columns: string[];
  date_columns: string[];
  quality_score: number;
  issues: string[];
}

export interface FileUploadResponse {
  success: boolean;
  filename: string;
  file_size: number;
  records_count: number;
  columns: string[];
  preview: Record<string, unknown>[];
  data_quality: DataQualityReport;
  job_id: string;
}

export interface AnalysisStatusResponse {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  current_stage: string;
  estimated_time_remaining?: number;
  errors: string[];
}

export interface CorrelationResult {
  variable_1: string;
  variable_2: string;
  correlation_coefficient: number;
  p_value: number;
  is_significant: boolean;
  relationship_type: string;
  interpretation: string;
}

export interface RegionalVolatility {
  region: string;
  coefficient_of_variation: number;
  mean: number;
  std_deviation: number;
  volatility_level: 'stable' | 'moderate' | 'high' | 'erratic';
  temporal_pattern?: string;
  seasonal_factors: string[];
}

// Alias for backward compatibility
export type VolatilityResult = RegionalVolatility;

export interface SeasonalPattern {
  pattern_type: string;
  period: string;
  strength: number;
  description: string;
}

export interface DimensionalSlice {
  dimension: string;
  value: number;
  expected_range: [number, number];
  z_score: number;
  is_outlier: boolean;
  region?: string;
  time_period?: string;
}

export interface OutlierCluster {
  dimensions: Record<string, string>;
  metric_value: number;
  national_mean: number;
  z_score: number;
  deviation_percentage: number;
  sample_size: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
}

export interface Anomaly {
  id: string;
  metric_name: string;
  observed_value: number;
  expected_value: number;
  z_score: number;
  deviation_percentage: number;
  location?: Record<string, string>;
  time_period?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export interface StrategicRecommendation {
  priority: number;
  recommendation: string;
  rationale: string;
  expected_impact: string;
  implementation_complexity: string;
  affected_regions: string[];
  timeline: string;
}

export interface ContextualFactor {
  factor_type: string;
  description: string;
  relevance_score: number;
  source?: string;
  date?: string;
}

export interface IntelligenceReport {
  executive_summary: string;
  root_cause_analysis: string[];
  contextual_factors: ContextualFactor[];
  strategic_recommendations: StrategicRecommendation[];
  risk_assessment: string;
  confidence_score: number;
  sources_consulted: string[];
}

export interface VisualizationSpec {
  type: 'line_chart' | 'bar_chart' | 'heatmap' | 'scatter_plot' | 'map' | 'bubble_chart' | 'pie_chart';
  title: string;
  description: string;
  data: Record<string, unknown>;
  config: Record<string, unknown>;
}

export interface AnalysisPackage {
  job_id: string;
  status: string;
  timestamp: string;
  data_summary: Record<string, unknown>;
  statistical_abstract: {
    correlation_findings: {
      correlation_matrix: Record<string, Record<string, number>>;
      strong_correlations: CorrelationResult[];
      driver_variables: Record<string, unknown>[];
      summary: string;
    };
    volatility_findings: {
      regional_scores: RegionalVolatility[];
      high_volatility_regions: string[];
      stable_regions: string[];
      seasonality_detected: boolean;
      summary: string;
    };
    dimensional_findings: {
      outlier_clusters: OutlierCluster[];
      top_anomalies: OutlierCluster[];
      dimension_importance: Record<string, number>;
      summary: string;
    };
    anomaly_findings: {
      total_anomalies: number;
      anomalies: Anomaly[];
      anomaly_by_region: Record<string, number>;
      severity_distribution: Record<string, number>;
      summary: string;
    };
  };
  intelligence_report: IntelligenceReport;
  visualizations: VisualizationSpec[];
  processing_time_seconds: number;
  data_quality_score: number;
}

class AnalyticsApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = ANALYTICS_API_URL;
  }

  /**
   * Check API health status
   */
  async healthCheck(): Promise<{ status: string; timestamp: string; version: string }> {
    const response = await fetch(`${this.baseUrl}/api/health`);
    if (!response.ok) {
      throw new Error('Analytics API is not available');
    }
    return response.json();
  }

  /**
   * Upload a file for analysis
   */
  async uploadFile(file: File): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Upload failed');
    }

    return response.json();
  }

  /**
   * Trigger analysis on uploaded data
   */
  async triggerAnalysis(
    jobId: string,
    options?: {
      targetColumn?: string;
      regionColumn?: string;
      timeColumn?: string;
      dimensionColumns?: string[];
      runLlm?: boolean;
    }
  ): Promise<{ success: boolean; job_id: string; message: string; results?: AnalysisPackage }> {
    const params = new URLSearchParams();
    
    if (options?.targetColumn) params.append('target_column', options.targetColumn);
    if (options?.regionColumn) params.append('region_column', options.regionColumn);
    if (options?.timeColumn) params.append('time_column', options.timeColumn);
    if (options?.dimensionColumns) params.append('dimension_columns', options.dimensionColumns.join(','));
    if (options?.runLlm !== undefined) params.append('run_llm', String(options.runLlm));

    const response = await fetch(`${this.baseUrl}/api/analyze/${jobId}?${params}`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Analysis trigger failed');
    }

    return response.json();
  }

  /**
   * Get analysis status
   */
  async getStatus(jobId: string): Promise<AnalysisStatusResponse> {
    const response = await fetch(`${this.baseUrl}/api/status/${jobId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Status check failed');
    }

    return response.json();
  }

  /**
   * Get full analysis results
   */
  async getResults(jobId: string): Promise<AnalysisPackage> {
    const response = await fetch(`${this.baseUrl}/api/results/${jobId}`);
    
    if (!response.ok) {
      if (response.status === 202) {
        throw new Error('Analysis still in progress');
      }
      const error = await response.json();
      throw new Error(error.detail || 'Results fetch failed');
    }

    return response.json();
  }

  /**
   * Get only insights and recommendations
   */
  async getInsights(jobId: string): Promise<{
    job_id: string;
    executive_summary: string;
    root_causes: string[];
    recommendations: { priority: number; recommendation: string; expected_impact: string }[];
    risk_assessment: string;
    confidence: number;
  }> {
    const response = await fetch(`${this.baseUrl}/api/insights/${jobId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Insights fetch failed');
    }

    return response.json();
  }

  /**
   * Get anomalies with optional filtering
   */
  async getAnomalies(
    jobId: string,
    options?: { severity?: string; region?: string; limit?: number }
  ): Promise<{ job_id: string; total_anomalies: number; anomalies: Anomaly[] }> {
    const params = new URLSearchParams();
    if (options?.severity) params.append('severity', options.severity);
    if (options?.region) params.append('region', options.region);
    if (options?.limit) params.append('limit', String(options.limit));

    const response = await fetch(`${this.baseUrl}/api/anomalies/${jobId}?${params}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Anomalies fetch failed');
    }

    return response.json();
  }

  /**
   * Get correlation analysis results
   */
  async getCorrelations(
    jobId: string,
    options?: { minCorrelation?: number; limit?: number }
  ): Promise<{
    job_id: string;
    correlations: CorrelationResult[];
    driver_variables: Record<string, unknown>[];
  }> {
    const params = new URLSearchParams();
    if (options?.minCorrelation) params.append('min_correlation', String(options.minCorrelation));
    if (options?.limit) params.append('limit', String(options.limit));

    const response = await fetch(`${this.baseUrl}/api/correlations/${jobId}?${params}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Correlations fetch failed');
    }

    return response.json();
  }

  /**
   * Get volatility analysis results
   */
  async getVolatility(jobId: string): Promise<{
    job_id: string;
    high_volatility_regions: string[];
    stable_regions: string[];
    seasonality_detected: boolean;
    regional_scores: RegionalVolatility[];
  }> {
    const response = await fetch(`${this.baseUrl}/api/volatility/${jobId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Volatility fetch failed');
    }

    return response.json();
  }

  /**
   * Get visualization specifications
   */
  async getVisualizations(jobId: string): Promise<{
    job_id: string;
    visualizations: VisualizationSpec[];
  }> {
    const response = await fetch(`${this.baseUrl}/api/visualizations/${jobId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Visualizations fetch failed');
    }

    return response.json();
  }

  /**
   * Delete a job
   */
  async deleteJob(jobId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseUrl}/api/jobs/${jobId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Delete failed');
    }

    return response.json();
  }

  /**
   * List all jobs
   */
  async listJobs(): Promise<{
    jobs: { job_id: string; status: string; filename?: string; created_at?: string }[];
  }> {
    const response = await fetch(`${this.baseUrl}/api/jobs`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Jobs list failed');
    }

    return response.json();
  }

  /**
   * Export analysis report
   */
  async exportReport(jobId: string, format: 'pdf' | 'json' | 'csv' = 'json'): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/api/export/${jobId}?format=${format}`);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Export failed' }));
      throw new Error(error.detail || 'Export failed');
    }

    return response.blob();
  }

  /**
   * Poll for analysis completion
   */
  async waitForCompletion(
    jobId: string,
    onProgress?: (status: AnalysisStatusResponse) => void,
    pollInterval = 2000,
    maxWaitTime = 300000
  ): Promise<AnalysisPackage> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const status = await this.getStatus(jobId);
      
      if (onProgress) {
        onProgress(status);
      }

      if (status.status === 'completed') {
        return this.getResults(jobId);
      }

      if (status.status === 'failed') {
        throw new Error(status.errors.join(', ') || 'Analysis failed');
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error('Analysis timed out');
  }
}

// Export singleton instance
export const analyticsApi = new AnalyticsApiService();
export default analyticsApi;
