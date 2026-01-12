import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { anomalyData } from '../../data/mockData';

// Aggregate data by age group
const ageGroupData = anomalyData.reduce((acc, item) => {
  const existing = acc.find(a => a.ageGroup === item.ageGroup);
  if (existing) {
    existing.count += item.count;
  } else {
    acc.push({ ageGroup: item.ageGroup, count: item.count });
  }
  return acc;
}, [] as { ageGroup: string; count: number }[]);

// Sort by age group
const sortOrder = ['0-5', '5-7', '18-30', '30-45', '45-60', '60+'];
ageGroupData.sort((a, b) => sortOrder.indexOf(a.ageGroup) - sortOrder.indexOf(b.ageGroup));

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-xl p-4 border border-white/20"
      >
        <p className="text-white/70 text-sm mb-1">Age Group: {label}</p>
        <p className="text-sm">
          <span className="text-white font-medium">
            {payload[0]?.value?.toLocaleString()}
          </span>{' '}
          <span className="text-white/50">rejections</span>
        </p>
      </motion.div>
    );
  }
  return null;
};

const getBarColor = (ageGroup: string) => {
  if (ageGroup === '5-7' || ageGroup === '0-5') return '#EF4444';
  if (ageGroup === '60+') return '#F59E0B';
  return '#3B82F6';
};

export function AgeDistributionChart() {
  return (
    <motion.div
      className="glass rounded-2xl p-6 h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <h3 className="text-lg font-semibold text-white/90 mb-1">Rejection by Age Group</h3>
      <p className="text-sm text-white/40 mb-6">Identifying vulnerable demographics</p>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={ageGroupData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="ageGroup"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
              tickFormatter={(value) => `${(value / 1000).toFixed(1)}k`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              {ageGroupData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.ageGroup)} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-4 mt-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span className="text-white/50">Children (High Risk)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-yellow-500" />
          <span className="text-white/50">Elderly</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span className="text-white/50">Adults</span>
        </div>
      </div>
    </motion.div>
  );
}
