import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HeroSection } from './components/HeroSection';
import { DropZone } from './components/DropZone';
import { Dashboard } from './components/Dashboard';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { analyticsApi } from './services/analyticsApi';

type AppState = 'hero' | 'upload' | 'dashboard' | 'analytics';

function App() {
  const [appState, setAppState] = useState<AppState>('hero');
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleEngage = () => {
    setAppState('upload');
  };

  const handleFileUpload = useCallback(async (file: File) => {
    console.log('File uploaded:', file.name);
    setUploadError(null);
    setUploadProgress(10);
    
    try {
      // Upload file to analytics backend
      setUploadProgress(20);
      const uploadResponse = await analyticsApi.uploadFile(file);
      console.log('Upload response:', uploadResponse);
      
      if (uploadResponse.job_id) {
        setUploadProgress(40);
        
        // Trigger analysis on the uploaded data
        const analyzeResponse = await analyticsApi.triggerAnalysis(uploadResponse.job_id, {
          runLlm: false // Skip LLM for faster results initially
        });
        console.log('Analysis triggered:', analyzeResponse);
        
        setUploadProgress(60);
        setAnalysisId(uploadResponse.job_id);
        setAppState('analytics');
      } else {
        // Fallback to demo dashboard if no job_id
        console.warn('No job_id in response, falling back to demo');
        setAppState('dashboard');
      }
    } catch (error) {
      console.error('Upload/Analysis error:', error);
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
      // After delay, show demo dashboard anyway
      setTimeout(() => {
        setAppState('dashboard');
      }, 3000);
    }
  }, []);

  const handleNewAnalysis = useCallback(() => {
    setAnalysisId(null);
    setUploadProgress(0);
    setUploadError(null);
    setAppState('upload');
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <AnimatePresence mode="wait">
        {appState === 'hero' && (
          <motion.div
            key="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <HeroSection onEngage={handleEngage} />
          </motion.div>
        )}

        {appState === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <DropZone 
              onFileUpload={handleFileUpload} 
              isMinimized={false}
              uploadProgress={uploadProgress}
              uploadError={uploadError}
            />
          </motion.div>
        )}

        {appState === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <DropZone onFileUpload={handleFileUpload} isMinimized={true} />
            <Dashboard />
          </motion.div>
        )}

        {appState === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <DropZone onFileUpload={handleFileUpload} isMinimized={true} />
            <AnalyticsDashboard 
              analysisId={analysisId || undefined}
              onNewAnalysis={handleNewAnalysis}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
