"""
LLM Reasoning Layer - Semantic Bridge for Math-to-Narrative Translation

This module implements the intelligence layer that:
- Translates statistical abstracts into plain-English insights
- Cross-references data trends with external contexts (news, policy, weather)
- Generates strategic recommendations for decision-makers
- Applies differential privacy to LLM outputs

The Semantic Bridge converts outputs like "CV = 1.2" into actionable insights
like "Bihar shows erratic enrollment patterns likely due to monsoon disruptions."
"""

import asyncio
import json
import re
from typing import Any, Dict, List, Optional
from datetime import datetime
import httpx
from loguru import logger

from app.models import (
    StatisticalAbstract,
    LLMReasoningOutput,
    ContextualFactor,
    StrategicRecommendation,
    CorrelationEngineOutput,
    VolatilityScoringOutput,
    DimensionalSlicingOutput,
    AnomalyDetectionOutput
)
from app.config import settings


class LLMReasoningLayer:
    """
    Semantic Bridge - LLM-Powered Reasoning Engine.
    
    Transforms statistical findings into actionable intelligence
    by connecting data patterns to real-world contexts.
    """
    
    def __init__(
        self,
        provider: str = None,
        api_key: str = None,
        model: str = None,
        enable_web_search: bool = True
    ):
        self.provider = provider or settings.llm_provider
        
        # Set API key based on provider
        if self.provider == "huggingface":
            self.api_key = api_key or settings.huggingface_api_key
            self.model = model or settings.huggingface_model
        elif self.provider == "openai":
            self.api_key = api_key or settings.openai_api_key
            self.model = model or settings.openai_model
        else:
            self.api_key = api_key or settings.anthropic_api_key
            self.model = model or settings.anthropic_model
            
        self.enable_web_search = enable_web_search
        self.epsilon = settings.differential_privacy_epsilon
        
        # HTTP client for API calls
        self._client: Optional[httpx.AsyncClient] = None
    
    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create async HTTP client."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=60.0)
        return self._client
    
    async def close(self):
        """Close HTTP client."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
    
    async def analyze(
        self,
        statistical_abstract: StatisticalAbstract,
        additional_context: Optional[Dict[str, Any]] = None
    ) -> LLMReasoningOutput:
        """
        Generate intelligence report from statistical findings.
        
        Args:
            statistical_abstract: Output from all analytical engines
            additional_context: Optional additional context information
            
        Returns:
            LLMReasoningOutput with insights and recommendations
        """
        logger.info("Starting LLM reasoning analysis")
        
        # Prepare the statistical summary for LLM
        summary_text = self._prepare_statistical_summary(statistical_abstract)
        
        # Build the analysis prompt
        prompt = self._build_analysis_prompt(summary_text, additional_context)
        
        # Get LLM response
        try:
            if self.api_key:
                llm_response = await self._call_llm(prompt)
            else:
                # Fallback to rule-based analysis if no API key
                logger.warning("No LLM API key configured, using rule-based analysis")
                llm_response = self._rule_based_analysis(statistical_abstract)
            
            # Parse LLM response
            parsed_output = self._parse_llm_response(llm_response, statistical_abstract)
            
            # Apply differential privacy if needed
            if self.epsilon < float('inf'):
                parsed_output = self._apply_differential_privacy(parsed_output)
            
            return parsed_output
            
        except Exception as e:
            logger.error(f"LLM analysis failed: {e}")
            return self._fallback_output(statistical_abstract, str(e))
    
    def _prepare_statistical_summary(
        self,
        abstract: StatisticalAbstract
    ) -> str:
        """
        Prepare a structured text summary of statistical findings for LLM.
        """
        sections = []
        
        # Correlation findings
        corr = abstract.correlation_findings
        if corr.strong_correlations:
            sections.append("## Correlation Analysis Findings")
            sections.append(f"Found {len(corr.strong_correlations)} strong correlations.")
            sections.append("Top correlations:")
            for c in corr.strong_correlations[:5]:
                sections.append(
                    f"- {c.variable_1} ↔ {c.variable_2}: r={c.correlation_coefficient:.3f} "
                    f"(p={c.p_value:.4f}, {c.relationship_type})"
                )
            if corr.driver_variables:
                sections.append("Key driver variables:")
                for d in corr.driver_variables[:3]:
                    sections.append(f"- {d['variable']}: driver score={d['driver_score']:.3f}")
        
        # Volatility findings
        vol = abstract.volatility_findings
        if vol.regional_scores:
            sections.append("\n## Volatility Analysis Findings")
            if vol.high_volatility_regions:
                sections.append(f"High volatility regions: {', '.join(vol.high_volatility_regions[:5])}")
            if vol.stable_regions:
                sections.append(f"Stable regions: {', '.join(vol.stable_regions[:5])}")
            if vol.seasonality_detected:
                sections.append("Seasonality detected in the data.")
            sections.append("Top volatile regions:")
            for r in vol.regional_scores[:5]:
                sections.append(
                    f"- {r.region}: CV={r.coefficient_of_variation:.3f} ({r.volatility_level.value})"
                )
                if r.temporal_pattern:
                    sections.append(f"  Pattern: {r.temporal_pattern}")
        
        # Dimensional slicing findings
        dim = abstract.dimensional_findings
        if dim.outlier_clusters:
            sections.append("\n## Dimensional Analysis Findings")
            sections.append(f"Found {len(dim.outlier_clusters)} outlier clusters.")
            sections.append("Top anomalous combinations:")
            for o in dim.top_anomalies[:5]:
                dims = " × ".join([f"{k}={v}" for k, v in o.dimensions.items()])
                sections.append(
                    f"- {dims}: value={o.metric_value:.2f}, "
                    f"z-score={o.z_score:.2f}, {o.risk_level.value} risk"
                )
        
        # Anomaly detection findings
        anom = abstract.anomaly_findings
        if anom.anomalies:
            sections.append("\n## Anomaly Detection Findings")
            sections.append(f"Total anomalies: {anom.total_anomalies}")
            sections.append(f"Severity: Critical={anom.severity_distribution.get('critical', 0)}, "
                          f"High={anom.severity_distribution.get('high', 0)}")
            sections.append("Top anomalies:")
            for a in anom.anomalies[:5]:
                sections.append(f"- {a.description}")
        
        return "\n".join(sections)
    
    def _build_analysis_prompt(
        self,
        statistical_summary: str,
        additional_context: Optional[Dict[str, Any]]
    ) -> str:
        """
        Build the prompt for LLM analysis.
        """
        context_info = ""
        if additional_context:
            context_info = f"\n\nAdditional Context:\n{json.dumps(additional_context, indent=2)}"
        
        prompt = f"""You are a senior data scientist and domain expert at UIDAI (Unique Identification Authority of India), 
