import React from 'react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const stats = [
    {
      id: 1,
      label: 'Total Repositories',
      count: '12',
      change: '+2 this week',
      icon: 'fa-solid fa-box-archive',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      link: '/repositories',
    },
    {
      id: 2,
      label: 'New Pull Requests',
      count: '5',
      change: '3 need review',
      icon: 'fa-solid fa-code-pull-request',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      link: '/pull-requests',
    },
    {
      id: 3,
      label: 'Recent Webhooks',
      count: '28',
      change: '100% delivered',
      icon: 'fa-solid fa-bolt',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      link: '#',
    },
    {
      id: 4,
      label: 'AI Comments Generated',
      count: '142',
      change: 'Gemini 2.5 Flash',
      icon: 'fa-solid fa-robot',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      link: '/pull-requests',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title & Intro */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">System Overview</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time status of your connected repositories, incoming PR webhooks, and AI review agent.
          </p>
        </div>
        <div className="mt-3 sm:mt-0 flex space-x-2">
          <Link
            to="/repositories"
            className="px-3 py-1.5 text-xs font-medium bg-gray-900 hover:bg-black text-white rounded transition-colors shadow-sm"
          >
            Manage Repositories
          </Link>
          <Link
            to="/pull-requests"
            className="px-3 py-1.5 text-xs font-medium bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded transition-colors"
          >
            View Active PRs
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.id}
            className="bg-white  p-5 rounded-lg shadow-sm flex flex-col justify-between hover:border-gray-300 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                {stat.label}
              </span>
            </div>

            <div className="mt-4">
              <div className="text-3xl font-black text-gray-900 tracking-tight">
                {stat.count}
              </div>
              <p className="text-[11px] text-gray-400 mt-1 flex items-center justify-between">
                <span>{stat.change}</span>
                {stat.link !== '#' && (
                  <Link to={stat.link} className="text-blue-600 hover:underline">
                    View →
                  </Link>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Status / Engine Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Agent Operational Status */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              GitSight Review Engine
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-gray-50 text-gray-600">
              <span>Webhook Ingestion Service</span>
              <span className="font-mono text-gray-900 font-medium">Active (Listening)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-50 text-gray-600">
              <span>Unified Diff Parser</span>
              <span className="font-mono text-gray-900 font-medium">Ready</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-50 text-gray-600">
              <span>Gemini AI Structured Output Engine</span>
              <span className="font-mono text-gray-900 font-medium">Online (Gemini 2.5)</span>
            </div>
            <div className="flex justify-between py-1.5 text-gray-600">
              <span>GitHub API Publisher</span>
              <span className="font-mono text-gray-900 font-medium">Authenticated</span>
            </div>
          </div>
        </div>

        {/* Quick Launch & Guidance */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              Quick Setup & Next Steps
            </span>
            <p className="text-xs text-gray-600 leading-relaxed">
              When a pull request is opened or updated on any imported repository, GitHub immediately forwards the event to your webhook. GitSight automatically performs deep diff analysis and prepares line-by-line comments.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-200 flex flex-wrap gap-2 text-xs">
            <Link
              to="/repositories"
              className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 px-3 py-1.5 rounded font-medium transition-colors"
            >
              Go to Repositories →
            </Link>
            <Link
              to="/pull-requests"
              className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 px-3 py-1.5 rounded font-medium transition-colors"
            >
              Open PR Review Queue →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}