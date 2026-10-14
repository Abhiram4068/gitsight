import axiosClient from './axiosClient';

export const analyticsApi = {
  getDashboardAnalytics: async () => {
    const response = await axiosClient.get('/api/analytics/dashboard');
    return response.data?.data;
  },
};

export default analyticsApi;
