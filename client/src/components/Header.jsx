import React from 'react';
import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="h-14 border-b border-gray-200 flex items-center justify-between px-6 bg-white shrink-0">
      <div className="flex items-center space-x-3">
        <Link to="/" className="flex items-center space-x-3">
          <div className="bg-black text-white p-1.5 rounded text-sm font-bold tracking-wider shadow-sm">
            GitSight
          </div>
          <span className="text-xl font-semibold tracking-tight text-gray-800">
            GitHub PR Review Agent
          </span>
        </Link>
      </div>
      <div className="flex items-center space-x-4 text-gray-600">
        <button className="hover:text-gray-900 text-sm flex items-center space-x-1 cursor-pointer">
          <span>🔍</span> <span>Search Repos</span>
        </button>
        <button className="hover:text-gray-900 text-sm flex items-center space-x-1 cursor-pointer">
          <span>⚙️</span> <span>Webhook Settings</span>
        </button>
        <Link
          to="/login"
          title="Switch Account / Sign in"
          className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-sm border hover:opacity-90 transition-opacity"
        >
          GH
        </Link>
      </div>
    </header>
  );
}
