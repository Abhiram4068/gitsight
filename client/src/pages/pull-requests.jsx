import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function PullRequests() {
  const [prs] = useState([
    {
      id: 42,
      title: 'feat: Add JWT Auth & Rate Limiting Middleware',
      branch: 'feature/jwt-auth ➔ main',
      author: 'dev-user-01',
      status: 'Pending Review & Post',
      statusType: 'pending',
      additions: 142,
      deletions: 28,
      repo: 'org-dev/fastapi-backend-service'
    },
    {
      id: 39,
      title: 'refactor: Migrate token decoding to utility service',
      branch: 'refactor/token-utils ➔ main',
      author: 'alex-reviewer',
      status: 'Analyzing Diff',
      statusType: 'analyzing',
      additions: 45,
      deletions: 12,
      repo: 'org-dev/fastapi-backend-service'
    },
    {
      id: 15,
      title: 'fix: Handle missing webhook signature headers gracefully',
      branch: 'fix/webhook-sig ➔ main',
      author: 'sarah-dev',
      status: 'Review Completed',
      statusType: 'completed',
      additions: 18,
      deletions: 4,
      repo: 'org-dev/react-frontend-app'
    }
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-3">
        <h1 className="text-lg font-semibold text-gray-800">
          Open Pull Requests Requiring Review
        </h1>
        <span className="text-xs text-gray-500">Auto-synced via Webhooks</span>
      </div>

      <div className="border border-gray-200 rounded-md overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse bg-white text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold select-none">
              <th className="p-3 w-16 text-center">PR #</th>
              <th className="p-3">Title & Branch</th>
              <th className="p-3">Author</th>
              <th className="p-3">Review Status</th>
              <th className="p-3">Diff Changes</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {prs.map((pr) => (
              <tr key={pr.id} className="hover:bg-gray-50/70 transition-colors">
                <td className="p-3 font-mono font-bold text-blue-600 text-center">
                  #{pr.id}
                </td>
                <td className="p-3">
                  <Link
                    to="/pr-detail"
                    className="font-semibold text-gray-900 hover:text-blue-600 transition-colors block"
                  >
                    {pr.title}
                  </Link>
                  <div className="text-xs text-gray-400 font-mono mt-0.5">
                    {pr.branch}
                  </div>
                </td>
                <td className="p-3 font-medium text-gray-800">{pr.author}</td>
                <td className="p-3">
                  {pr.statusType === 'pending' && (
                    <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-0.5 rounded-full border border-amber-200">
                      {pr.status}
                    </span>
                  )}
                  {pr.statusType === 'analyzing' && (
                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                      {pr.status}
                    </span>
                  )}
                  {pr.statusType === 'completed' && (
                    <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded-full border border-green-200">
                      {pr.status}
                    </span>
                  )}
                </td>
                <td className="p-3 font-mono text-xs">
                  <span className="text-green-600">+{pr.additions}</span>{' '}
                  <span className="text-red-600">-{pr.deletions}</span>
                </td>
                <td className="p-3 text-center">
                  <Link
                    to="/pr-detail"
                    className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors inline-block"
                  >
                    Analyze & Review ➔
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