specializing in analyzing Aadhaar enrollment, update, and authentication data across India's 28 states and 8 union territories.

## Your Expertise:
- Deep understanding of Aadhaar ecosystem: enrollments, updates, authentication, e-KYC
- Knowledge of regional variations across Indian states (population density, literacy rates, digital infrastructure)
- Awareness of seasonal patterns: monsoons (June-Sept), festival seasons, school admission periods (April-June)
- Understanding of demographic segments: children (0-5, 5-17), adults (18+), senior citizens
- Familiarity with enrollment infrastructure: permanent centers, mobile vans, CSCs (Common Service Centers)

## Statistical Analysis Results:
{statistical_summary}
{context_info}

## Understanding Volatility Metrics:
**Coefficient of Variation (CV) = Standard Deviation / Mean**
- CV < 0.15 (15%) = **STABLE** - Normal, consistent performance
- CV 0.15-0.5 (15%-50%) = **MODERATE** - Some variability, acceptable
- CV 0.5-1.0 (50%-100%) = **HIGH** - Significant fluctuation, needs attention
- CV > 1.0 (100%+) = **ERRATIC** - Extreme volatility, critical issue

IMPORTANT: Do NOT describe regions with CV < 0.15 as "volatile" or "significant volatility". 
These are STABLE regions with normal variation. Only regions with CV > 0.5 require attention.

