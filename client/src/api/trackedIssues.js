import axiosClient from './axiosClient';

export const trackedIssuesApi = {
  trackIssues: async ({ pullRequestNumber, sessionId }) => {
    const response = await axiosClient.post('/api/trackedissues', {
      pullRequestNumber,
      sessionId,
    });
    return response.data;
  },

  untrackIssues: async ({ pullRequestNumber, sessionId }) => {
    const response = await axiosClient.delete('/api/trackedissues', {
      data: {
        pullRequestNumber,
        sessionId,
      }
    });
    return response.data;
  },

  getTrackedPrs: async (search = '') => {
    const params = search ? { search } : {};
    const response = await axiosClient.get('/api/trackedissues/prs', { params });
    return response.data?.data || [];
  },

  getTrackedIssuesForPr: async ({ prNumber, search, status, severity, issueType }) => {
    const params = {};
    if (search) params.search = search;
    if (status && status !== 'all') params.status = status;
    if (severity && severity !== 'all') params.severity = severity;
    if (issueType && issueType !== 'all') params.issueType = issueType;

    const response = await axiosClient.get(`/api/trackedissues/prs/${prNumber}/issues`, { params });
    return response.data?.data || [];
  },

  updateIssueStatus: async (id, status) => {
    const response = await axiosClient.patch(`/api/trackedissues/${id}/status`, { status });
    return response.data?.data;
  }
};

export default trackedIssuesApi;
