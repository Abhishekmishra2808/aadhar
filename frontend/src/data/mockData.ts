export interface EnrollmentData {
  month: string;
  enrollments: number;
  rejections: number;
  updates: number;
}

export interface AnomalyData {
  state: string;
  district: string;
  ageGroup: string;
  rejectionReason: string;
  count: number;
  severity: 'low' | 'medium' | 'high';
  lat: number;
  lng: number;
}

export interface StateHotspot {
  state: string;
  anomalyCount: number;
  primaryIssue: string;
  x: number;
  y: number;
  size: number;
}

export const enrollmentTrends: EnrollmentData[] = [
  { month: 'Jan', enrollments: 125000, rejections: 3200, updates: 45000 },
  { month: 'Feb', enrollments: 132000, rejections: 2800, updates: 48000 },
  { month: 'Mar', enrollments: 145000, rejections: 4100, updates: 52000 },
  { month: 'Apr', enrollments: 138000, rejections: 5200, updates: 49000 },
  { month: 'May', enrollments: 152000, rejections: 3800, updates: 55000 },
  { month: 'Jun', enrollments: 168000, rejections: 4500, updates: 61000 },
  { month: 'Jul', enrollments: 175000, rejections: 6200, updates: 58000 },
  { month: 'Aug', enrollments: 162000, rejections: 7100, updates: 54000 },
  { month: 'Sep', enrollments: 158000, rejections: 5400, updates: 57000 },
  { month: 'Oct', enrollments: 172000, rejections: 4800, updates: 62000 },
  { month: 'Nov', enrollments: 185000, rejections: 3900, updates: 68000 },
  { month: 'Dec', enrollments: 192000, rejections: 4200, updates: 72000 },
];

export const anomalyData: AnomalyData[] = [
  { state: 'Maharashtra', district: 'Pune', ageGroup: '5-7', rejectionReason: 'Biometric Quality', count: 1250, severity: 'high', lat: 18.52, lng: 73.85 },
  { state: 'Maharashtra', district: 'Mumbai', ageGroup: '0-5', rejectionReason: 'Document Mismatch', count: 890, severity: 'medium', lat: 19.07, lng: 72.87 },
  { state: 'Uttar Pradesh', district: 'Lucknow', ageGroup: '5-7', rejectionReason: 'Biometric Quality', count: 2100, severity: 'high', lat: 26.84, lng: 80.94 },
  { state: 'Uttar Pradesh', district: 'Varanasi', ageGroup: '60+', rejectionReason: 'Biometric Quality', count: 1560, severity: 'high', lat: 25.31, lng: 82.99 },
  { state: 'Bihar', district: 'Patna', ageGroup: '5-7', rejectionReason: 'Biometric Quality', count: 1890, severity: 'high', lat: 25.59, lng: 85.13 },
  { state: 'Tamil Nadu', district: 'Chennai', ageGroup: '18-30', rejectionReason: 'Photo Quality', count: 670, severity: 'low', lat: 13.08, lng: 80.27 },
  { state: 'Karnataka', district: 'Bangalore', ageGroup: '30-45', rejectionReason: 'Address Mismatch', count: 540, severity: 'low', lat: 12.97, lng: 77.59 },
  { state: 'Rajasthan', district: 'Jaipur', ageGroup: '5-7', rejectionReason: 'Biometric Quality', count: 1340, severity: 'high', lat: 26.91, lng: 75.78 },
  { state: 'West Bengal', district: 'Kolkata', ageGroup: '45-60', rejectionReason: 'Document Mismatch', count: 780, severity: 'medium', lat: 22.57, lng: 88.36 },
  { state: 'Gujarat', district: 'Ahmedabad', ageGroup: '0-5', rejectionReason: 'Photo Quality', count: 620, severity: 'medium', lat: 23.02, lng: 72.57 },
  { state: 'Madhya Pradesh', district: 'Bhopal', ageGroup: '5-7', rejectionReason: 'Biometric Quality', count: 1120, severity: 'high', lat: 23.25, lng: 77.41 },
  { state: 'Kerala', district: 'Thiruvananthapuram', ageGroup: '60+', rejectionReason: 'Biometric Quality', count: 890, severity: 'medium', lat: 8.52, lng: 76.93 },
];

export const stateHotspots: StateHotspot[] = [
  { state: 'Uttar Pradesh', anomalyCount: 3660, primaryIssue: 'Biometric Quality in Children', x: 65, y: 35, size: 85 },
  { state: 'Bihar', anomalyCount: 1890, primaryIssue: 'Biometric Quality in Children', x: 75, y: 38, size: 65 },
  { state: 'Maharashtra', anomalyCount: 2140, primaryIssue: 'Mixed Issues', x: 55, y: 55, size: 70 },
  { state: 'Rajasthan', anomalyCount: 1340, primaryIssue: 'Biometric Quality in Children', x: 48, y: 40, size: 55 },
  { state: 'Madhya Pradesh', anomalyCount: 1120, primaryIssue: 'Biometric Quality in Children', x: 58, y: 48, size: 50 },
  { state: 'West Bengal', anomalyCount: 780, primaryIssue: 'Document Mismatch', x: 82, y: 45, size: 40 },
  { state: 'Tamil Nadu', anomalyCount: 670, primaryIssue: 'Photo Quality', x: 60, y: 78, size: 35 },
  { state: 'Karnataka', anomalyCount: 540, primaryIssue: 'Address Mismatch', x: 55, y: 70, size: 32 },
  { state: 'Gujarat', anomalyCount: 620, primaryIssue: 'Photo Quality', x: 42, y: 52, size: 35 },
  { state: 'Kerala', anomalyCount: 890, primaryIssue: 'Biometric Quality in Elderly', x: 55, y: 82, size: 42 },
];

export const insights = [
  {
    id: 1,
    title: 'High Biometric Rejection in Children (5-7)',
    description: 'Fingerprint quality issues detected in 6 states',
    severity: 'high',
    affectedCount: 8700,
  },
  {
    id: 2,
    title: 'Elderly Biometric Challenges',
    description: 'Increased rejections in 60+ age group across South India',
    severity: 'medium',
    affectedCount: 2450,
  },
  {
    id: 3,
    title: 'Document Verification Delays',
    description: 'Address mismatch issues in metro cities',
    severity: 'low',
    affectedCount: 1320,
  },
  {
    id: 4,
    title: 'Photo Quality Standards',
    description: 'Camera equipment issues at rural enrollment centers',
    severity: 'medium',
    affectedCount: 1290,
  },
];

export const llmAnalysis = {
  rootCauses: [
    'Children aged 5-7 have underdeveloped fingerprint ridges, leading to poor biometric capture quality',
    'Recent monsoon flooding in UP and Bihar may have damaged enrollment center equipment',
    'Local news reports indicate power outages affecting biometric device calibration',
    'Infrastructure audit reveals 23% of affected centers using outdated fingerprint scanners',
  ],
  recommendations: [
    'Deploy iris-based verification for children under 8 years',
    'Initiate equipment replacement program in high-anomaly districts',
    'Implement real-time quality feedback during enrollment',
    'Consider policy amendment for flexible re-enrollment windows',
  ],
};
