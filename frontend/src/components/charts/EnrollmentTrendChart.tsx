import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { enrollmentTrends } from '../../data/mockData';

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-xl p-4 border border-white/20"
      >
        <p className="text-white/70 text-sm mb-2">{label} 2025</p>
        <div className="space-y-1">
          <p className="text-sm">
            <span className="text-blue-400">Enrollments:</span>{' '}
            <span className="text-white font-medium">
              {payload[0]?.value?.toLocaleString()}
            </span>
          </p>
          <p className="text-sm">
            <span className="text-red-400">Rejections:</span>{' '}
            <span className="text-white font-medium">
              {payload[1]?.value?.toLocaleString()}
            </span>
          </p>
        </div>
      </motion.div>
    );
  }
  return null;
};

export function EnrollmentTrendChart() {
  return (
    <motion.div
      className="glass rounded-2xl p-6 h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <h3 className="text-lg font-semibold text-white/90 mb-1">Enrollment Trends</h3>
      <p className="text-sm text-white/40 mb-6">Monthly enrollment and rejection data</p>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={enrollmentTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="enrollmentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="rejectionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EF4444" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="enrollments"
              stroke="#3B82F6"
              strokeWidth={2}
              fill="url(#enrollmentGradient)"
            />
            <Area
              type="monotone"
              dataKey="rejections"
              stroke="#EF4444"
              strokeWidth={2}
              fill="url(#rejectionGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-sm text-white/50">Enrollments</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-sm text-white/50">Rejections</span>
        </div>
      </div>
    </motion.div>
  );
}
