import React from 'react';
import { Link } from 'react-router-dom';

export default function Login() {
  return (
    <div className="bg-gray-50 text-gray-900 min-h-screen flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-md max-w-sm w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-black text-white font-bold text-xl rounded-lg shadow-sm">
          GitSight
        </div>

        <div>
          <h1 className="text-xl font-bold text-gray-900">PR Review Agent</h1>
          <p className="text-xs text-gray-500 mt-1">
            Automated code reviews for your GitHub Repositories
          </p>
        </div>

        <div className="border-t border-b border-gray-100 py-4 space-y-2 text-xs text-left text-gray-600">
          <div className="flex items-center space-x-2">
            <span className="text-green-600 font-bold">✓</span>{' '}
            <span>Import owned & collaborator repos</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-green-600 font-bold">✓</span>{' '}
            <span>Webhook diff analysis & summary</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-green-600 font-bold">✓</span>{' '}
            <span>Post comments & merge directly</span>
          </div>
        </div>

        <Link
          to="/"
          className="w-full flex items-center justify-center space-x-2 bg-gray-900 hover:bg-gray-800 text-white py-2.5 px-4 rounded-md font-medium text-sm transition-colors shadow"
        >
          <span>Sign in with GitHub SSO</span>
        </Link>
      </div>
    </div>
  );
}
