import axiosClient from './axiosClient';

export const pullRequestsApi = {
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
