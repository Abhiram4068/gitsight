import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatRelativeTime, formatDateTime } from '../utils/datetimeFormatter';

// Generate some static dummy data
const MOCK_WEBHOOKS = Array.from({ length: 42 }).map((_, i) => {
  const id = `wh_${Math.random().toString(36).substring(2, 10)}`;
  const types = ['pull_request.opened', 'pull_request.synchronize', 'pull_request.closed', 'issue.opened'];
  const eventType = types[Math.floor(Math.random() * types.length)];
  const statuses = ['Success', 'Success', 'Success', 'Success', 'Failed', 'Pending'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const repos = ['fastapi-backend-service', 'react-frontend-app', 'gitsight-core'];
  const repo = repos[Math.floor(Math.random() * repos.length)];
  
  // subtract random minutes up to 7 days
  const date = new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000));
  
  return {
    id,
    eventType,
    repo,
    target: 'GitSight AI Engine',
    status,
    triggeredAt: date.toISOString(),
  };
}).sort((a, b) => new Date(b.triggeredAt) - new Date(a.triggeredAt));

export default function Webhooks() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  
  const pageSize = 10;
  
  // Filter data
  const filteredWebhooks = MOCK_WEBHOOKS.filter(wh => 
    wh.eventType.toLowerCase().includes(searchQuery.toLowerCase()) || 
    wh.repo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    wh.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRecords = filteredWebhooks.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentWebhooks = filteredWebhooks.slice(startIndex, endIndex);

  // Calculate up to 3 pagination buttons
  const getPageNumbers = () => {
    let pages = [];
    if (totalPages <= 3) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage === 1) {
        pages = [1, 2, 3];
      } else if (currentPage === totalPages) {
        pages = [totalPages - 2, totalPages - 1, totalPages];
      } else {
        pages = [currentPage - 1, currentPage, currentPage + 1];
      }
    }
    return pages;
  };

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
            <span className="font-bold text-gray-900">Webhooks</span>
          </nav>
          <h1 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
            <span className="font-bold text-blue-700">Webhooks</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Monitor incoming events and automated AI review triggers.
          </p>
        </div>
        
        <div className="flex items-center space-x-2 shrink-0">
          <button
            className="text-xs border bg-white border-gray-300 px-2.5 py-1.5 text-gray-600 hover:bg-gray-50 flex items-center space-x-1.5 transition-colors cursor-pointer"
            title="Refresh Webhooks"
          >
            <i className="fa-solid fa-rotate-right text-xs"></i>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* GitHub Webhook Setup Instructions */}
      <div className="mt-3">
        <button 
          onClick={() => setShowInstructions(!showInstructions)}
          className="flex items-center justify-between text-xs font-semibold text-amber-700 bg-amber-50/50 px-4 py-2.5 border border-amber-200 rounded-sm hover:bg-amber-100/50 transition-colors cursor-pointer w-full text-left shadow-sm"
        >
          <div className="flex items-center space-x-2">
            <i className="fa-solid fa-bolt"></i>
            <span>How to automate your PRs using GitHub Webhooks</span>
          </div>
          <i className={`fa-solid fa-chevron-${showInstructions ? 'up' : 'down'}`}></i>
        </button>
        
        <div 
          className={`grid transition-all duration-300 ease-in-out ${
            showInstructions ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0 mt-0'
          }`}
        >
          <div className="overflow-hidden">
            <div className="p-5 bg-amber-50/40 border border-amber-200 rounded-sm text-xs text-amber-900 space-y-3 shadow-sm">
              <h3 className="font-bold text-sm mb-2 flex items-center space-x-2">
                <i className="fa-brands fa-github text-base"></i>
                <span>GitHub Setup Instructions</span>
              </h3>
              <ol className="list-decimal pl-5 space-y-2.5 font-medium leading-relaxed">
                <li>Navigate to your GitHub Repository and click on <strong>Settings</strong>.</li>
                <li>Select <strong>Webhooks</strong> from the left sidebar and click the <strong>Add webhook</strong> button.</li>
                <li>
                  Set the <span className="font-bold">Payload URL</span> to your GitSight endpoint:
                  <code className="bg-amber-200/40 border border-amber-300/50 px-1.5 py-0.5 rounded text-[11px] ml-2 select-all text-amber-800">
                    https://api.gitsight.app/webhooks/github
                  </code>
                </li>
                <li>Set <span className="font-bold">Content type</span> to <strong>application/json</strong>.</li>
                <li>Under "Which events would you like to trigger this webhook?", select <strong>Let me select individual events</strong>.</li>
                <li>Check the boxes for <strong>Pull requests</strong> and <strong>Issue comments</strong>.</li>
                <li>Click <strong>Add webhook</strong> to save your configuration.</li>
              </ol>
              <div className="mt-3 pt-3 border-t border-amber-200/60 flex items-center space-x-2 text-amber-700">
                <i className="fa-solid fa-circle-info"></i>
                <p className="italic">
                  Once configured, GitSight will automatically trigger AI reviews on newly opened or synchronized pull requests!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Bar: Search Bar */}
      <div className="flex items-center bg-gray-50 p-3 border border-gray-200 text-xs text-gray-700 border-b-0 mt-3 rounded-t-sm shadow-sm">
        <div className="flex-1 max-w-md relative">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-gray-400 text-xs"></i>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by ID, event type, or repo..."
            className="w-full pl-8 pr-3 py-1.5 border border-gray-300 bg-white text-gray-800 focus:outline-none focus:border-gray-500 text-xs"
          />
        </div>
      </div>

      {/* Table & Pagination Card */}
      <div className="border border-gray-200 overflow-hidden shadow-sm bg-white flex flex-col">
        {/* Scrollable table container */}
        <div className="overflow-x-auto overflow-y-auto max-h-[500px] min-h-[380px]">
          <table className="w-full text-left border-collapse bg-white text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold select-none shadow-[0_1px_2px_rgba(0,0,0,0.03)] text-xs">
              <tr>
                <th className="py-2.5 px-4">Webhook ID</th>
                <th className="py-2.5 px-4">Event Type</th>
                <th className="py-2.5 px-4">Repository</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Triggered At</th>
                <th className="py-2.5 px-4 text-center w-28">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700 text-xs">
              {currentWebhooks.length > 0 ? (
                currentWebhooks.map((wh) => (
                  <tr key={wh.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-medium text-gray-900">
                      {wh.id}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[11px] border border-blue-100">
                        {wh.eventType}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-medium text-gray-800">
                      {wh.repo}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      {wh.status === 'Success' ? (
                        <span className="inline-flex items-center text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px] font-semibold border border-emerald-200">
                          <i className="fa-solid fa-check mr-1 text-[10px]"></i> Success
                        </span>
                      ) : wh.status === 'Failed' ? (
                        <span className="inline-flex items-center text-red-700 bg-red-50 px-2 py-0.5 rounded-full text-[11px] font-semibold border border-red-200">
                          <i className="fa-solid fa-xmark mr-1 text-[10px]"></i> Failed
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-[11px] font-semibold border border-amber-200">
                          <i className="fa-solid fa-spinner fa-spin mr-1 text-[10px]"></i> Pending
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-gray-800" title={formatDateTime(wh.triggeredAt)}>
                        {formatRelativeTime(wh.triggeredAt)}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-center whitespace-nowrap">
                      <button className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer">
                        View Payload
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-14 text-center text-xs text-gray-500">
                    <i className="fa-solid fa-network-wired text-2xl text-gray-300 mb-2 block"></i>
                    No webhooks found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Stable Pagination Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-4 py-2.5 flex items-center justify-between text-xs text-gray-600 select-none">
          <div className="flex items-center space-x-1.5">
            <span>
              Showing <span className="font-semibold text-gray-900">{totalRecords === 0 ? 0 : startIndex + 1}</span> to{' '}
              <span className="font-semibold text-gray-900">{Math.min(endIndex, totalRecords)}</span> of{' '}
              <span className="font-semibold text-gray-900">{totalRecords}</span> webhooks
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage <= 1}
              className="px-2.5 py-1 border border-gray-300 rounded bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
            >
              &larr; Prev
            </button>
            
            {/* Numbered pagination buttons */}
            <div className="flex items-center space-x-1 px-1">
              {getPageNumbers().map(pageNum => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-7 h-7 flex items-center justify-center border rounded text-xs font-medium transition-colors cursor-pointer ${
                    currentPage === pageNum 
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm' 
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>

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
