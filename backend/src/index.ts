import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { analyzeData } from './services/analyzer.js';
import { mockEnrollmentData, mockAnomalyData, mockInsights } from './data/mockData.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// File upload configuration
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['text/csv', 'application/json', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(csv|json|xlsx)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV, JSON, and XLSX files are allowed.'));
    }
  }
});

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get enrollment trends
app.get('/api/trends/enrollment', (req, res) => {
  res.json({
    success: true,
    data: mockEnrollmentData,
  });
});

// Get anomaly data
app.get('/api/anomalies', (req, res) => {
  res.json({
    success: true,
    data: mockAnomalyData,
  });
});

// Get insights
app.get('/api/insights', (req, res) => {
  res.json({
    success: true,
    data: mockInsights,
  });
});

// Upload and analyze file
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const result = await analyzeData(req.file);
    
    res.json({
      success: true,
      filename: req.file.originalname,
      size: req.file.size,
      analysis: result,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: 'Failed to process file' });
  }
});

// LLM Analysis endpoint (mock)
app.post('/api/analyze/llm', async (req, res) => {
  const { anomalyIds } = req.body;

  // Simulate LLM processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  res.json({
    success: true,
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
    confidence: 0.87,
    sourcesAnalyzed: 142,
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 Aadhaar Pulse Backend running on http://localhost:${PORT}`);
});
