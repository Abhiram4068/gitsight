import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function PrAiInsights() {
  const navigate = useNavigate();

  return (
    <div className="bg-gray-50 text-gray-900 min-h-screen flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 shrink-0 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1.5 rounded-md border border-gray-300 transition-colors cursor-pointer"
            >
              &larr; Back to PR #42
            </button>
            <div className="h-4 w-px bg-gray-300"></div>
            <span className="text-sm font-semibold text-gray-900 font-mono">
              GitSight AI Analysis Report
            </span>
          </div>

          <span className="text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200 px-3 py-1 rounded-full flex items-center space-x-1.5">
            <i className="fa-solid fa-wand-magic-sparkles text-xs"></i>
            <span>AI Review Generated</span>
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto w-full p-6 space-y-6 flex-1">
        {/* Title Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            AI Automated Review &amp; Security Insight
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Generated analysis for Pull Request #42: <span className="font-semibold text-gray-700">Add JWT Auth &amp; Rate Limiting</span>
          </p>
        </div>

        {/* Executive Summary */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center space-x-2">
            <i className="fa-solid fa-align-left text-blue-600"></i>
            <span>Executive Summary</span>
          </h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            This pull request replaces hardcoded JWT signing keys with configurable environment settings and introduces token validation middleware alongside rate limiting features. The changes significantly improve authentication security across API endpoints.
          </p>
        </div>

        {/* Security & Code Quality Insights */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-emerald-200 rounded-lg p-5 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-emerald-700 font-bold text-sm">
              <i className="fa-solid fa-shield-halved"></i>
              <span>Security Improvements</span>
            </div>
            <ul className="text-xs text-gray-600 space-y-2 list-disc list-inside">
              <li>Replaced fallback secret key literal with <code className="bg-emerald-50 text-emerald-800 px-1 rounded">settings.SECRET_KEY</code>.</li>
              <li>Encapsulated rate limit validation in middleware to prevent resource exhaustion attacks.</li>
            </ul>
          </div>

          <div className="bg-white border border-amber-200 rounded-lg p-5 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-amber-700 font-bold text-sm">
              <i className="fa-solid fa-triangle-exclamation"></i>
              <span>Potential Issues &amp; Suggestions</span>
            </div>
            <ul className="text-xs text-gray-600 space-y-2 list-disc list-inside">
              <li>Ensure startup checks throw an explicit error if <code className="bg-amber-50 text-amber-800 px-1 rounded">SECRET_KEY</code> is undefined.</li>
              <li>Add automated unit tests covering invalid JWT token scenarios.</li>
            </ul>
          </div>
        </div>

        {/* Line-by-Line Automated Suggestions */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center space-x-2">
            <i className="fa-solid fa-list-check text-purple-600"></i>
            <span>Line-by-Line AI Suggestions</span>
          </h2>

          <div className="space-y-3">
            <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-md space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-mono font-bold text-purple-900">app/middleware/auth.py &bull; Line 6</span>
                <span className="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded font-semibold">Recommendation</span>
              </div>
              <p className="text-purple-900 leading-relaxed">
                Ensure <code className="bg-purple-100 px-1 py-0.5 rounded text-purple-900 font-mono">settings.SECRET_KEY</code> raises a runtime error during initialization if the environment variable is empty to prevent silent defaults.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}