## Analysis Guidelines:
When analyzing, consider these India-specific factors:
- **Regional Variations**: States like Bihar, UP, Jharkhand may show different patterns than Kerala, Tamil Nadu
- **Urban vs Rural**: Metro cities vs tier-2/3 cities vs villages have vastly different infrastructure
- **Seasonal Impact**: Monsoons disrupt operations in flood-prone areas; festivals affect footfall
- **Infrastructure Gaps**: Power outages, internet connectivity issues in remote areas
- **Demographic Trends**: Child enrollments peak during school admissions; senior citizen updates during pension verification

## Your Task:
Provide a comprehensive analysis in the following structure:

1. **Executive Summary** (2-3 impactful sentences): 
   - Lead with the most critical finding
   - Quantify the impact where possible
   - Highlight any urgent action needed

2. **Root Cause Analysis** (3-5 causes):
   For each pattern/anomaly, identify likely root causes considering:
   - Demographic factors (age distribution, urban/rural split)
   - Infrastructure issues (equipment failure, connectivity, power)
   - Seasonal factors (monsoon disruption, festival closures, exam seasons)
   - Policy/administrative changes (new guidelines, staff training needs)
   - Regional socioeconomic conditions (migration, literacy, awareness)

3. **Contextual Factors** (2-4 factors):
   External factors influencing the data:
   - Government schemes (DBT linkages, PMJAY, ration card linking)
   - Weather events (floods, cyclones, extreme heat)
   - Infrastructure changes (new centers, equipment upgrades)
   - Demographic shifts (migration patterns, population growth)

4. **Strategic Recommendations** (3-5 actionable items):
   Each recommendation must include:
   - Priority: 1 (critical/immediate) to 5 (nice-to-have)
   - Specific action with clear ownership
   - Data-driven rationale
   - Measurable expected impact
   - Implementation complexity: low/medium/high
   - Affected regions (specific states/districts if applicable)
   - Realistic timeline

5. **Risk Assessment**:
   What happens if these issues are not addressed? Consider:
   - Service delivery impact
   - Citizen inconvenience
   - Compliance/audit risks
   - Reputation risks

6. **Confidence Score** (0.0-1.0):
   Based on data quality and pattern clarity

## Response Format (strict JSON):
{{
    "executive_summary": "Clear, impactful summary with key metrics...",
    "root_causes": [
        "Specific cause 1 with context...",
        "Specific cause 2 with context..."
    ],
    "contextual_factors": [
        {{"factor_type": "policy|weather|infrastructure|demographic", "description": "Detailed description...", "relevance_score": 0.0-1.0}}
    ],
    "recommendations": [
        {{
            "priority": 1,
            "recommendation": "Specific action...",
            "rationale": "Data-driven reasoning...",
            "expected_impact": "Quantified improvement...",
            "implementation_complexity": "low|medium|high",
            "affected_regions": ["State1", "State2"],
            "timeline": "Realistic timeframe..."
        }}
    ],
    "risk_assessment": "Comprehensive risk analysis...",
    "confidence_score": 0.85
}}

