import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileSpreadsheet, Check } from 'lucide-react';

interface DropZoneProps {
  onFileUpload: (file: File) => void;
  isMinimized: boolean;
}

export function DropZone({ onFileUpload, isMinimized }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setUploadedFile(files[0].name);
      onFileUpload(files[0]);
    }
  }, [onFileUpload]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploadedFile(files[0].name);
      onFileUpload(files[0]);
    }
  }, [onFileUpload]);

  // Minimized state - small button in corner
  if (isMinimized) {
    return (
      <motion.div
        initial={{ scale: 1, opacity: 1 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed top-6 left-6 z-50"
      >
        <label className="cursor-pointer">
          <motion.div
            className="glass rounded-xl px-4 py-3 flex items-center gap-3 hover:bg-white/10 transition-colors duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <Upload className="w-5 h-5 text-blue-400" />
            <span className="text-sm text-white/70">Upload New</span>
          </motion.div>
          <input
            type="file"
            className="hidden"
            accept=".csv,.xlsx,.json"
            onChange={handleFileInput}
          />
        </label>
      </motion.div>
    );
  }

  // Full drop zone state
  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <label className="cursor-pointer w-full max-w-lg">
        <motion.div
          className={`
            relative w-full aspect-square max-w-lg mx-auto rounded-3xl
            border-2 border-dashed transition-all duration-500
            flex flex-col items-center justify-center gap-6
            ${isDragging 
              ? 'border-blue-500 bg-blue-500/10' 
              : 'border-white/20 hover:border-white/40 border-pulse'
            }
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          whileHover={{ scale: 1.02 }}
          animate={{
            boxShadow: isDragging 
              ? '0 0 60px rgba(59, 130, 246, 0.4)' 
              : '0 0 40px rgba(59, 130, 246, 0.1)',
          }}
        >
          <AnimatePresence mode="wait">
            {uploadedFile ? (
              <motion.div
                key="uploaded"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="w-20 h-20 rounded-2xl bg-green-500/20 flex items-center justify-center">
                  <Check className="w-10 h-10 text-green-400" />
                </div>
                <p className="text-white/70 text-center">
                  <span className="text-white font-medium">{uploadedFile}</span>
                  <br />
                  <span className="text-sm">Processing...</span>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center gap-4"
              >
                <motion.div
                  className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center"
                  animate={{
                    scale: isDragging ? 1.1 : 1,
                  }}
                >
                  {isDragging ? (
                    <FileSpreadsheet className="w-10 h-10 text-blue-400" />
                  ) : (
                    <Upload className="w-10 h-10 text-white/40" />
                  )}
                </motion.div>
                <div className="text-center">
                  <p className="text-white/70 mb-2">
                    {isDragging ? 'Drop your file here' : 'Drop your dataset here'}
                  </p>
                  <p className="text-white/40 text-sm">
                    Supports CSV, XLSX, and JSON formats
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Animated border gradient */}
          <motion.div
            className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.3), transparent)',
              backgroundSize: '200% 100%',
            }}
            animate={{
              backgroundPosition: ['0% 0%', '200% 0%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </motion.div>
        <input
          type="file"
          className="hidden"
          accept=".csv,.xlsx,.json"
          onChange={handleFileInput}
        />
      </label>

      <motion.p
        className="mt-8 text-white/30 text-sm text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Your data is processed locally and never stored on external servers
      </motion.p>
    </motion.div>
  );
}
