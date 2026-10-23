import axiosClient from './axiosClient';

export const rulesApi = {
  getAllRules: async () => {
    const response = await axiosClient.get('/api/rules');
    return response.data?.data;
  },

  getRepoRuleConfig: async (repoFullName) => {
    const response = await axiosClient.get('/api/rules/config', {
      params: { repo: repoFullName },
    });
    return response.data?.data;
  },

  applyRules: async ({ repositoryId, repositoryFullName, ruleIds }) => {
    const response = await axiosClient.post('/api/rules/config', {
      repositoryId,
      repositoryFullName,
      ruleIds,
    });
    return response.data;
  },
};

export default rulesApi;