IMPORTANT: Respond ONLY with valid JSON. No markdown, no explanations outside JSON."""
        
        return prompt
    
    async def _call_llm(self, prompt: str) -> str:
        """
        Call the LLM API (OpenAI, Anthropic, or Hugging Face).
        """
        client = await self._get_client()
        
        if self.provider == "openai":
            return await self._call_openai(client, prompt)
        elif self.provider == "anthropic":
            return await self._call_anthropic(client, prompt)
        elif self.provider == "huggingface":
            return await self._call_huggingface(client, prompt)
        else:
            raise ValueError(f"Unknown LLM provider: {self.provider}")
    
    async def _call_huggingface(self, client: httpx.AsyncClient, prompt: str) -> str:
        """Call Hugging Face Inference API (using new router.huggingface.co endpoint)."""
        logger.info(f"Calling Hugging Face model: {self.model}")
        
        # Format prompt for chat completion
        messages = [
            {"role": "system", "content": "You are an expert UIDAI data analyst. Analyze the data patterns and provide insights in valid JSON format."},
            {"role": "user", "content": prompt}
        ]
        
        # Try the new HuggingFace router API first (v1/chat/completions)
        try:
            response = await client.post(
                "https://router.huggingface.co/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": self.model,
                    "messages": messages,
                    "max_tokens": 4000,
                    "temperature": 0.7,
                    "stream": False
                },
                timeout=120.0
            )
            
            if response.status_code == 200:
                result = response.json()
                if "choices" in result:
                    return result["choices"][0]["message"]["content"]
            else:
                logger.warning(f"Router API returned {response.status_code}, trying inference endpoint")
        except Exception as e:
            logger.warning(f"Chat completion failed, trying inference endpoint: {e}")
        
        # Fallback to router inference API
        api_url = f"https://router.huggingface.co/hf-inference/models/{self.model}"
        
        full_prompt = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>
You are an expert UIDAI data analyst. Analyze the data patterns and provide insights in valid JSON format.<|eot_id|><|start_header_id|>user<|end_header_id|>
{prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>
"""
        
        response = await client.post(
            api_url,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            },
            json={
                "inputs": full_prompt,
                "parameters": {
                    "max_new_tokens": 4000,
                    "temperature": 0.7,
                    "return_full_text": False
                }
            },
            timeout=120.0
        )
        
        if response.status_code != 200:
            logger.error(f"Hugging Face API error: {response.status_code} - {response.text}")
            raise Exception(f"Hugging Face API error: {response.status_code}")
        
        result = response.json()
        
        # Handle different response formats
        if isinstance(result, list) and len(result) > 0:
            return result[0].get("generated_text", "")
        elif isinstance(result, dict):
            return result.get("generated_text", str(result))
        
        return str(result)
    
    async def _call_openai(self, client: httpx.AsyncClient, prompt: str) -> str:
        """Call OpenAI API."""
        response = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": self.model,
                "messages": [
                    {"role": "system", "content": "You are an expert UIDAI data analyst. Always respond with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.7,
                "max_tokens": 4000,
                "response_format": {"type": "json_object"}
            }
        )
        
        if response.status_code != 200:
            raise Exception(f"OpenAI API error: {response.status_code} - {response.text}")
        
        result = response.json()
        return result["choices"][0]["message"]["content"]
    
    async def _call_anthropic(self, client: httpx.AsyncClient, prompt: str) -> str:
        """Call Anthropic API."""
        response = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": self.api_key,
                "Content-Type": "application/json",
                "anthropic-version": "2023-06-01"
            },
            json={
                "model": self.model,
                "max_tokens": 4000,
                "messages": [
                    {"role": "user", "content": prompt}
                ]
            }
        )
        
        if response.status_code != 200:
            raise Exception(f"Anthropic API error: {response.status_code} - {response.text}")
        
        result = response.json()
        return result["content"][0]["text"]
    
    def _parse_llm_response(
        self,
        response: str,
        abstract: StatisticalAbstract
    ) -> LLMReasoningOutput:
        """
        Parse LLM response into structured output.
        """
        try:
            # Extract JSON from response
            json_match = re.search(r'\{[\s\S]*\}', response)
            if json_match:
                data = json.loads(json_match.group())
            else:
                raise ValueError("No JSON found in response")
            
            # Parse contextual factors
            contextual_factors = []
            for cf in data.get("contextual_factors", []):
                contextual_factors.append(ContextualFactor(
                    factor_type=cf.get("factor_type", "other"),
                    description=cf.get("description", ""),
                    relevance_score=cf.get("relevance_score", 0.5),
                    source=cf.get("source"),
                    date=cf.get("date")
                ))
            
            # Parse recommendations
            recommendations = []
            for rec in data.get("recommendations", []):
                recommendations.append(StrategicRecommendation(
                    priority=rec.get("priority", 3),
                    recommendation=rec.get("recommendation", ""),
                    rationale=rec.get("rationale", ""),
                    expected_impact=rec.get("expected_impact", ""),
                    implementation_complexity=rec.get("implementation_complexity", "medium"),
                    affected_regions=rec.get("affected_regions", []),
                    timeline=rec.get("timeline", "")
                ))
            
            # Sort recommendations by priority
            recommendations.sort(key=lambda x: x.priority)
            
            # Helper function to extract string from various formats
            def extract_text(item) -> str:
                if isinstance(item, str):
                    return item
                elif isinstance(item, dict):
                    # Handle dict format like {"cause": "..."} or {"description": "..."}
                    return item.get("cause") or item.get("description") or item.get("reason") or item.get("text") or str(item)
                elif isinstance(item, list):
                    # If it's a list, join all items
                    return " ".join([extract_text(i) for i in item])
                else:
                    return str(item)
            
            # Parse root causes - handle strings, dicts, and nested lists
            root_causes_raw = data.get("root_causes", [])
            root_causes = []
            for rc in root_causes_raw:
                extracted = extract_text(rc)
                if extracted:
                    root_causes.append(extracted)
            
            return LLMReasoningOutput(
                executive_summary=data.get("executive_summary", "Analysis complete."),
                root_cause_analysis=root_causes,
                contextual_factors=contextual_factors,
                strategic_recommendations=recommendations,
                risk_assessment=data.get("risk_assessment", ""),
                confidence_score=data.get("confidence_score", 0.7),
                sources_consulted=data.get("sources", ["Statistical analysis"])
            )
            
        except Exception as e:
            logger.warning(f"Failed to parse LLM response: {e}")
            return self._fallback_output(abstract, f"Parse error: {e}")
    
    def _rule_based_analysis(
        self,
        abstract: StatisticalAbstract
    ) -> str:
        """
        Generate rule-based analysis when LLM is unavailable.
        """
        findings = []
        root_causes = []
        recommendations = []
        
        # Analyze correlations
        if abstract.correlation_findings.strong_correlations:
            top_corr = abstract.correlation_findings.strong_correlations[0]
            findings.append(
                f"Strong {top_corr.relationship_type} correlation between "
                f"{top_corr.variable_1} and {top_corr.variable_2}"
            )
            
            if "age" in top_corr.variable_1.lower() or "age" in top_corr.variable_2.lower():
                root_causes.append("Age-related biometric capture difficulties")
                recommendations.append({
                    "priority": 1,
                    "recommendation": "Deploy age-appropriate verification methods",
                    "rationale": "Strong correlation with age suggests biometric quality issues",
                    "expected_impact": "Reduce rejection rates by 20-30%",
                    "implementation_complexity": "medium",
                    "affected_regions": [],
                    "timeline": "3-6 months"
                })
        
        # Analyze volatility - only flag truly high volatility regions (CV > 0.5)
        if abstract.volatility_findings.high_volatility_regions:
            regions = abstract.volatility_findings.high_volatility_regions[:3]
            # Get actual volatility scores
            high_cv_regions = [
                r for r in abstract.volatility_findings.regional_scores 
                if r.region in regions and r.coefficient_of_variation > 0.5
            ]
            
            if high_cv_regions:
                findings.append(f"Significant volatility detected in: {', '.join([r.region for r in high_cv_regions])}")
                root_causes.append("Inconsistent service delivery or external disruptions in volatile regions")
                recommendations.append({
                    "priority": 2,
                    "recommendation": f"Investigate operational issues in {', '.join([r.region for r in high_cv_regions])}",
                    "rationale": f"Volatility levels (CV > 0.5) indicate erratic performance patterns",
                    "expected_impact": "Stabilize service delivery and reduce fluctuations by 30-40%",
                    "implementation_complexity": "medium",
                    "affected_regions": [r.region for r in high_cv_regions],
                    "timeline": "1-3 months"
                })
        
        # Note stable regions positively
        if abstract.volatility_findings.stable_regions:
            stable_count = len(abstract.volatility_findings.stable_regions)
            findings.append(f"{stable_count} regions showing stable, consistent performance (CV < 0.15)")
        
        # Analyze anomalies
        critical_anomalies = [
            a for a in abstract.anomaly_findings.anomalies 
            if a.severity.value in ["critical", "high"]
        ]
        if critical_anomalies:
            findings.append(f"{len(critical_anomalies)} critical/high severity anomalies detected")
            root_causes.append("Potential data quality or operational issues")
            recommendations.append({
                "priority": 1,
                "recommendation": "Immediate investigation of critical anomalies",
                "rationale": "Critical anomalies require urgent attention",
                "expected_impact": "Prevent service disruption",
                "implementation_complexity": "low",
                "affected_regions": [],
                "timeline": "Immediate"
            })
        
        return json.dumps({
            "executive_summary": " ".join(findings) if findings else "Analysis complete with no major concerns.",
            "root_causes": root_causes,
            "contextual_factors": [
                {"factor_type": "infrastructure", "description": "Regional infrastructure variations", "relevance_score": 0.7}
            ],
            "recommendations": recommendations,
            "risk_assessment": "Medium risk if identified issues are not addressed within recommended timeline.",
            "confidence_score": 0.6
        })
    
    def _apply_differential_privacy(
        self,
        output: LLMReasoningOutput
    ) -> LLMReasoningOutput:
        """
        Apply differential privacy noise to prevent reverse-engineering.
        
        Noisy Output = True Output + Laplace(0, b/ε)
        """
        import numpy as np
        
        # Add noise to numerical values
        noise_scale = 1.0 / self.epsilon
        
        # Perturb confidence score slightly
        noisy_confidence = output.confidence_score + np.random.laplace(0, noise_scale * 0.1)
        noisy_confidence = max(0.0, min(1.0, noisy_confidence))
        
        # Perturb relevance scores
        for factor in output.contextual_factors:
            noisy_relevance = factor.relevance_score + np.random.laplace(0, noise_scale * 0.1)
            factor.relevance_score = max(0.0, min(1.0, noisy_relevance))
        
        output.confidence_score = round(noisy_confidence, 2)
        
        return output
    
    def _fallback_output(
        self,
        abstract: StatisticalAbstract,
        error_msg: str
    ) -> LLMReasoningOutput:
        """
        Generate fallback output when LLM fails - enhanced with statistical insights.
        """
        # Generate comprehensive summary from statistics
        summary_parts = []
        root_causes = []
        recommendations = []
        
        if abstract.anomaly_findings.total_anomalies > 0:
            summary_parts.append(
                f"Detected {abstract.anomaly_findings.total_anomalies} anomalies across the dataset"
            )
            
            # Analyze anomaly severity distribution
            severity_dist = abstract.anomaly_findings.severity_distribution
            critical_count = severity_dist.get('critical', 0)
            high_count = severity_dist.get('high', 0)
            
            if critical_count > 0:
                root_causes.append(f"Critical data quality issues: {critical_count} critical anomalies detected requiring immediate attention")
                recommendations.append(
                    StrategicRecommendation(
                        priority=1,
                        recommendation=f"Investigate and resolve {critical_count} critical anomalies immediately",
                        rationale="Critical anomalies indicate severe data quality issues or operational problems",
                        expected_impact="Prevent data corruption and ensure data integrity",
                        implementation_complexity="high",
                        affected_regions=abstract.volatility_findings.high_volatility_regions[:5] if abstract.volatility_findings.high_volatility_regions else [],
                        timeline="24-48 hours"
                    )
                )
            
            if high_count > 10:
                root_causes.append(f"Systematic data inconsistencies: {high_count} high-severity anomalies suggest pattern-based issues")
        
        if abstract.volatility_findings.high_volatility_regions:
            region_count = len(abstract.volatility_findings.high_volatility_regions)
            summary_parts.append(
                f"High volatility detected in {region_count} regions, indicating unstable patterns"
            )
            root_causes.append(f"Regional instability: {region_count} regions show erratic behavior requiring investigation")
            
            recommendations.append(
                StrategicRecommendation(
                    priority=2,
                    recommendation=f"Stabilize operations in {', '.join(abstract.volatility_findings.high_volatility_regions[:3])}",
                    rationale="High volatility regions show unpredictable patterns that may indicate operational issues",
                    expected_impact="Improved consistency and predictability in enrollment patterns",
                    implementation_complexity="medium",
                    affected_regions=abstract.volatility_findings.high_volatility_regions[:5],
                    timeline="1-2 weeks"
                )
            )
        
        if abstract.correlation_findings.strong_correlations:
            corr_count = len(abstract.correlation_findings.strong_correlations)
            summary_parts.append(
                f"Identified {corr_count} significant correlations between variables"
            )
            
            # Extract key correlations
            top_correlations = abstract.correlation_findings.strong_correlations[:3]
            if top_correlations:
                corr_desc = []
                for corr in top_correlations:
                    corr_desc.append(f"{corr.variable1} ↔ {corr.variable2} (strength: {abs(corr.correlation_value):.2f})")
                root_causes.append(f"Key relationships found: {'; '.join(corr_desc)}")
                
                recommendations.append(
                    StrategicRecommendation(
                        priority=3,
                        recommendation="Leverage identified correlations to optimize resource allocation",
                        rationale=f"Strong correlations suggest predictable patterns that can guide planning",
                        expected_impact="More efficient resource distribution based on data-driven insights",
                        implementation_complexity="low",
                        affected_regions=[],
                        timeline="2-4 weeks"
                    )
                )
        
        if abstract.dimensional_findings.outlier_clusters:
            cluster_count = len(abstract.dimensional_findings.outlier_clusters)
            summary_parts.append(
                f"Found {cluster_count} dimensional outlier clusters requiring attention"
            )
            
            # Analyze high-risk clusters
            high_risk_clusters = [c for c in abstract.dimensional_findings.outlier_clusters if c.risk_level in ['critical', 'high']]
            if high_risk_clusters:
                root_causes.append(f"Multi-dimensional anomalies: {len(high_risk_clusters)} clusters show compound risk factors")
        
        # If no specific issues found
        if not root_causes:
            root_causes.append("Data patterns are generally stable with no critical issues identified")
            root_causes.append(f"Note: Advanced LLM analysis unavailable - {error_msg}")
        
        # Default recommendation if none added
        if not recommendations:
            recommendations.append(
                StrategicRecommendation(
                    priority=1,
                    recommendation="Continue monitoring data quality and patterns",
                    rationale="No critical issues detected, maintain current operational standards",
                    expected_impact="Sustained data quality and operational efficiency",
                    implementation_complexity="low",
                    affected_regions=[],
                    timeline="Ongoing"
                )
            )
        
        summary = ". ".join(summary_parts) if summary_parts else "Analysis completed - data shows normal patterns."
        
        # Generate risk assessment
        total_critical = abstract.anomaly_findings.severity_distribution.get('critical', 0)
        total_high = abstract.anomaly_findings.severity_distribution.get('high', 0)
        
        if total_critical > 0:
            risk_level = "HIGH RISK"
            risk_desc = f"Immediate action required: {total_critical} critical issues detected"
        elif total_high > 20:
            risk_level = "MODERATE-HIGH RISK"
            risk_desc = f"Elevated risk level with {total_high} high-severity issues"
        elif abstract.volatility_findings.high_volatility_regions:
            risk_level = "MODERATE RISK"
            risk_desc = f"Some instability detected in {len(abstract.volatility_findings.high_volatility_regions)} regions"
        else:
            risk_level = "LOW RISK"
            risk_desc = "Data patterns are generally stable and predictable"
        
        return LLMReasoningOutput(
            executive_summary=summary,
            root_cause_analysis=root_causes,
            contextual_factors=[],
            strategic_recommendations=recommendations,
            risk_assessment=f"{risk_level}: {risk_desc}",
            confidence_score=0.6 if root_causes else 0.3,
            sources_consulted=["Statistical analysis", "Automated pattern detection"]
        )
