import axiosClient from './axiosClient';

export const repositoriesApi = {
  getRepositories: async ({ search, role, sortByPrs, pageNumber = 1, pageSize = 10 } = {}) => {
    const params = {};
    if (search) params.search = search;
    if (role && role !== 'All') params.role = role;
    if (sortByPrs && sortByPrs !== 'none') params.sortByPrs = sortByPrs;
    if (pageNumber) params.pageNumber = pageNumber;
    if (pageSize) params.pageSize = pageSize;

    const response = await axiosClient.get('/api/repositories', { params });
    return response.data?.data;
  },
};

export default repositoriesApi;
