import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Globe, Newspaper, Building } from 'lucide-react';
import { llmAnalysis } from '../data/mockData';

const stages = [
  { icon: Globe, text: 'Searching local news sources...', duration: 2000 },
  { icon: Newspaper, text: 'Analyzing infrastructure reports...', duration: 2500 },
  { icon: Building, text: 'Cross-referencing enrollment center data...', duration: 2000 },
  { icon: Brain, text: 'Synthesizing root cause analysis...', duration: 1500 },
];

export function LLMReasoningBar() {
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [currentStage, setCurrentStage] = useState(0);

  useEffect(() => {
    if (!isAnalyzing) return;

    const timer = setTimeout(() => {
      if (currentStage < stages.length - 1) {
        setCurrentStage(prev => prev + 1);
      } else {
        setIsAnalyzing(false);
      }
    }, stages[currentStage].duration);

    return () => clearTimeout(timer);
  }, [currentStage, isAnalyzing]);

  const CurrentIcon = stages[currentStage]?.icon || Brain;

  return (
    <motion.div
      className="glass rounded-2xl p-6 mb-6 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
          <Brain className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white/90">AI Root Cause Analysis</h3>
          <p className="text-sm text-white/40">Powered by advanced reasoning</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isAnalyzing ? (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Shimmer Bar */}
            <div className="h-2 rounded-full bg-white/5 overflow-hidden mb-4">
              <motion.div
                className="h-full shimmer"
                initial={{ width: '0%' }}
                animate={{ width: `${((currentStage + 1) / stages.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            {/* Current Stage */}
            <motion.div
              key={currentStage}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex items-center gap-3 text-white/60"
            >
              <CurrentIcon className="w-4 h-4 text-blue-400 animate-pulse" />
              <span className="text-sm">{stages[currentStage].text}</span>
            </motion.div>

            {/* Progress Dots */}
            <div className="flex items-center gap-2 mt-4">
              {stages.map((_, index) => (
                <motion.div
                  key={index}
                  className={`
                    w-2 h-2 rounded-full transition-colors duration-300
                    ${index <= currentStage ? 'bg-blue-500' : 'bg-white/20'}
                  `}
                  animate={{
                    scale: index === currentStage ? [1, 1.3, 1] : 1,
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: index === currentStage ? Infinity : 0,
                  }}
                />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Root Causes */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-white/70 mb-3">Identified Root Causes</h4>
              <div className="space-y-2">
                {llmAnalysis.rootCauses.map((cause, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-white/5"
                  >
                    <span className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center text-xs text-red-400 shrink-0">
                      {index + 1}
                    </span>
                    <p className="text-sm text-white/60">{cause}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <h4 className="text-sm font-medium text-white/70 mb-3">Recommended Actions</h4>
              <div className="space-y-2">
                {llmAnalysis.recommendations.map((rec, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/10"
                  >
                    <span className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-xs text-green-400 shrink-0">
                      ✓
                    </span>
                    <p className="text-sm text-white/60">{rec}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
