import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Package,
  RefreshCw,
  Users,
  Radio,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  statsService,
  type DashboardData,
  type PeriodGroupBy,
} from '../api/statsService';

const REFRESH_INTERVAL_MS = 5000;

const formatNumber = (value: number) =>
  new Intl.NumberFormat('vi-VN').format(value);

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

const statusBadgeClass = (status: string) => {
  switch (status) {
    case 'PASSED':
      return 'bg-green-100 text-green-700';
    case 'FAILED':
      return 'bg-red-100 text-red-700';
    case 'PENDING':
      return 'bg-amber-100 text-amber-700';
    case 'PROCESSING':
      return 'bg-blue-100 text-blue-700';
    case 'CANCELLED':
      return 'bg-slate-200 text-slate-600';
    default:
      return 'bg-slate-100 text-slate-600';
  }
};

const periodLabels: Record<PeriodGroupBy, string> = {
  DAY: 'Theo ngày',
  MONTH: 'Theo tháng',
  LOT: 'Theo lô hàng',
};

const ManagerDashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [groupBy, setGroupBy] = useState<PeriodGroupBy>('DAY');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDashboard = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const response = await statsService.getDashboard(groupBy, 30);
      setData(response);
      setError(null);
      setLastUpdated(new Date());
    } catch {
      setError('Không thể tải dữ liệu thống kê. Vui lòng kiểm tra kết nối backend.');
    } finally {
      setLoading(false);
    }
  }, [groupBy]);

  useEffect(() => {
    fetchDashboard(true);
    const interval = setInterval(() => fetchDashboard(false), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const summary = data?.summary;

  const kpiCards = summary
    ? [
        {
          title: 'Đã kiểm tra',
          value: formatNumber(summary.totalInspected),
          icon: Package,
          color: 'text-blue-600',
          bg: 'bg-blue-100',
        },
        {
          title: 'Đạt (PASSED)',
          value: formatNumber(summary.passedCount),
          icon: CheckCircle,
          color: 'text-green-600',
          bg: 'bg-green-100',
        },
        {
          title: 'Lỗi (FAILED)',
          value: formatNumber(summary.failedCount),
          icon: AlertTriangle,
          color: 'text-red-600',
          bg: 'bg-red-100',
        },
        {
          title: 'Tỷ lệ lỗi',
          value: formatPercent(summary.defectRate),
          icon: Activity,
          color: 'text-orange-600',
          bg: 'bg-orange-100',
        },
      ]
    : [];

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Dashboard thống kê</h2>
          <p className="text-sm text-slate-500 mt-1">
            Cập nhật real-time mỗi {REFRESH_INTERVAL_MS / 1000}s
            {lastUpdated && (
              <span className="ml-2">
                · Lần cuối: {lastUpdated.toLocaleTimeString('vi-VN')}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-medium">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            Live
          </span>
          <button
            type="button"
            onClick={() => fetchDashboard(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1"
            >
              <div className={`p-4 rounded-xl ${stat.bg}`}>
                <Icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{stat.title}</p>
                <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* Defect Rate highlight + Trend chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-orange-500 to-red-600 p-6 rounded-2xl text-white shadow-lg">
          <p className="text-orange-100 text-sm font-medium mb-2">Defect Rate (Tỷ lệ lỗi)</p>
          <p className="text-5xl font-bold mb-4">
            {summary ? formatPercent(summary.defectRate) : '—'}
          </p>
          <div className="space-y-2 text-sm text-orange-50">
            <div className="flex justify-between">
              <span>Đã kiểm tra</span>
              <span className="font-semibold">
                {summary ? formatNumber(summary.totalInspected) : 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Đang chờ</span>
              <span className="font-semibold">
                {summary ? formatNumber(summary.pendingCount) : 0}
              </span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2 mt-3">
              <div
                className="bg-white h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(summary?.defectRate ?? 0, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">
            Biểu đồ lỗi theo thời gian
          </h3>
          {data?.defectTrend && data.defectTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data.defectTrend}>
                <defs>
                  <linearGradient id="failedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  stroke="#94a3b8"
                  unit="%"
                />
                <Tooltip
                  formatter={(value, name) => {
                    const num = Number(value ?? 0);
                    if (name === 'defectRate') return [formatPercent(num), 'Tỷ lệ lỗi'];
                    return [num, name === 'failedCount' ? 'Số lỗi' : String(name)];
                  }}
                />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="failedCount"
                  name="Số lỗi"
                  stroke="#ef4444"
                  fill="url(#failedGradient)"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="defectRate"
                  name="Tỷ lệ lỗi (%)"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-400">
              Chưa có dữ liệu kiểm định
            </div>
          )}
        </div>
      </div>

      {/* Period stats with filter */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h3 className="text-lg font-bold text-slate-800">Thống kê theo kỳ</h3>
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            {(['DAY', 'MONTH', 'LOT'] as PeriodGroupBy[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setGroupBy(key)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  groupBy === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {periodLabels[key]}
              </button>
            ))}
          </div>
        </div>

        {data?.periodStats && data.periodStats.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data.periodStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                stroke="#94a3b8"
                interval={0}
                angle={groupBy === 'LOT' ? -25 : 0}
                textAnchor={groupBy === 'LOT' ? 'end' : 'middle'}
                height={groupBy === 'LOT' ? 70 : 30}
              />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip
                formatter={(value, name) => {
                  const num = Number(value ?? 0);
                  const labels: Record<string, string> = {
                    inspectedCount: 'Đã kiểm',
                    passedCount: 'Đạt',
                    failedCount: 'Lỗi',
                    defectRate: 'Tỷ lệ lỗi',
                  };
                  const key = String(name);
                  if (key === 'defectRate') return [formatPercent(num), labels[key]];
                  return [num, labels[key] ?? key];
                }}
              />
              <Legend />
              <Bar dataKey="passedCount" name="Đạt" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="failedCount" name="Lỗi" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-slate-400">
            Chưa có dữ liệu cho nhóm {periodLabels[groupBy].toLowerCase()}
          </div>
        )}
      </div>

      {/* Employee performance + Recent */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-slate-800">Hiệu suất nhân viên</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-left">
                  <th className="pb-3 font-medium">Nhân viên</th>
                  <th className="pb-3 font-medium text-right">Đã kiểm</th>
                  <th className="pb-3 font-medium text-right">Đạt</th>
                  <th className="pb-3 font-medium text-right">Lỗi</th>
                  <th className="pb-3 font-medium text-right">Tỷ lệ đạt</th>
                  <th className="pb-3 font-medium text-right">Defect Rate</th>
                </tr>
              </thead>
              <tbody>
                {data?.employeePerformance && data.employeePerformance.length > 0 ? (
                  data.employeePerformance.map((emp) => (
                    <tr key={emp.username} className="border-b border-slate-100 last:border-0">
                      <td className="py-3 font-medium text-slate-800">{emp.username}</td>
                      <td className="py-3 text-right">{formatNumber(emp.inspectedCount)}</td>
                      <td className="py-3 text-right text-green-600">
                        {formatNumber(emp.passedCount)}
                      </td>
                      <td className="py-3 text-right text-red-600">
                        {formatNumber(emp.failedCount)}
                      </td>
                      <td className="py-3 text-right">{formatPercent(emp.passRate)}</td>
                      <td className="py-3 text-right font-semibold text-orange-600">
                        {formatPercent(emp.defectRate)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Chưa có dữ liệu hiệu suất nhân viên
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Lịch sử kiểm định gần đây</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-left">
                  <th className="pb-3 font-medium">Lô</th>
                  <th className="pb-3 font-medium">Phụ tùng</th>
                  <th className="pb-3 font-medium">Nhân viên</th>
                  <th className="pb-3 font-medium">Trạng thái</th>
                  <th className="pb-3 font-medium">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentInspections && data.recentInspections.length > 0 ? (
                  data.recentInspections.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-3 font-medium text-slate-800">{item.lotCode}</td>
                      <td className="py-3 text-slate-600">{item.partName}</td>
                      <td className="py-3 text-slate-600">{item.createdBy ?? '—'}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadgeClass(item.status)}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 text-slate-500">
                        {new Date(item.createdAt).toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Chưa có phiên kiểm định
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Defect rate line chart by period */}
      {data?.periodStats && data.periodStats.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">
            Defect Rate — {periodLabels[groupBy]}
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data.periodStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                stroke="#94a3b8"
                angle={groupBy === 'LOT' ? -25 : 0}
                textAnchor={groupBy === 'LOT' ? 'end' : 'middle'}
                height={groupBy === 'LOT' ? 60 : 30}
              />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" unit="%" />
              <Tooltip
                formatter={(value) => [formatPercent(Number(value ?? 0)), 'Defect Rate']}
              />
              <Line
                type="monotone"
                dataKey="defectRate"
                name="Defect Rate"
                stroke="#f97316"
                strokeWidth={3}
                dot={{ fill: '#f97316', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;
