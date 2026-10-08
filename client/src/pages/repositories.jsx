import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { repositoriesApi } from '../api/repositories';
import { formatRelativeTime, formatDateTime } from '../utils/datetimeFormatter';

export default function Repositories() {
  const navigate = useNavigate();
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  
  // Search, Filter, and Sort States
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [sortByPrs, setSortByPrs] = useState('none'); // 'none' | 'desc' | 'asc'
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchRepos = async () => {
    try {
      setLoading(true);
      const data = await repositoriesApi.getRepositories({ search: searchQuery });
      if (data && data.items && data.items.length > 0) {
        setRepositories(
          data.items.map((r) => ({
            id: r.id || r.gitHubRepoId,
            name: r.fullName || r.name,
            role: r.isPrivate ? 'Private' : 'Public',
            openPrs: r.openPrCount || 0,
            webhookSecret: 'whsec_••••••••',
            status: r.isTracked ? 'active' : 'inactive',
            rawUpdatedAt: r.updatedAt,
            formattedUpdatedAt: formatRelativeTime(r.updatedAt),
            fullUpdatedAt: formatDateTime(r.updatedAt),
          }))
        );
      } else {
        // Fallback default sample data if user hasn't imported any repos yet
        setRepositories([
          {
            id: 1,
            name: 'org-dev/fastapi-backend-service',
            role: 'Public',
            openPrs: 3,
            webhookSecret: 'whsec_8a92...f72',
            status: 'active',
            formattedUpdatedAt: '2h ago',
            fullUpdatedAt: 'Oct 7, 2026, 6:00 PM',
          },
          {
            id: 2,
            name: 'org-dev/react-frontend-app',
            role: 'Private',
            openPrs: 1,
            webhookSecret: 'whsec_1b44...e88',
            status: 'active',
            formattedUpdatedAt: '1d ago',
            fullUpdatedAt: 'Oct 6, 2026, 2:30 PM',
          },
        ]);
      }
    } catch (err) {
      console.error('Failed to fetch repositories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepos();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    await fetchRepos();
    setSyncing(false);
  };

  // Filter and Sort Logic
  const filteredAndSortedRepos = useMemo(() => {
    return repositories
      .filter((repo) => {
        const matchesSearch = repo.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === 'All' || repo.role === roleFilter;
        return matchesSearch && matchesRole;
      })
      .sort((a, b) => {
        if (sortByPrs === 'desc') {
          return b.openPrs - a.openPrs;
        } else if (sortByPrs === 'asc') {
          return a.openPrs - b.openPrs;
        }
        return 0;
      });
  }, [repositories, searchQuery, roleFilter, sortByPrs]);

  // Reset pagination to first page when search, filter, or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, sortByPrs]);

  const totalRecords = filteredAndSortedRepos.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  const paginatedRepos = useMemo(() => {
    return filteredAndSortedRepos.slice(startIndex, endIndex);
  }, [filteredAndSortedRepos, startIndex, endIndex]);

  return (
    <div>
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 pb-3 border-b border-gray-200 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigate('/')}
              className="text-xs hover:text-gray-600 font-medium flex items-center space-x-1 cursor-pointer"
            >
              <span>&larr; Dashboard</span>
            </button>
          </div>

          <h1 className="text-lg font-bold text-gray-900 mt-1 flex items-center space-x-2">
            <span className="font-bold text-blue-700">Repositories</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Repositories where you are Owner or Collaborator.
          </p>
        </div>

        {/* Right side controls: Refresh */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleSync}
            disabled={syncing || loading}
            className="text-xs border bg-white border-gray-300 px-2.5 py-1.5 text-gray-600 hover:bg-gray-50 flex items-center space-x-1.5 transition-colors cursor-pointer"
            title="Refresh Repositories from GitHub"
          >
            <i className={`fa-solid fa-rotate-right text-xs ${syncing ? 'animate-spin' : ''}`}></i>
            <span>{syncing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Controls Bar: Type Filter Tabs & Search Bar */}
      <div className="mb-4 flex flex-wrap gap-3 items-center justify-between bg-gray-50 p-3 border border-gray-200 text-xs text-gray-700">
        {/* Type Tabs: All, Public, Private */}
        <div className="flex items-center space-x-1 bg-white p-0.5 border border-gray-300 rounded">
          {['All', 'Public', 'Private'].map((type) => (
            <button
              key={type}
              onClick={() => setRoleFilter(type)}
              className={`px-3 py-1 font-medium rounded text-xs transition-colors cursor-pointer ${
                roleFilter === type
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {type === 'All' ? 'All Repos' : type}
            </button>
          ))}
        </div>

        {/* Search Input & Sort Selector */}
        <div className="flex flex-1 min-w-[220px] max-w-md relative items-center gap-3">
          <div className="relative flex-1">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-gray-400 text-xs"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search repository name..."
              className="w-full pl-8 pr-3 py-1.5 border border-gray-300 bg-white text-gray-800 focus:outline-none focus:border-gray-500 text-xs"
            />
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            <label className="text-xs text-gray-500 font-medium whitespace-nowrap">Sort PRs:</label>
            <select
              value={sortByPrs}
              onChange={(e) => setSortByPrs(e.target.value)}
              className="text-xs border border-gray-300 bg-white px-2.5 py-1.5 text-gray-800 focus:outline-none focus:border-gray-500 cursor-pointer"
            >
              <option value="none">Default</option>
              <option value="desc">Highest First</option>
              <option value="asc">Lowest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table & Enclosed Stable Pagination Card */}
      <div className="border border-gray-200 overflow-hidden shadow-sm bg-white flex flex-col">
        {/* Scrollable table container */}
        <div className="overflow-x-auto overflow-y-auto max-h-[460px] min-h-[380px]">
          <table className="w-full text-left border-collapse bg-white text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold select-none shadow-[0_1px_2px_rgba(0,0,0,0.03)] text-xs">
              <tr>
                <th className="py-2.5 px-3">Repository Name</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Active Open PRs</th>
                <th className="py-2.5 px-3">Last Updated</th>
                <th className="py-2.5 px-3 text-center w-36">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-14 text-center text-xs text-gray-500">
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin mx-auto mb-2"></div>
                    Loading repositories...
                  </td>
                </tr>
              ) : paginatedRepos.length > 0 ? (
                paginatedRepos.map((repo) => (
                  <tr key={repo.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-gray-900 hover:text-blue-600">
                      <Link
                        to={`/pull-requests?repo=${encodeURIComponent(repo.name)}`}
                        className="flex items-center space-x-2 hover:underline"
                      >
                        <i className="fa-regular fa-folder text-gray-400 text-sm"></i>
                        <span>{repo.name}</span>
                      </Link>
                    </td>
                    <td className="py-2.5 px-3">
                      {repo.role === 'Private' ? (
                        <span className="w-[68px] py-0.5 text-[11px] font-semibold text-gray-800 inline-flex items-center justify-center shadow-xs">
                          Private
                        </span>
                      ) : (
                        <span className="w-[68px] py-0.5 text-[11px] font-semibold text-blue-600 inline-flex items-center justify-center shadow-xs">
                          Public
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-gray-900">
                        {repo.openPrs} <span className="text-gray-500 font-normal">Open PR{repo.openPrs !== 1 ? 's' : ''}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap" title={repo.fullUpdatedAt}>
                      {repo.formattedUpdatedAt}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-2">
                        <Link
                          to={`/pull-requests?repo=${encodeURIComponent(repo.name)}`}
                          className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                        >
                          View pull requests
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-14 text-center text-xs text-gray-500">
                    <i className="fa-regular fa-folder-open text-2xl text-gray-300 mb-2 block"></i>
                    No repositories found matching your search or filter.
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
              <span className="font-semibold text-gray-900">{totalRecords}</span> repositories
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