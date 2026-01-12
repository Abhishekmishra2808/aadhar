export const mockEnrollmentData = [
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

export const mockAnomalyData = [
  { state: 'Maharashtra', district: 'Pune', ageGroup: '5-7', rejectionReason: 'Biometric Quality', count: 1250, severity: 'high' },
  { state: 'Maharashtra', district: 'Mumbai', ageGroup: '0-5', rejectionReason: 'Document Mismatch', count: 890, severity: 'medium' },
  { state: 'Uttar Pradesh', district: 'Lucknow', ageGroup: '5-7', rejectionReason: 'Biometric Quality', count: 2100, severity: 'high' },
  { state: 'Uttar Pradesh', district: 'Varanasi', ageGroup: '60+', rejectionReason: 'Biometric Quality', count: 1560, severity: 'high' },
  { state: 'Bihar', district: 'Patna', ageGroup: '5-7', rejectionReason: 'Biometric Quality', count: 1890, severity: 'high' },
  { state: 'Tamil Nadu', district: 'Chennai', ageGroup: '18-30', rejectionReason: 'Photo Quality', count: 670, severity: 'low' },
  { state: 'Karnataka', district: 'Bangalore', ageGroup: '30-45', rejectionReason: 'Address Mismatch', count: 540, severity: 'low' },
  { state: 'Rajasthan', district: 'Jaipur', ageGroup: '5-7', rejectionReason: 'Biometric Quality', count: 1340, severity: 'high' },
  { state: 'West Bengal', district: 'Kolkata', ageGroup: '45-60', rejectionReason: 'Document Mismatch', count: 780, severity: 'medium' },
  { state: 'Gujarat', district: 'Ahmedabad', ageGroup: '0-5', rejectionReason: 'Photo Quality', count: 620, severity: 'medium' },
  { state: 'Madhya Pradesh', district: 'Bhopal', ageGroup: '5-7', rejectionReason: 'Biometric Quality', count: 1120, severity: 'high' },
  { state: 'Kerala', district: 'Thiruvananthapuram', ageGroup: '60+', rejectionReason: 'Biometric Quality', count: 890, severity: 'medium' },
];

export const mockInsights = [
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
