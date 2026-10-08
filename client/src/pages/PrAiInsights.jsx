import React, { useState, useEffect } from 'react';

const DashboardCards = () => (
  <div className="flex flex-wrap items-center justify-center text-center gap-x-10 gap-y-4 pb-2">
    <div>
      <div className="text-xs text-gray-500 font-medium">Final Suggestions</div>
      <div className="text-xl font-bold text-gray-900">3</div>
    </div>
    
    <div>
      <div className="text-xs text-gray-500 font-medium">Security</div>
      <div className="text-xl font-bold text-gray-900">1</div>
    </div>

    <div>
      <div className="text-xs text-gray-500 font-medium">Syntax Errors</div>
      <div className="text-xl font-bold text-gray-900">0</div>
    </div>

    <div>
      <div className="text-xs text-gray-500 font-medium">Breaches</div>
      <div className="text-xl font-bold text-gray-900">0</div>
    </div>

    <div>
      <div className="text-xs text-gray-500 font-medium">Performance Issues</div>
      <div className="text-xl font-bold text-gray-900">1</div>
    </div>

    <div>
      <div className="text-xs text-gray-500 font-medium">Code Smells</div>
      <div className="text-xl font-bold text-gray-900">2</div>
    </div>

    <div>
      <div className="text-xs text-gray-500 font-medium">Test Coverage Impact</div>
      <div className="text-xl font-bold text-red-600">-4.2%</div>
    </div>

    <div>
      <div className="text-xs text-gray-500 font-medium">Code Complexity</div>
      <div className="text-xl font-bold text-amber-600">High</div>
    </div>
  </div>
);

