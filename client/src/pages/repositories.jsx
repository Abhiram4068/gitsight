import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { repositoriesApi } from '../api/repositories';
import { formatRelativeTime, formatDateTime } from '../utils/datetimeFormatter';

export default function Repositories() {
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-gray-900 leading-tight">
            {repositories.length} Repositories
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Repositories where you are Owner or Collaborator with Webhook active.
          </p>
        </div>
        <div className="mt-2 sm:mt-0">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="text-xs border bg-white border-gray-300 px-2.5 py-1 text-gray-600 hover:bg-gray-50 flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <i className={`fa-solid fa-rotate-right text-xs ${syncing ? 'animate-spin' : ''}`}></i>
            <span>{syncing ? 'Syncing...' : 'Resync Repositories'}</span>
          </button>
        </div>
      </div>

      {/* Controls Bar: Search, Role Filter, PRs Sort */}
      <div className="mb-4 flex flex-wrap gap-3 items-center justify-between bg-gray-50 p-3 border border-gray-200 text-xs text-gray-700">
        <div className="flex-1 min-w-[200px] relative">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-gray-400 text-xs"></i>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search repositories..."
            className="w-full pl-8 pr-3 py-1.5 border border-gray-300 bg-white text-gray-800 focus:outline-none focus:border-gray-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <label className="font-semibold text-gray-600">Type:</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="p-1.5 border border-gray-300 bg-white text-gray-800 focus:outline-none focus:border-gray-500 cursor-pointer"
          >
            <option value="All">All Repos</option>
            <option value="Public">Public</option>
            <option value="Private">Private</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <label className="font-semibold text-gray-600">Sort Open PRs:</label>
          <select
            value={sortByPrs}
            onChange={(e) => setSortByPrs(e.target.value)}
            className="p-1.5 border border-gray-300 bg-white text-gray-800 focus:outline-none focus:border-gray-500 cursor-pointer"
          >
            <option value="none">Default</option>
            <option value="desc">Highest PRs First</option>
            <option value="asc">Lowest PRs First</option>
          </select>
        </div>
      </div>

      {/* Table & Pagination Card: Enclosing sticky header, scrollable body, and stable footer */}
      <div className="border border-gray-200 overflow-hidden shadow-sm bg-white flex flex-col">
        {/* Scrollable records area */}
        <div className="overflow-x-auto overflow-y-auto max-h-[440px] min-h-[380px]">
          <table className="w-full text-left border-collapse bg-white text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold select-none shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
              <tr>
                <th className="py-2 px-3">Repository Name</th>
                <th className="py-2 px-3">Type</th>
                <th className="py-2 px-3">Active Open PRs</th>
                <th className="py-2 px-3">Last Updated</th>
                <th className="py-2 px-3 w-28 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-xs text-gray-500">
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin mx-auto mb-2"></div>
                    Loading repositories from GitSight API...
                  </td>
                </tr>
              ) : paginatedRepos.length > 0 ? (
                paginatedRepos.map((repo) => (
                  <tr key={repo.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-2 px-3 font-medium text-blue-600 hover:underline cursor-pointer">
                      <Link to="/pull-requests">{repo.name}</Link>
                    </td>
                    <td className="py-2 px-3 text-gray-600">{repo.role}</td>
                    <td className="py-2 px-3">
                      <div
                        className="text-blue-800 text-xs font-semibold px-2.5 py-1 inline-block"
                      >
                        {repo.openPrs} Open PR{repo.openPrs !== 1 ? 's' : ''}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-xs text-gray-500 whitespace-nowrap" title={repo.fullUpdatedAt}>
                      {repo.formattedUpdatedAt}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <Link
                        to="/pull-requests"
                        className="inline-block px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                      >
                        View  &rarr;
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-xs text-gray-500">
                    No repositories found matching your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Stable Pagination Footer enclosed in the card so it never jerks */}
        <div className="border-t border-gray-200 bg-gray-50 px-3.5 py-2.5 flex items-center justify-between text-xs text-gray-600 select-none">
          <div className="flex items-center space-x-2">
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
              disabled={currentPage === 1}
              className="px-2.5 py-1 border border-gray-300 rounded bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
            >
              &larr; Prev
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage >= totalPages}
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
