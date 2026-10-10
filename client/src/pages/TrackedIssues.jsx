import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { trackedIssuesApi } from '../api/trackedIssues';
import { formatRelativeTime, formatDateTime } from '../utils/datetimeFormatter';
import StatusBadge from '../components/StatusBadge';

export default function TrackedIssues() {
  const [searchParams, setSearchParams] = useSearchParams();
  const prFromUrl = searchParams.get('pr') ? parseInt(searchParams.get('pr'), 10) : null;
  const repoFromUrl = searchParams.get('repo') || '';

  // Tracked PRs state
  const [trackedPrs, setTrackedPrs] = useState([]);
  const [selectedPr, setSelectedPr] = useState(null);
  const [prSearch, setPrSearch] = useState('');
  const [isPrDropdownOpen, setIsPrDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Tracked Issues state
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'Opened' | 'InProgress' | 'Resolved' | 'Closed'
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingIssueId, setUpdatingIssueId] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Fetch Tracked PRs
  useEffect(() => {
    const fetchPrs = async () => {
      try {
        const prs = await trackedIssuesApi.getTrackedPrs(prSearch);
        setTrackedPrs(prs);
        
        // Auto-select PR if none selected
        if (!selectedPr && prs.length > 0) {
          if (prFromUrl && repoFromUrl) {
            const matched = prs.find(p => p.prNumber === prFromUrl && `${p.owner}/${p.repo}` === repoFromUrl);
            if (matched) setSelectedPr(matched);
            else setSelectedPr(prs[0]);
          } else {
            setSelectedPr(prs[0]);
          }
        } else if (!selectedPr && prs.length === 0 && !prSearch) {
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load tracked PRs:', err);
        setLoading(false);
      }
    };
    
    // Debounce the search
    const delayDebounceFn = setTimeout(() => {
      fetchPrs();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [prSearch]);

  // Click outside listener for dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsPrDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch Tracked Issues
  const fetchTrackedIssues = useCallback(async (isRefresh = false) => {
    if (!selectedPr) return;

    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const data = await trackedIssuesApi.getTrackedIssuesForPr({
        prNumber: selectedPr.prNumber,
        search: searchQuery,
        status: statusFilter,
        severity: 'all',
        issueType: 'all'
      });

      setIssues(data);
    } catch (err) {
      console.error('Failed to fetch tracked issues:', err);
      setIssues([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedPr, statusFilter, searchQuery]);

  useEffect(() => {
    fetchTrackedIssues();
    setCurrentPage(1);
  }, [fetchTrackedIssues]);

  // Handle PR selection
  const handlePrSelect = (pr) => {
    setSelectedPr(pr);
    setSearchParams({ repo: `${pr.owner}/${pr.repo}`, pr: pr.prNumber });
    setIsPrDropdownOpen(false);
  };

  // Handle status tab change
  const handleStatusFilterChange = (newStatus) => {
    setStatusFilter(newStatus);
    setCurrentPage(1);
  };

  // Handle inline status update
  const handleStatusUpdate = async (issueId, newStatus) => {
    try {
      setUpdatingIssueId(issueId);
      await trackedIssuesApi.updateIssueStatus(issueId, newStatus);
      // Optimistically update the UI or fetch again. Let's fetch again to ensure consistency.
      await fetchTrackedIssues();
    } catch (err) {
      console.error('Failed to update issue status:', err);
    } finally {
      setUpdatingIssueId(null);
    }
  };

  // Pagination computations
  const totalRecords = issues.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedIssues = issues.slice(startIndex, endIndex);

  return (
    <div>
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-gray-200 gap-3">
        <div>
          <nav className="flex items-center space-x-1.5 text-xs text-gray-500 mb-1">
            <Link to="/" className="hover:underline hover:text-gray-900 cursor-pointer transition-colors">
              Dashboard
            </Link>
            <span className="text-gray-400">&gt;</span>
            <span className="font-bold text-gray-900">Tracked Issues</span>
          </nav>
          <h1 className="text-lg font-bold text-gray-900 mt-1 flex items-center space-x-2">
            <span className="font-bold text-blue-700">Tracked Issues</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Monitor, triage, and follow lifecycle workflows for AI-flagged code issues and suggestions.
          </p>
        </div>

        {/* Right side controls: Custom PR selector and refresh */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="relative" ref={dropdownRef}>
            <div 
              className="flex items-center justify-between w-[350px] text-xs border border-gray-300 bg-white px-3 py-1.5 text-gray-800 cursor-pointer hover:border-gray-400 rounded-sm"
              onClick={() => setIsPrDropdownOpen(!isPrDropdownOpen)}
            >
              <div className="truncate">
                {selectedPr ? (
                  <span className="font-medium">
                    {selectedPr.owner}/{selectedPr.repo} <span className="text-blue-600">#{selectedPr.prNumber}</span>
                  </span>
                ) : (
                  <span className="text-gray-500">Select a tracked PR...</span>
                )}
              </div>
              <i className={`fa-solid fa-chevron-down text-gray-400 transition-transform ${isPrDropdownOpen ? 'rotate-180' : ''}`}></i>
            </div>
            
            {isPrDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 shadow-lg rounded-sm z-50">
                <div className="p-2 border-b border-gray-200">
                  <div className="relative">
                    <i className="fa-solid fa-magnifying-glass absolute left-2 top-2 text-gray-400 text-[10px]"></i>
                    <input
                      type="text"
                      value={prSearch}
                      onChange={(e) => setPrSearch(e.target.value)}
                      placeholder="Search owner, repo, or PR #..."
                      className="w-full pl-6 pr-2 py-1.5 text-xs border border-gray-200 focus:outline-none focus:border-blue-400 rounded-sm"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {trackedPrs.length > 0 ? (
                    trackedPrs.map((pr) => (
                      <div 
                        key={`${pr.owner}/${pr.repo}/${pr.prNumber}`}
                        onClick={() => handlePrSelect(pr)}
                        className={`px-3 py-2 text-xs cursor-pointer hover:bg-blue-50 border-b border-gray-50 last:border-0 ${
                          selectedPr?.prNumber === pr.prNumber ? 'bg-blue-50/50 text-blue-700 font-medium' : 'text-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate mr-2">{pr.owner}/{pr.repo}</span>
                          <span className="shrink-0">#{pr.prNumber}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          Tracked: {formatRelativeTime(pr.trackedAt)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-center text-xs text-gray-500">
                      No tracked PRs found.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => fetchTrackedIssues(true)}
            disabled={refreshing || loading || !selectedPr}
            className="text-xs border bg-white border-gray-300 px-2.5 py-1.5 text-gray-600 hover:bg-gray-50 flex items-center space-x-1.5 transition-colors cursor-pointer rounded-sm"
            title="Refresh Tracked Issues"
          >
            <i className={`fa-solid fa-rotate-right text-xs ${refreshing ? 'animate-spin' : ''}`}></i>
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Controls Bar: Status Filter Tabs & Search Bar */}
      <div className="flex flex-wrap gap-3 items-center justify-between bg-gray-50 p-3 border border-gray-200 text-xs text-gray-700 border-t-0 border-b-0">
        {/* Status Tabs */}
        <div className="flex items-center space-x-1 bg-white p-0.5 border border-gray-300 rounded">
          {['all', 'Opened', 'InProgress', 'Resolved', 'Closed'].map((status) => (
            <button
              key={status}
              onClick={() => handleStatusFilterChange(status)}
              className={`px-2.5 py-1 font-medium rounded text-xs transition-colors cursor-pointer ${
                statusFilter.toLowerCase() === status.toLowerCase()
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {status === 'all' ? 'All Issues' : status === 'InProgress' ? 'In Progress' : status}
            </button>
          ))}
        </div>

        {/* Search Filter */}
        <div className="flex-1 min-w-[220px] max-w-md relative">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-gray-400 text-xs"></i>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search file path, comment, or issue type..."
            className="w-full pl-8 pr-3 py-1.5 border border-gray-300 bg-white text-gray-800 focus:outline-none focus:border-gray-500 text-xs rounded-sm"
          />
        </div>
      </div>

      {/* Table & Enclosed Stable Pagination Card */}
      <div className="border border-gray-200 overflow-hidden shadow-sm bg-white flex flex-col">
        {/* Scrollable table container */}
        <div className="overflow-x-auto overflow-y-auto max-h-[500px] min-h-[380px]">
          <table className="w-full text-left border-collapse bg-white text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold select-none shadow-[0_1px_2px_rgba(0,0,0,0.03)] text-xs">
              <tr>
                <th className="py-2 px-2 w-16 text-left">PR</th>
                <th className="py-2 px-2 text-left">File & Lines</th>
                <th className="py-2 px-2 text-left">Type / Severity</th>
                <th className="py-2 px-2 w-1/3 text-left">Comment</th>
                <th className="py-2 px-2 text-left">Status</th>
                <th className="py-2 px-2 text-left">Opened</th>
                <th className="py-2 px-2 text-left">Updated</th>
                <th className="py-2 px-2 text-left w-24">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-14 text-center text-xs text-gray-500">
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin mx-auto mb-2"></div>
                    Loading tracked issues...
                  </td>
                </tr>
              ) : !selectedPr ? (
                <tr>
                  <td colSpan="8" className="py-14 text-center text-xs text-gray-500">
                    <i className="fa-solid fa-code-pull-request text-2xl text-gray-300 mb-2 block"></i>
                    Please select a Pull Request to view its tracked issues.
                  </td>
                </tr>
              ) : paginatedIssues.length > 0 ? (
                paginatedIssues.map((issue) => {
                  const severityColor =
                    issue.severity === 'Critical'
                      ? 'text-red-800 border-red-200'
                      : issue.severity === 'High'
                      ? ' text-orange-800 border-orange-200'
                      : issue.severity === 'Medium'
                      ? 'text-yellow-800 border-yellow-200'
                      : 'text-blue-800 border-blue-200';

                  return (
                    <tr key={issue.id} className="hover:bg-gray-50/70 transition-colors">
                      {/* PR Number */}
                      <td className="py-1.5 px-2 font-mono font-bold text-blue-600 text-left">
                        <Link
                          to={`/pr-detail?repo=${encodeURIComponent(`${selectedPr.owner}/${selectedPr.repo}`)}&pr=${issue.pullRequestNumber}`}
                          className="hover:underline"
                          title="View PR Details"
                        >
                          #{issue.pullRequestNumber}
                        </Link>
                      </td>

                      {/* File Path & Line Range */}
                      <td className="py-1.5 px-2">
                        <div className="font-mono font-medium text-gray-900 truncate max-w-[200px]" title={issue.filePath}>
                          {issue.filePath}
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                          Lines {issue.startLine} &ndash; {issue.endLine}
                        </div>
                      </td>

                      {/* Type / Severity */}
                      <td className="py-1.5 px-2 whitespace-nowrap">
                        <div className="flex flex-row items-center space-x-1.5">
                          <span className="font-medium text-gray-800">{issue.issueType}</span>
                          <span className="text-gray-400">/</span>
                          <span className={`w-fit px-1.5 py-0.2 text-[10px] font-semibold  ${severityColor}`}>
                            {issue.severity}
                          </span>
                        </div>
                      </td>

                      {/* Comment */}
                      <td className="py-1.5 px-2 max-w-[280px]">
                        <div className="line-clamp-2 text-gray-700 leading-relaxed" title={issue.comment}>
                          {issue.comment}
                        </div>
                      </td>

                      {/* Workflow Status */}
                      <td className="py-1.5 px-2 whitespace-nowrap">
                        <div className="relative inline-flex items-center">
                          <select
                            value={issue.status}
                            onChange={(e) => handleStatusUpdate(issue.id, e.target.value)}
                            disabled={updatingIssueId === issue.id}
                            className={`w-[85px] py-0.5 px-2 text-[11px] font-semibold text-white rounded-full shadow-xs capitalize cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 appearance-none text-center ${
                              issue.status === 'Opened' ? 'bg-emerald-600' :
                              issue.status === 'InProgress' ? 'bg-blue-500' :
                              issue.status === 'Resolved' ? 'bg-purple-600' :
                              'bg-gray-500'
                            } ${updatingIssueId === issue.id ? 'opacity-50' : 'hover:opacity-90 transition-opacity'}`}
                          >
                            <option value="Opened" className="text-gray-900 bg-white">Open</option>
                            <option value="InProgress" className="text-gray-900 bg-white">In Progress</option>
                            <option value="Resolved" className="text-gray-900 bg-white">Resolved</option>
                            <option value="Closed" className="text-gray-900 bg-white">Closed</option>
                          </select>
                          {updatingIssueId === issue.id && (
                            <i className="fa-solid fa-spinner fa-spin absolute -right-5 text-blue-600 text-[10px]"></i>
                          )}
                        </div>
                      </td>

                      {/* Opened Timestamp */}
                      <td className="py-1.5 px-2 whitespace-nowrap text-gray-500">
                        <div title={formatRelativeTime(issue.openedAt)}>
                          {formatDateTime(issue.openedAt)}
                        </div>
                      </td>

                      {/* Updated Timestamp */}
                      <td className="py-1.5 px-2 whitespace-nowrap text-gray-500">
                        <div title={formatRelativeTime(issue.updatedAt)}>
                          {formatDateTime(issue.updatedAt)}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-1.5 px-2 text-left whitespace-nowrap">
                        <Link
                          to={`/pr-ai-insights?repo=${encodeURIComponent(`${selectedPr.owner}/${selectedPr.repo}`)}&pr=${issue.pullRequestNumber}&issue=${issue.aiReviewIssueId}&from=tracked`}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                        >
                          View issue
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="py-14 text-center text-xs text-gray-500">
                    <i className="fa-solid fa-shield-halved text-2xl text-gray-300 mb-2 block"></i>
                    No tracked issues found matching your filters for this PR.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Stable Pagination Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-3.5 py-2.5 flex items-center justify-between text-xs text-gray-600 select-none">
          <div className="flex items-center space-x-1.5">
            <span>
              Showing <span className="font-semibold text-gray-900">{totalRecords === 0 ? 0 : startIndex + 1}</span> to{' '}
              <span className="font-semibold text-gray-900">{Math.min(endIndex, totalRecords)}</span> of{' '}
              <span className="font-semibold text-gray-900">{totalRecords}</span> tracked issues
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