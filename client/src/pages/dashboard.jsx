import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [repositories, setRepositories] = useState([
    {
      id: 1,
      name: 'org-dev/fastapi-backend-service',
      role: 'Owner',
      openPrs: 3,
      webhookSecret: 'whsec_8a92...f72',
      status: 'active'
    },
    {
      id: 2,
      name: 'org-dev/react-frontend-app',
      role: 'Collaborator',
      openPrs: 1,
      webhookSecret: 'whsec_1b44...e88',
      status: 'active'
    }
  ]);

  const [syncing, setSyncing] = useState(false);

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      alert('GitHub repositories synced successfully!');
    }, 600);
  };

  return (
    <div>
      <div className="flex items-center space-x-1 mb-4 border-b border-gray-200 pb-px justify-between">
        <div className="flex space-x-1">
          <button className="px-4 py-1.5 text-sm font-medium bg-gray-100 text-gray-800 rounded-t-md border-t border-x border-gray-200">
            Imported Repositories
          </button>
          <button
            onClick={() => alert('Sync modal: Enter repo URL or select from your GitHub organization')}
            className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-gray-50 rounded-t-md transition-colors"
          >
            ➕ Sync New Repo
          </button>
        </div>
      </div>

      <div className="flex justify-between mb-4 items-center">
        <p className="text-xs text-gray-500">
          Repositories where you are Owner or Collaborator with Webhook active.
        </p>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="text-xs border border-gray-300 rounded px-2.5 py-1 text-gray-600 hover:bg-gray-50 flex items-center space-x-1 transition-colors cursor-pointer"
        >
          <span>🔄</span> <span>{syncing ? 'Syncing...' : 'Resync GitHub Access'}</span>
        </button>
      </div>

      {/* Table of Repositories */}
      <div className="border border-gray-200 rounded-md overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse bg-white text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold select-none">
              <th className="p-3 w-12 text-center">Status</th>
              <th className="p-3">Repository Name</th>
              <th className="p-3">Role</th>
              <th className="p-3">Active Open PRs</th>
              <th className="p-3">Webhook Secret</th>
              <th className="p-3 w-28 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {repositories.map((repo) => (
              <tr key={repo.id} className="hover:bg-gray-50/70 transition-colors">
                <td className="p-3 text-center">
                  <span className="inline-flex items-center justify-center w-5 h-5 bg-green-100 border border-green-500 rounded-full text-green-700 text-xs font-bold">
                    ✓
                  </span>
                </td>
                <td className="p-3 font-medium text-blue-600 hover:underline cursor-pointer">
                  <Link to="/pull-requests">{repo.name}</Link>
                </td>
                <td className="p-3 text-gray-600">{repo.role}</td>
                <td className="p-3">
                  <Link
                    to="/pull-requests"
                    className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full border border-blue-200 hover:bg-blue-200 transition-colors inline-block"
                  >
                    {repo.openPrs} Open PR{repo.openPrs > 1 ? 's' : ''}
                  </Link>
                </td>
                <td className="p-3 text-xs text-gray-400 font-mono">
                  {repo.webhookSecret}
                </td>
                <td className="p-3 text-center">
                  <Link
                    to="/pull-requests"
                    className="inline-block px-2 py-1 text-xs font-semibold text-white bg-gray-900 rounded hover:bg-gray-800 transition-colors"
                  >
                    View PRs
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
