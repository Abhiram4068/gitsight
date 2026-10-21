import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { formatRelativeTime, formatDateTime } from '../utils/datetimeFormatter';

const MOCK_PIPELINES = [
  {
    id: 'pipe_1',
    projectName: 'ruby-ci-demo',
    buildNumber: 6,
    status: 'Success',
    workflow: 'run-tests',
    branch: 'main',
    commitHash: 'fc239cc',
    commitMessage: 'install latest version of ubuntu as...',
    authorName: 'GitSight AI',
    startedAt: new Date(Date.now() - 60000).toISOString(),
    duration: '13s',
  },
  {
    id: 'pipe_2',
    projectName: 'ruby-ci-demo',
    buildNumber: 5,
    status: 'Success',
    workflow: 'test-app-on-diff-os',
    branch: 'main',
    commitHash: 'fc239cc',
    commitMessage: 'install latest version of ubuntu as...',
    authorName: 'GitSight AI',
    startedAt: new Date(Date.now() - 3600000).toISOString(),
    duration: '13s',
  },
  {
    id: 'pipe_3',
    projectName: 'ruby-ci-demo',
    buildNumber: 4,
    status: 'Success',
    workflow: 'build_workflow',
    branch: 'main',
    commitHash: 'fc239cc',
    commitMessage: 'install latest version of ubuntu as...',
    authorName: 'GitSight AI',
    startedAt: new Date(Date.now() - 7200000).toISOString(),
    duration: '4s',
  },
];

