import { motion } from 'framer-motion';
import { AlertTriangle, TrendingUp, Users, MapPin } from 'lucide-react';
import { insights } from '../data/mockData';

type Severity = 'high' | 'medium' | 'low';

const severityColors: Record<Severity, string> = {
  high: 'text-red-400 bg-red-500/10 border-red-500/20',
  medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  low: 'text-green-400 bg-green-500/10 border-green-500/20',
};

const severityIcons: Record<Severity, typeof AlertTriangle> = {
  high: AlertTriangle,
  medium: TrendingUp,
  low: Users,
};

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

export function InsightSummary() {
  return (
    <motion.div
      className="glass rounded-2xl p-6 mb-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white/90">Key Insights</h2>
        <span className="text-sm text-white/40">
          Last updated: {new Date().toLocaleDateString()}
        </span>
      </div>

      <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {insights.map((insight) => {
          const Icon = severityIcons[insight.severity as Severity];
          return (
            <motion.div
              key={insight.id}
              className={`
                rounded-xl p-4 border transition-all duration-300
                hover:scale-[1.02] cursor-default
                ${severityColors[insight.severity as Severity]}
              `}
              variants={itemVariants}
              whileHover={{ y: -2 }}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center
                  ${insight.severity === 'high' ? 'bg-red-500/20' : 
                    insight.severity === 'medium' ? 'bg-yellow-500/20' : 'bg-green-500/20'}
                `}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-white/90 leading-tight">
                    {insight.title}
                  </h3>
                </div>
              </div>
              <p className="text-xs text-white/50 mb-3">
                {insight.description}
              </p>
              <div className="flex items-center gap-2 text-xs">
                <MapPin className="w-3 h-3 text-white/40" />
                <span className="text-white/60">
                  {insight.affectedCount.toLocaleString()} affected
                </span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
