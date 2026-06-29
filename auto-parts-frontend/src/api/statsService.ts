import axiosClient from './axiosClient';

export interface DashboardStats {
  totalInspections: number;
  passedCount: number;
  failedCount: number;
  pendingCount: number;
  passRatePercentage: number;
}

export interface DefectTrend {
  date: string;
  failedCount: number;
}

export const statsService = {
  getSummaryStats: (): Promise<DashboardStats> => {
    return axiosClient.get('/stats/summary');
  },

  getDefectTrends: (days: number = 7): Promise<DefectTrend[]> => {
    return axiosClient.get(`/stats/trends?days=${days}`);
  }
};