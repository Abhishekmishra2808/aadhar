import { motion } from 'framer-motion';
import { InsightSummary } from './InsightSummary';
import { LLMReasoningBar } from './LLMReasoningBar';
import { EnrollmentTrendChart } from './charts/EnrollmentTrendChart';
import { HotspotBubbleChart } from './charts/HotspotBubbleChart';
import { AgeDistributionChart } from './charts/AgeDistributionChart';
import { RejectionReasonsChart } from './charts/RejectionReasonsChart';

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

export function Dashboard() {
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
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-white/90 mb-2">
            Aadhaar Pulse Dashboard
          </h1>
          <p className="text-white/50">
            Real-time societal trend analysis powered by AI
          </p>
        </motion.div>

        {/* Insight Summary */}
        <InsightSummary />

        {/* LLM Reasoning */}
        <LLMReasoningBar />

        {/* Charts Grid - 2x2 Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EnrollmentTrendChart />
          <HotspotBubbleChart />
          <AgeDistributionChart />
          <RejectionReasonsChart />
        </div>

        {/* Footer */}
        <motion.div
          className="mt-12 text-center text-white/30 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <p>Aadhaar Pulse • Societal Trend Intelligence Engine</p>
          <p className="mt-1">Data refreshed: {new Date().toLocaleString()}</p>
        </motion.div>
      </div>
    </motion.div>
  );
}
