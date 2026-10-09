import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { pullRequestsApi } from '../api/pullRequests';
import { repositoriesApi } from '../api/repositories';
import { formatRelativeTime, formatDateTime } from '../utils/datetimeFormatter';
import StatusBadge from '../components/StatusBadge';

export default function PullRequests() {
  const [searchParams, setSearchParams] = useSearchParams();
  const repoFromUrl = searchParams.get('repo') || '';

  // Repositories state
  const [repositories, setRepositories] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(repoFromUrl);

  // Pull Requests state
  const [prs, setPrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'open' | 'merged' | 'closed'
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  // Fetch available repositories list
  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const data = await repositoriesApi.getRepositories({ pageSize: 100 });
        if (data && data.items && data.items.length > 0) {
          setRepositories(data.items);
          if (!selectedRepo) {
            const initial = repoFromUrl || data.items[0].fullName || data.items[0].name;
            setSelectedRepo(initial);
          }
        }
      } catch (err) {
        console.error('Failed to load repositories list:', err);
      }
    };
    fetchRepos();
  }, []);

  // Update selectedRepo when URL changes
  useEffect(() => {
    if (repoFromUrl && repoFromUrl !== selectedRepo) {
      setSelectedRepo(repoFromUrl);
      setCurrentPage(1);
    }
  }, [repoFromUrl]);

  // Fetch Pull Requests
  const fetchPullRequests = useCallback(async (isRefresh = false) => {
    if (!selectedRepo) return;

    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const data = await pullRequestsApi.getPullRequests({
        repoFullName: selectedRepo,
        state: statusFilter,
        search: searchQuery,
        pageNumber: currentPage,
        pageSize,
      });

      if (data && data.items) {
        setPrs(data.items);
        setTotalRecords(data.totalCount || data.items.length);
        setTotalPages(data.totalPages || Math.max(1, Math.ceil((data.totalCount || data.items.length) / pageSize)));
      } else {
        setPrs([]);
        setTotalRecords(0);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Failed to fetch pull requests:', err);
      setPrs([]);
      setTotalRecords(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedRepo, statusFilter, searchQuery, currentPage, pageSize]);

  useEffect(() => {
    fetchPullRequests();
  }, [fetchPullRequests]);

  // Handle repository change
  const handleRepoChange = (newRepo) => {
    setSelectedRepo(newRepo);
    setSearchParams({ repo: newRepo });
    setCurrentPage(1);
  };

  // Handle status tab change
  const handleStatusFilterChange = (newStatus) => {
    setStatusFilter(newStatus);
    setCurrentPage(1);
  };

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  return (
    <div>
      {/* Header section with repo switcher and refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-gray-200 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Link
              to="/repositories"
              className="text-xs  hover:text-gray-600 font-medium flex items-center space-x-1"
            >
              <span>&larr; Repositories</span>
            </Link>
          </div>

          <h1 className="text-lg font-bold text-gray-900 mt-1 flex items-center space-x-2">
            <span className="font-bold text-blue-700 ">Pull Requests </span>
            <span className="text-sm font-normal  px-2 py-0.5 ">
              {selectedRepo}
            </span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Review pull request diffs, automated AI suggestions, and manage approvals.
          </p>
        </div>

        {/* Right side controls: Repo selector and refresh */}
        <div className="flex items-center space-x-2 shrink-0">
          {repositories.length > 0 && (
            <div className="flex items-center space-x-1.5">
              <label className="text-xs text-gray-500 font-medium">Repo:</label>
              <select
                value={selectedRepo}
                onChange={(e) => handleRepoChange(e.target.value)}
                className="text-xs border border-gray-300 bg-white px-2.5 py-1.5 text-gray-800 focus:outline-none focus:border-gray-500 cursor-pointer max-w-[200px] truncate"
              >
                {repositories.map((r) => {
                  const val = r.fullName || r.name;
                  return (
                    <option key={r.id || val} value={val}>
                      {val}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          <button
            onClick={() => fetchPullRequests(true)}
            disabled={refreshing || loading}
            className="text-xs border bg-white border-gray-300 px-2.5 py-1.5 text-gray-600 hover:bg-gray-50 flex items-center space-x-1.5 transition-colors cursor-pointer"
            title="Refresh Pull Requests from GitHub"
          >
            <i className={`fa-solid fa-rotate-right text-xs ${refreshing ? 'animate-spin' : ''}`}></i>
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Controls Bar: Status Filter Tabs & Search Bar */}
      <div className="flex flex-wrap gap-3 items-center justify-between bg-gray-50 p-3 border border-gray-200 text-xs text-gray-700 border-t-0 border-b-0">
        {/* Status Tabs: All, Open, Merged, Closed */}
        <div className="flex items-center space-x-1 bg-white p-0.5 border border-gray-300 rounded">
          <button
            onClick={() => handleStatusFilterChange('all')}
            className={`px-3 py-1 font-medium rounded text-xs transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            All PRs
          </button>
          <button
            onClick={() => handleStatusFilterChange('open')}
            className={`px-3 py-1 font-medium rounded text-xs transition-colors cursor-pointer ${
              statusFilter === 'open'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Open
          </button>
          <button
            onClick={() => handleStatusFilterChange('merged')}
            className={`px-3 py-1 font-medium rounded text-xs transition-colors cursor-pointer ${
              statusFilter === 'merged'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Merged
          </button>
          <button
            onClick={() => handleStatusFilterChange('closed')}
            className={`px-3 py-1 font-medium rounded text-xs transition-colors cursor-pointer ${
              statusFilter === 'closed'
                ? 'bg-gray-800 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Closed
          </button>
        </div>

        {/* Search Filter */}
        <div className="flex-1 min-w-[220px] max-w-md relative">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-gray-400 text-xs"></i>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search PR title, author, branch, or #..."
            className="w-full pl-8 pr-3 py-1.5 border border-gray-300 bg-white text-gray-800 focus:outline-none focus:border-gray-500 text-xs"
          />
        </div>
      </div>

      {/* Table & Enclosed Stable Pagination Card */}
      <div className="border border-gray-200 overflow-hidden shadow-sm bg-white flex flex-col">
        {/* Scrollable table container */}
        <div className="overflow-x-auto overflow-y-auto max-h-[460px] min-h-[380px]">
          <table className="w-full text-left border-collapse bg-white text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold select-none shadow-[0_1px_2px_rgba(0,0,0,0.03)] text-xs">
              <tr>
                <th className="py-2.5 px-3 w-16 text-center">PR #</th>
                <th className="py-2.5 px-3">Title & Branches</th>
                <th className="py-2.5 px-3">Author</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Diff Changes</th>
                <th className="py-2.5 px-3">AI Analysis</th>
                <th className="py-2.5 px-3 text-center w-36">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-14 text-center text-xs text-gray-500">
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin mx-auto mb-2"></div>
                    Fetching pull requests for {selectedRepo}...
                  </td>
                </tr>
              ) : prs.length > 0 ? (
                prs.map((pr) => {
                  const isOpen = pr.state === 'open';
                  const isMerged = pr.isMerged || pr.state === 'merged';

                  return (
                    <tr key={pr.prNumber} className="hover:bg-gray-50/70 transition-colors">
                      {/* PR # */}
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-600 text-center">
                        <a
                          href={pr.htmlUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                          title="Open PR on GitHub"
                        >
                          #{pr.prNumber}
                        </a>
                      </td>

                      {/* Title & Branches */}
                      <td className="py-2.5 px-3 max-w-sm">
                        <Link
                          to={`/pr-detail?repo=${encodeURIComponent(selectedRepo)}&pr=${pr.prNumber}`}
                          className="font-semibold text-gray-900 hover:text-blue-600 transition-colors block truncate"
                          title={pr.title}
                        >
                          {pr.title}
                        </Link>
                        <div className="text-[11px] text-gray-400 font-mono mt-0.5 flex items-center space-x-1 truncate">
                          <span className="text-gray-600">{pr.headBranch || 'head'}</span>
                          <span>&rarr;</span>
                          <span className="text-gray-500">{pr.baseBranch || 'main'}</span>
                        </div>
                        {pr.labels && pr.labels.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {pr.labels.map((lbl, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded border border-gray-200"
                              >
                                {lbl}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Author */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {pr.authorAvatarUrl ? (
                            <img
                              src={pr.authorAvatarUrl}
                              alt={pr.author}
                              className="w-5 h-5 rounded-full border border-gray-200 object-cover"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-gray-200 text-gray-700 text-[10px] font-bold flex items-center justify-center">
                              {pr.author ? pr.author.charAt(0).toUpperCase() : 'U'}
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-800">{pr.author}</div>
                            <div className="text-[10px] text-gray-400" title={formatDateTime(pr.createdAt)}>
                              {formatRelativeTime(pr.createdAt)}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <StatusBadge state={pr.state} mergedAt={pr.mergedAt} isDraft={pr.isDraft} />
                        </div>
                      </td>

                      {/* Diff Changes */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px]">
                        <div>
                          <span className="text-emerald-600 font-semibold">+{pr.additions}</span>{' '}
                          <span className="text-red-600 font-semibold">-{pr.deletions}</span>
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {pr.changedFiles > 0 ? `${pr.changedFiles} files` : 'Diff ready'}
                        </div>
                      </td>

                      {/* AI Review Metadata */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          {pr.analysisStatus === 'analyzed' ? (
                            <span className="w-[76px] py-0.5 text-[11px] font-semibold text-emerald-800 bg-emerald-100 rounded-full inline-flex items-center justify-center border border-emerald-200 shadow-xs">
                              Analyzed
                            </span>
                          ) : pr.analysisStatus === 'analyzing' ? (
                            <span className="w-[76px] py-0.5 text-[11px] font-semibold text-blue-800 bg-blue-100 border border-blue-200 rounded-full inline-flex items-center justify-center shadow-xs">
                              <div className="w-2 h-2 border-[1.5px] border-blue-400 border-t-blue-800 rounded-full animate-spin mr-1.5"></div>
                              Analyzing
                            </span>
                          ) : pr.analysisStatus === 'failed' ? (
                            <span className="w-[76px] py-0.5 text-[11px] font-semibold text-red-800 bg-red-100 border border-red-200 rounded-full inline-flex items-center justify-center shadow-xs">
                              Failed
                            </span>
                          ) : (
                            <span className="w-[76px] py-0.5 text-[11px] font-semibold text-gray-700 bg-gray-100 border border-gray-200 rounded-full inline-flex items-center justify-center shadow-xs">
                              Pending
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-2">
                          <Link
                            to={`/pr-detail?repo=${encodeURIComponent(selectedRepo)}&pr=${pr.prNumber}`}
                            className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                          >
                            View pull request
                          </Link>
                          {pr.htmlUrl && (
                            <a
                              href={pr.htmlUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-gray-900 transition-colors inline-flex items-center"
                              title="View on GitHub"
                            >
                              <i className="fa-brands fa-github text-sm"></i>
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="py-14 text-center text-xs text-gray-500">
                    <i className="fa-solid fa-code-pull-request text-2xl text-gray-300 mb-2 block"></i>
                    No {statusFilter !== 'all' ? statusFilter : ''} pull requests found for {selectedRepo}.
                    {statusFilter !== 'all' && (
                      <div className="mt-2">
                        <button
                          onClick={() => handleStatusFilterChange('all')}
                          className="text-xs text-blue-600 hover:underline cursor-pointer"
                        >
                          View all pull requests &rarr;
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Stable Pagination Footer enclosed in the card so it never jerks */}
        <div className="border-t border-gray-200 bg-gray-50 px-3.5 py-2.5 flex items-center justify-between text-xs text-gray-600 select-none">
          <div className="flex items-center space-x-1.5">
            <span>
              Showing <span className="font-semibold text-gray-900">{totalRecords === 0 ? 0 : startIndex + 1}</span> to{' '}
              <span className="font-semibold text-gray-900">{Math.min(endIndex, totalRecords)}</span> of{' '}
              <span className="font-semibold text-gray-900">{totalRecords}</span> pull requests
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-gray-500 font-medium mr-1">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage <= 1 || loading}
              className="px-2.5 py-1 border border-gray-300 rounded bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
            >
              &larr; Prev
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage >= totalPages || loading}
              className="px-2.5 py-1 border border-gray-300 rounded bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
            >
              Next &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