export default function PrAiInsights() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);

  const modalConfig = {
    export: { title: 'Export Review', message: 'Are you sure you want to export this review report?', confirmText: 'Export', confirmColor: 'bg-blue-600 hover:bg-blue-700' },
    critical: { title: 'Mark as Critical', message: 'Mark this entire review as Critical?', confirmText: 'Mark Critical', confirmColor: 'bg-red-600 hover:bg-red-700' },
    flag: { title: 'Flag Review', message: 'Flag this review for further investigation?', confirmText: 'Flag', confirmColor: 'bg-amber-600 hover:bg-amber-700' }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="h-[60vh] bg-transparent text-gray-700 flex flex-col items-center justify-center font-sans">
        <div className="w-5 h-5 border-2 border-gray-400 border-t-blue-600 rounded-full animate-spin mb-3"></div>
        <h2 className="text-xs font-semibold text-gray-900 tracking-tight">
          Loading AI Code Review Analysis...
        </h2>
      </div>
    );
  }

  const reviewThreads = [
    {
      id: 1,
      filePath: 'app/middleware/auth.py',
      startLine: 4,
      endLine: 8,
      codeLines: [
        { num: 4, text: 'def verify_token(token: str):', type: 'add' },
        { num: 5, text: '    if not settings.SECRET_KEY:', type: 'add' },
        { num: 6, text: '        return jwt.decode(token, "", algorithms=["HS256"])', type: 'add' },
        { num: 7, text: '    return jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])', type: 'add' },
      ],
      author: 'GitSight',
      time: '2 mins ago',
      comment:
        'Decoding with an empty string key fallback can cause unexpected security bypasses if settings.SECRET_KEY is undefined. Raise an explicit exception during startup instead.',
      diffSuggestion: {
        removed: 'return jwt.decode(token, "", algorithms=["HS256"])',
        added: 'raise RuntimeError("SECRET_KEY environment variable is not configured")',
      },
    },
    {
      id: 2,
      filePath: 'app/views/users.py',
      startLine: 40,
      endLine: 45,
      codeLines: [
        { num: 40, text: 'def get_user_profiles(user_ids: list[int]):', type: 'add' },
        { num: 41, text: '    users = User.query.filter(User.id.in_(user_ids)).all()', type: 'add' },
        { num: 42, text: '    return [{ "id": u.id, "profile": u.profile.bio } for u in users]', type: 'add' },
      ],
      author: 'GitSight ',
      badge: 'bot',
      time: '5 mins ago',
      comment:
        'Accessing u.profile.bio inside the comprehension issues an additional query per user record. Use joinedload or prefetch_related on the initial query.',
      diffSuggestion: {
        removed: 'users = User.query.filter(User.id.in_(user_ids)).all()',
        added: 'users = User.query.options(joinedload(User.profile)).filter(User.id.in_(user_ids)).all()',
      },
    },
    {
      id: 3,
      filePath: 'config/settings.py',
      startLine: 12,
      endLine: 16,
      codeLines: [
        { num: 14, text: 'API_KEY = "sk_live_99a8b7c6d5e4f3a2b1c0"', type: 'add' },
        { num: 15, text: 'DEBUG = True', type: 'add' },
      ],
      author: 'GitSight',
      badge: 'bot',
      time: '8 mins ago',
      comment:
        'Detected hardcoded live API key string. Move sensitive keys to environment variable injection.',
      diffSuggestion: {
        removed: 'API_KEY = "sk_live_99a8b7c6d5e4f3a2b1c0"',
        added: 'API_KEY = os.getenv("API_KEY")',
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="pb-2">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">AI Code Review Analysis</h1>
      </div>

      <DashboardCards />

      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
          Inline Code Reviews ({reviewThreads.length})
        </h2>
        <div className="flex items-center space-x-4 text-xs font-medium">
          <button 
            onClick={() => setActiveModal('export')}
            className="text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
          >
            Export
          </button>
          <button 
            onClick={() => setActiveModal('critical')}
            className="text-red-500 hover:text-red-700 transition-colors cursor-pointer"
          >
            Mark as Critical
          </button>
          <button 
            onClick={() => setActiveModal('flag')}
            className="text-amber-600 hover:text-amber-800 transition-colors cursor-pointer"
          >
            Flag
          </button>
        </div>
      </div>

      {/* Tree Line Wrapper */}
      <div className="relative pl-6">
        {/* Continuous Trunk Line connecting all issues */}
        <div className="absolute left-[11px] top-3 bottom-6 w-0.5 bg-emerald-500"></div>

        <div className="space-y-10">
          {reviewThreads.map((thread) => (
            <div key={thread.id} className="relative group">

              {/* Horizontal Branch Line pointing from the main trunk to the card */}
              <div className="absolute -left-[12px] top-5 w-3 h-0.5 bg-emerald-500"></div>

              {/* Review Card */}
              <div className="bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm">
                {/* Diff Context Header */}
                <div className="bg-gray-100/70 px-3 py-2 border-b border-gray-200 flex items-center justify-between font-mono text-xs text-gray-600">
                  <span className="font-medium text-gray-900">{thread.filePath}</span>
                  <span className="text-gray-500">
                    Lines +{thread.startLine} to +{thread.endLine}
                  </span>
                </div>

                {/* Code Snippet Block */}
                <div className="bg-gray-50 border-b border-gray-200 font-mono text-xs overflow-x-auto">
                  {thread.codeLines.map((line, idx) => (
                    <div key={idx} className="flex items-center px-3 py-1 bg-emerald-50/50 text-emerald-900">
                      <span className="w-8 text-right pr-3 text-gray-400 select-none text-[11px]">{line.num}</span>
                      <span className="text-emerald-600 font-semibold select-none mr-2">+</span>
                      <pre className="whitespace-pre">{line.text}</pre>
                    </div>
                  ))}
                </div>

                {/* Comment Thread */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="font-semibold text-gray-900">{thread.author}</span>

                    <span className="text-gray-400">&bull; {thread.time}</span>
                  </div>

                  <p className="text-xs text-gray-700 leading-relaxed">
                    {thread.comment}
                  </p>

                  {/* Diff Suggestion Box */}
                  {thread.diffSuggestion && (
                    <div className="border border-gray-200 mt-3 font-mono text-xs rounded overflow-hidden">
                      <div className="bg-gray-100 px-3 py-1.5 border-b border-gray-200 text-[11px] text-gray-600 font-semibold flex justify-between items-center">
                        <span>Suggested change</span>
                        <button className="text-blue-600 hover:text-blue-700 font-sans font-medium cursor-pointer">Export Suggestion</button>
                      </div>
                      <div className="bg-white">
                        <div className="bg-red-50 text-red-800 px-3 py-1 border-l-2 border-red-500 flex items-center">
                          <span className="text-red-500 mr-2 select-none font-bold">-</span>
                          <span>{thread.diffSuggestion.removed}</span>
                        </div>
                        <div className="bg-emerald-50 text-emerald-800 px-3 py-1 border-l-2 border-emerald-500 flex items-center">
                          <span className="text-emerald-500 mr-2 select-none font-bold">+</span>
                          <span>{thread.diffSuggestion.added}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Modal */}
      {activeModal && modalConfig[activeModal] && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{modalConfig[activeModal].title}</h3>
            <p className="text-sm text-gray-600 mb-6">{modalConfig[activeModal].message}</p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setActiveModal(null)} 
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={() => setActiveModal(null)} 
                className={`px-4 py-2 text-sm font-medium text-white rounded transition-colors cursor-pointer ${modalConfig[activeModal].confirmColor}`}
              >
                {modalConfig[activeModal].confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}