export default function Pipelines() {
  const [searchParams, setSearchParams] = useSearchParams();
  const projectFromUrl = searchParams.get('project') || 'ruby-ci-demo';

  const [selectedProject, setSelectedProject] = useState(projectFromUrl);
  const [pipelineScope, setPipelineScope] = useState("Everyone's Pipelines");
  const [branchFilter, setBranchFilter] = useState('Select a Branch');
  const [dateFilter, setDateFilter] = useState('All days');
  const [autoExpand, setAutoExpand] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 10;

  const filteredPipelines = MOCK_PIPELINES.filter(p =>
    p.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.workflow.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.branch.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRecords = filteredPipelines.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentPipelines = filteredPipelines.slice(startIndex, endIndex);

  return (
    <div>
      {/* Header Section with exact breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-gray-200 gap-3">
        <div>
          <nav className="flex items-center space-x-1.5 text-xs text-gray-500 mb-1">
            <Link to="/" className="hover:underline hover:text-gray-900 cursor-pointer transition-colors">
              Home
            </Link>
            <span className="text-gray-400">&gt;</span>
            <Link to="/pipelines" className="hover:underline hover:text-gray-900 cursor-pointer transition-colors">
              All Pipelines
            </Link>
            <span className="text-gray-400">&gt;</span>
            <span className="font-bold text-gray-900">{selectedProject}</span>
          </nav>

          <h1 className="text-lg font-bold text-gray-900 mt-1 flex items-center space-x-2">
            <span className="font-bold text-blue-700">{selectedProject}</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Monitor automated build pipelines, workflow stages, and run triggers[cite: 2].
          </p>
        </div>

        {/* Right side controls matching reference dashboard UI */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => alert('Opening Edit Config editor...')}
            className="text-xs border bg-white border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50 flex items-center space-x-1.5 rounded transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-file-lines text-xs"></i>
            <span>Edit Config</span>
          </button>

          <button
            onClick={() => alert('Triggering new pipeline run...')}
            className="text-xs border bg-white border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50 flex items-center space-x-1.5 rounded transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-play text-xs"></i>
            <span>Trigger Pipeline</span>
          </button>

          <button
            onClick={() => alert('Opening Project Settings...')}
            className="text-xs bg-gray-900 hover:bg-gray-800 text-white px-3 py-1.5 rounded flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-gear text-xs"></i>
            <span>Project Settings</span>
          </button>
        </div>
      </div>

      {/* Filters Bar matching reference CircleCI layout */}
      <div className="flex flex-col lg:flex-row flex-wrap gap-2.5 sm:gap-3 items-stretch lg:items-center justify-between bg-gray-50 p-2.5 sm:p-3 border border-gray-200 text-xs text-gray-700 border-t-0 mt-3 rounded-t-sm shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-gray-500 font-medium mr-1">Filters</span>

          {/* Scope Dropdown */}
          <div className="relative">
            <select
              value={pipelineScope}
              onChange={(e) => setPipelineScope(e.target.value)}
              className="text-xs border border-gray-300 bg-white px-2.5 py-1.5 text-gray-800 rounded focus:outline-none focus:border-gray-500 cursor-pointer"
            >
              <option value="Everyone's Pipelines">Everyone's Pipelines</option>
              <option value="My Pipelines">My Pipelines</option>
            </select>
          </div>

          {/* Project Selector Dropdown */}
          <div className="relative">
            <select
              value={selectedProject}
              onChange={(e) => {
                setSelectedProject(e.target.value);
                setSearchParams({ project: e.target.value });
              }}
              className="text-xs border border-gray-300 bg-white px-2.5 py-1.5 text-gray-800 rounded focus:outline-none focus:border-gray-500 cursor-pointer"
            >
              <option value="ruby-ci-demo">ruby-ci-demo</option>
              <option value="fastapi-backend-service">fastapi-backend-service</option>
              <option value="react-frontend-app">react-frontend-app</option>
            </select>
          </div>

          {/* Branch Filter Dropdown */}
          <div className="relative">
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="text-xs border border-gray-300 bg-white px-2.5 py-1.5 text-gray-800 rounded focus:outline-none focus:border-gray-500 cursor-pointer"
            >
              <option value="Select a Branch">Select a Branch</option>
              <option value="main">main</option>
              <option value="develop">develop</option>
            </select>
          </div>

          {/* Date Filter Dropdown */}
          <div className="relative">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="text-xs border border-gray-300 bg-white px-2.5 py-1.5 text-gray-800 rounded focus:outline-none focus:border-gray-500 cursor-pointer"
            >
              <option value="All days">All days</option>
              <option value="Last 24 hours">Last 24 hours</option>
              <option value="Last 7 days">Last 7 days</option>
            </select>
          </div>
        </div>

        {/* Auto-expand toggle & Search */}
        <div className="flex items-center flex-wrap gap-2.5 sm:gap-3">
          <div className="flex items-center space-x-1.5">
            <span className="text-gray-600 font-medium">Auto-expand</span>
            <button
              onClick={() => setAutoExpand(!autoExpand)}
              className={`w-8 h-4 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                autoExpand ? 'bg-blue-600 justify-end' : 'bg-gray-300 justify-start'
              }`}
            >
              <div className="w-3 h-3 bg-white rounded-full shadow-md"></div>
            </button>
          </div>

          <div className="relative flex-1 sm:w-auto min-w-[180px]">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-2 text-gray-400 text-xs"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search workflow..."
              className="w-full pl-8 pr-3 py-1 border border-gray-300 bg-white text-gray-800 rounded focus:outline-none focus:border-gray-500 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Table & Enclosed Stable Pagination Card matching Project UI */}
      <div className="border border-gray-200 overflow-hidden shadow-sm bg-white flex flex-col">
        {/* Mobile Cards List (< 768px) */}
        <div className="md:hidden divide-y divide-gray-100">
          {currentPipelines.length > 0 ? (
            currentPipelines.map((pipe) => (
              <div key={pipe.id} className="p-3.5 hover:bg-gray-50/70 transition-colors flex flex-col gap-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono font-medium text-xs text-gray-900">{pipe.projectName}</span>
                    <span className="text-[10px] text-gray-400 ml-1.5 font-mono">{pipe.buildNumber}</span>
                  </div>
                  <span className="inline-flex items-center text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-[11px] font-semibold border border-emerald-200">
                    <i className="fa-solid fa-check mr-1 text-[10px]"></i> Success
                  </span>
                </div>

                <div>
                  <Link to={`/pipelines/${pipe.id}`} className="font-mono text-sm text-blue-600 font-semibold hover:underline">
                    {pipe.workflow}
                  </Link>
                </div>

                <div className="bg-gray-50 p-2 rounded text-xs">
                  <div className="font-mono font-semibold text-blue-700">{pipe.branch}</div>
                  <div className="text-gray-500 font-mono text-[11px] truncate mt-0.5">
                    <span className="text-gray-700 font-medium mr-1">{pipe.commitHash}</span>
                    {pipe.commitMessage}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <span title={formatDateTime(pipe.startedAt)} className="flex items-center gap-1 text-gray-600">
                      <i className="fa-regular fa-clock text-[11px] text-gray-400"></i>
                      {formatRelativeTime(pipe.startedAt)}
                    </span>
                    <span className="font-mono font-semibold text-gray-800">
                      {pipe.duration}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => alert(`Rerunning workflow ${pipe.workflow}`)}
                      className="text-gray-500 hover:text-gray-900 p-1 cursor-pointer"
                      title="Rerun workflow"
                    >
                      <i className="fa-solid fa-rotate-right"></i>
                    </button>
                    <button
                      onClick={() => alert(`Cancelling workflow ${pipe.workflow}`)}
                      className="text-gray-500 hover:text-red-600 p-1 cursor-pointer"
                      title="Cancel workflow"
                    >
                      <i className="fa-solid fa-ban"></i>
                    </button>
                    <button
                      onClick={() => alert(`Opening options for ${pipe.workflow}`)}
                      className="text-gray-500 hover:text-gray-900 p-1 cursor-pointer"
                      title="More options"
                    >
                      <i className="fa-solid fa-ellipsis"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-xs text-gray-500 px-4">
              <i className="fa-solid fa-network-wired text-2xl text-gray-300 mb-2 block"></i>
              No pipeline executions found for {selectedProject}.
            </div>
          )}
        </div>

        {/* Desktop Table View (>= 768px) */}
        <div className="hidden md:block overflow-x-auto overflow-y-auto max-h-[460px] min-h-[380px]">
          <table className="w-full text-left border-collapse bg-white text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold select-none text-xs">
              <tr>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Workflow</th>
                <th className="py-3 px-4">Trigger Event</th>
                <th className="py-3 px-4">Start</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4 text-right w-36">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700 text-xs">
              {currentPipelines.length > 0 ? (
                currentPipelines.map((pipe) => (
                  <tr key={pipe.id} className="hover:bg-gray-50/70 transition-colors">
                    {/* Project & Build # */}
                    <td className="py-3 px-4 font-mono font-medium text-gray-900">
                      <div>{pipe.projectName}</div>
                      <div className="text-[10px] text-gray-400">{pipe.buildNumber}</div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-emerald-200">
                        <i className="fa-solid fa-check mr-1 text-[10px]"></i> Success
                      </span>
                    </td>

                    {/* Workflow Name */}
                    <td className="py-3 px-4 font-mono text-blue-600 font-semibold">
                      <Link to={`/pipelines/${pipe.id}`} className="hover:underline">
                        {pipe.workflow}
                      </Link>
                    </td>

                    {/* Trigger Event / Branch & Commit */}
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-mono font-semibold text-blue-700">{pipe.branch}</div>
                      <div className="text-gray-500 font-mono text-[11px] truncate">
                        <span className="text-gray-700 font-medium mr-1">{pipe.commitHash}</span>
                        {pipe.commitMessage}
                      </div>
                    </td>

                    {/* Start Time */}
                    <td className="py-3 px-4 whitespace-nowrap text-gray-600" title={formatDateTime(pipe.startedAt)}>
                      {formatRelativeTime(pipe.startedAt)}
                    </td>

                    {/* Duration */}
                    <td className="py-3 px-4 whitespace-nowrap font-mono font-semibold text-gray-800">
                      {pipe.duration}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                      <button
                        onClick={() => alert(`Rerunning workflow ${pipe.workflow}`)}
                        className="text-gray-500 hover:text-gray-900 p-1 cursor-pointer"
                        title="Rerun workflow"
                      >
                        <i className="fa-solid fa-rotate-right"></i>
                      </button>
                      <button
                        onClick={() => alert(`Cancelling workflow ${pipe.workflow}`)}
                        className="text-gray-500 hover:text-red-600 p-1 cursor-pointer"
                        title="Cancel workflow"
                      >
                        <i className="fa-solid fa-ban"></i>
                      </button>
                      <button
                        onClick={() => alert(`Opening options for ${pipe.workflow}`)}
                        className="text-gray-500 hover:text-gray-900 p-1 cursor-pointer"
                        title="More options"
                      >
                        <i className="fa-solid fa-ellipsis"></i>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-14 text-center text-xs text-gray-500">
                    <i className="fa-solid fa-network-wired text-2xl text-gray-300 mb-2 block"></i>
                    No pipeline executions found for {selectedProject}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Stable Pagination Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-3.5 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-gray-600 select-none">
          <div className="flex items-center space-x-1.5 text-center sm:text-left">
            <span>
              Showing <span className="font-semibold text-gray-900">{totalRecords === 0 ? 0 : startIndex + 1}</span> to{' '}
              <span className="font-semibold text-gray-900">{Math.min(endIndex, totalRecords)}</span> of{' '}
              <span className="font-semibold text-gray-900">{totalRecords}</span> pipeline runs
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-gray-500 font-medium mr-1">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage <= 1}
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