import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HeroSection } from './components/HeroSection';
import { DropZone } from './components/DropZone';
import { Dashboard } from './components/Dashboard';

type AppState = 'hero' | 'upload' | 'dashboard';

function App() {
  const [appState, setAppState] = useState<AppState>('hero');

  const handleEngage = () => {
    setAppState('upload');
  };

  const handleFileUpload = (file: File) => {
    console.log('File uploaded:', file.name);
    // Simulate processing delay
    setTimeout(() => {
      setAppState('dashboard');
    }, 1500);
  };

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
            <DropZone onFileUpload={handleFileUpload} isMinimized={false} />
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
      </AnimatePresence>
    </div>
  );
}

export default App;
