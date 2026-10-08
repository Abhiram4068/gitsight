import axiosClient from './axiosClient';

export const pullRequestsApi = {
  getPullRequests: async ({ owner, repo, repoFullName, repositoryId, state = 'all', search, pageNumber = 1, pageSize = 10 } = {}) => {
    const params = {};
    if (owner) params.owner = owner;
    if (repo) params.repo = repo;
    if (repoFullName) params.repoFullName = repoFullName;
    if (repositoryId) params.repositoryId = repositoryId;
    if (state) params.state = state;
    if (search) params.search = search;
    if (pageNumber) params.pageNumber = pageNumber;
    if (pageSize) params.pageSize = pageSize;

    const response = await axiosClient.get('/api/pullrequests', { params });
    return response.data?.data;
  },

  getPrDiff: async (pullRequestId) => {
    const response = await axiosClient.get(`/api/pullrequests/${pullRequestId}/diff`);
    return response.data?.data;
  },

  mergePullRequest: async ({ repositoryId, pullRequestNumber, mergeStrategy = 'squash', commitTitle }) => {
    const response = await axiosClient.post('/api/pullrequests/merge', {
      repositoryId,
      pullRequestNumber,
      mergeStrategy,
      commitTitle,
    });
    return response.data;
  },

  postReviewToGitHub: async (pullRequestId, { reviewSummary, event = 'COMMENT' } = {}) => {
    const response = await axiosClient.post(`/api/pullrequests/${pullRequestId}/post-review`, {
      pullRequestId,
      reviewSummary,
      event,
    });
    return response.data;
  },
};

export default pullRequestsApi;
