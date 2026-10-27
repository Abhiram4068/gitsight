import axiosClient, { BASE_URL } from './axiosClient';

export const authApi = {
  getToken: () => localStorage.getItem('gitsight_token'),
  getUsername: () => localStorage.getItem('gitsight_username'),
 
  loginWithGitHub: (prompt = 'select_account') => {
    const url = prompt
      ? `${BASE_URL}/api/auth/login?prompt=${encodeURIComponent(prompt)}`
      : `${BASE_URL}/api/auth/login`;
    window.location.href = url;
  },

  logout: () => {
    localStorage.removeItem('gitsight_token');
    localStorage.removeItem('gitsight_username');
    localStorage.removeItem('gitsight_user');
    window.location.href = '/login';
  },

  getCurrentUser: async () => {
    const token = localStorage.getItem('gitsight_token');
    if (!token) return null;

    try {
      const response = await axiosClient.get('/api/auth/me');
      // response.data matches ApiResponse<UserProfileDto> from backend
      return response.data?.data || null;
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      return null;
    }
  },

  toggleEmailNotifications: async () => {
    try {
      const response = await axiosClient.post('/api/auth/toggle-email');
      return response.data?.data || null;
    } catch (err) {
      console.error('Failed to toggle email notifications:', err);
      throw err;
    }
  },

  toggleEmail: async () => {
    try {
      const response = await axiosClient.post('/api/auth/toggle-email');
      return response.data?.data || null;
    } catch (err) {
      console.error('Failed to toggle email notifications:', err);
      throw err;
    }
  },
};

export default authApi;
