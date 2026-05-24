import axiosClient from './axiosClient';

export type PeriodGroupBy = 'DAY' | 'MONTH' | 'LOT';

export interface DashboardSummary {
  totalInspected: number;
  passedCount: number;
  failedCount: number;
  defectRate: number;
  pendingCount: number;
  cancelledCount: number;
}

export interface DefectTrendPoint {
  label: string;
  inspectedCount: number;
  failedCount: number;
  defectRate: number;
}

export interface PeriodStat {
  label: string;
  inspectedCount: number;
  passedCount: number;
  failedCount: number;
  defectRate: number;
}

export interface EmployeePerformance {
  username: string;
  inspectedCount: number;
  passedCount: number;
  failedCount: number;
  defectRate: number;
  passRate: number;
}

export interface RecentInspection {
  id: number;
  lotCode: string;
  partName: string;
  status: string;
  createdBy: string | null;
  createdAt: string;
}

export interface DashboardData {
  summary: DashboardSummary;
  defectTrend: DefectTrendPoint[];
  periodStats: PeriodStat[];
  periodGroupBy: string;
  employeePerformance: EmployeePerformance[];
  recentInspections: RecentInspection[];
  generatedAt: string;
}

export const statsService = {
  getDashboard: (groupBy: PeriodGroupBy = 'DAY', trendDays = 30): Promise<DashboardData> =>
    axiosClient.get('/statistics/dashboard', { params: { groupBy, trendDays } }),
};
