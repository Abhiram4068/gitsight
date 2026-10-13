import axiosClient, { BASE_URL } from './axiosClient';

export const authApi = {
  getToken: () => localStorage.getItem('gitsight_token'),
  getUsername: () => localStorage.getItem('gitsight_username'),

  loginWithGitHub: (prompt = 'select_account') => {
    // GitHub OAuth credentials
    const clientId = 'Ov23liSiGC4VzI0a4nAL';
    const redirectUri = `${BASE_URL}/api/auth/callback`;
    const state = Math.random().toString(36).substring(2);
    const scope = 'repo,read:user,user:email';

    // Using prompt=select_account forces GitHub to show the account picker
    // so the user can choose another existing account or sign into a new one.
    if (prompt) {
      window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&scope=${encodeURIComponent(scope)}&state=${state}&prompt=${encodeURIComponent(prompt)}`;
    } else {
      window.location.href = `${BASE_URL}/api/auth/login`;
    }
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
};

export default authApi;
