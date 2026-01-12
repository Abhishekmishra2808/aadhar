import { motion } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { anomalyData } from '../../data/mockData';

// Aggregate data by rejection reason
const rejectionReasonData = anomalyData.reduce((acc, item) => {
  const existing = acc.find(a => a.reason === item.rejectionReason);
  if (existing) {
    existing.count += item.count;
  } else {
    acc.push({ reason: item.rejectionReason, count: item.count });
  }
  return acc;
}, [] as { reason: string; count: number }[]);

rejectionReasonData.sort((a, b) => b.count - a.count);

const COLORS = ['#EF4444', '#3B82F6', '#F59E0B', '#22C55E', '#8B5CF6'];

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
  if (active && payload && payload.length) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-xl p-4 border border-white/20"
      >
        <p className="text-white/70 text-sm mb-1">{payload[0]?.payload?.reason}</p>
        <p className="text-sm">
          <span className="text-white font-medium">
            {payload[0]?.value?.toLocaleString()}
          </span>{' '}
          <span className="text-white/50">cases</span>
        </p>
      </motion.div>
    );
  }
  return null;
};

export function RejectionReasonsChart() {
  const total = rejectionReasonData.reduce((sum, item) => sum + item.count, 0);

  return (
    <motion.div
      className="glass rounded-2xl p-6 h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
    >
      <h3 className="text-lg font-semibold text-white/90 mb-1">Rejection Reasons</h3>
      <p className="text-sm text-white/40 mb-6">Primary causes of enrollment failure</p>

      <div className="flex items-center gap-6">
        <div className="h-52 w-52 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={rejectionReasonData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
                dataKey="count"
              >
                {rejectionReasonData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    fillOpacity={0.8}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-3">
          {rejectionReasonData.map((item, index) => (
            <motion.div
              key={item.reason}
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
            >
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/70 truncate">{item.reason}</p>
                <p className="text-xs text-white/40">
                  {((item.count / total) * 100).toFixed(1)}%
                </p>
              </div>
              <span className="text-sm text-white/50 font-medium">
                {item.count.toLocaleString()}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
