import { motion } from 'framer-motion';
import { Activity, Brain, Lightbulb } from 'lucide-react';

interface HeroSectionProps {
  onEngage: () => void;
}

const features = [
  {
    icon: Activity,
    title: 'Real-time Pattern Detection',
    description: 'Identify enrollment anomalies and trends as they emerge across India.',
  },
  {
    icon: Brain,
    title: 'LLM-Powered Root Cause Analysis',
    description: 'AI-driven insights correlate data with news, infrastructure, and policy changes.',
  },
  {
    icon: Lightbulb,
    title: 'Actionable Policy Insights',
    description: 'Transform data into clear recommendations for UIDAI decision-makers.',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

export function HeroSection({ onEngage }: HeroSectionProps) {
  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-20"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Main Headline */}
      <motion.div className="text-center mb-16" variants={itemVariants}>
        <motion.h1
          className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 bg-linear-to-r from-white via-white to-white/60 bg-clip-text text-transparent"
        >
          Unlocking Societal Trends
          <br />
          <span className="text-white/80">in Aadhaar</span>
        </motion.h1>
        <motion.p
          className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto font-light"
          variants={itemVariants}
        >
          A next-generation intelligence engine that transforms enrollment data into
          actionable insights for policy makers.
        </motion.p>
      </motion.div>

      {/* Feature Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full mb-16"
        variants={containerVariants}
      >
        {features.map((feature, index) => (
          <motion.div
            key={index}
            className="glass rounded-2xl p-8 hover:bg-white/10 transition-all duration-500 group cursor-default"
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -5 }}
          >
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-6 group-hover:bg-blue-500/20 transition-colors duration-500">
              <feature.icon className="w-6 h-6 text-white/70 group-hover:text-blue-400 transition-colors duration-500" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-white/90">
              {feature.title}
            </h3>
            <p className="text-white/50 font-light leading-relaxed">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Engage Button */}
      <motion.button
        onClick={onEngage}
        className="relative px-10 py-4 bg-white text-black font-semibold rounded-full text-lg overflow-hidden group"
        variants={itemVariants}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="relative z-10">Begin Analysis</span>
        <motion.div
          className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ filter: 'blur(20px)' }}
        />
        <motion.div
          className="absolute -inset-1 bg-linear-to-r from-blue-500 to-blue-600 rounded-full opacity-0 group-hover:opacity-50 blur-lg transition-opacity duration-500"
        />
      </motion.button>

      {/* Subtle hint */}
      <motion.p
        className="mt-8 text-white/30 text-sm"
        variants={itemVariants}
      >
        Upload your dataset to unlock insights
      </motion.p>
    </motion.div>
  );
}
