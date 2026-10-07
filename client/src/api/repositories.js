import axiosClient from './axiosClient';

export const repositoriesApi = {
  getRepositories: async ({ pageNumber = 1, pageSize = 10, search = '' } = {}) => {
    const response = await axiosClient.get('/api/repositories', {
      params: { pageNumber, pageSize, search: search || undefined },
    });
    return response.data?.data;
  },
};

export default repositoriesApi;
