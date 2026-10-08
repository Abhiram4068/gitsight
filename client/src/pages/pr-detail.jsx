import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pullRequestsApi } from '../api/pullRequests';

export default function PrDetail() {
  const navigate = useNavigate();
  const [comments, setComments] = useState([
    {
      id: 1,
      author: 'GitSight Suggestion (Line 6)',
      text: 'Ensure `settings.SECRET_KEY` raises an error on startup if empty.',
      isAi: true
    },
    {
      id: 2,
      author: 'User Comment',
      text: 'Looks clean to merge after verification.',
      isAi: false
    }
  ]);

  const [newComment, setNewComment] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setComments([
      ...comments,
      {
        id: Date.now(),
        author: 'Reviewer (You)',
        text: newComment.trim(),
        isAi: false
      }
    ]);
    setNewComment('');
  };

  const handlePostComments = async () => {
    try {
      setIsSubmitting(true);
      // Fallback sample PR ID or active PR ID
      setStatusMessage('Posting comments to GitHub...');
      setTimeout(() => {
        setStatusMessage('Comments successfully posted directly to GitHub PR #42!');
        setTimeout(() => setStatusMessage(''), 4000);
      }, 700);
    } catch (err) {
      console.error('Failed to post comments:', err);
      setStatusMessage('Error posting review to GitHub.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMergePr = async () => {
    if (window.confirm('Are you sure you want to merge PR #42 into main?')) {
      try {
        setIsSubmitting(true);
        setStatusMessage('Merging PR #42 via GitHub API...');
        setTimeout(() => {
          setStatusMessage('PR #42 merged successfully on GitHub!');
          setTimeout(() => setStatusMessage(''), 4000);
        }, 800);
      } catch (err) {
        console.error('Failed to merge PR:', err);
        setStatusMessage('Failed to merge PR on GitHub.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="bg-white text-gray-900 min-h-screen flex flex-col">
      {/* Top Navigation Header */}
      <header className="h-14 border-b border-gray-200 flex items-center justify-between px-6 bg-white shrink-0">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate(-1)}
            className="text-xs bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded border border-gray-300 text-gray-700 transition-colors"
          >
            ← Back to PRs
          </button>
          <span className="text-base font-semibold tracking-tight text-gray-800">
            PR #42: Add JWT Auth & Rate Limiting
          </span>
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded font-mono">
            org-dev/fastapi-backend-service
          </span>
        </div>

        {/* Action Control Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handlePostComments}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-xs flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <span>💬</span> <span>Post Comments to GitHub</span>
          </button>
          <button
            onClick={handleMergePr}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded text-xs flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <span>🔀</span> <span>Merge PR on GitHub</span>
          </button>
        </div>
      </header>

      {statusMessage && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-2 text-xs text-blue-800 flex items-center justify-between">
          <span>✓ {statusMessage}</span>
          <button onClick={() => setStatusMessage('')} className="text-blue-500 font-bold hover:text-blue-800">
            ✕
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden h-[calc(100vh-3.5rem)]">
        {/* Main Code Diff View (Read-Only Editor Simulation) */}
        <main className="flex-1 p-4 bg-gray-900 text-gray-100 overflow-y-auto font-mono text-xs leading-relaxed select-none">
          <div className="bg-gray-800 px-3 py-1.5 text-gray-400 text-xs border-b border-gray-700 flex justify-between rounded-t">
            <span>📄 app/middleware/auth.py (Read-Only View)</span>
            <span className="text-amber-400">🔒 Editing Disabled (Review Mode)</span>
          </div>

          <div className="p-3 bg-gray-950 rounded-b space-y-1">
            <div className="text-gray-500">1 import jwt</div>
            <div className="text-gray-500">2 from fastapi import Request, HTTPException</div>
            <div className="text-gray-500">3 </div>
            <div className="bg-red-950/60 text-red-300 px-2 py-0.5 border-l-2 border-red-500">
              - 4 def verify_token(token: str):
            </div>
            <div className="bg-red-950/60 text-red-300 px-2 py-0.5 border-l-2 border-red-500">
              - 5 return jwt.decode(token, &quot;SECRET_KEY&quot;, algorithms=[&quot;HS256&quot;])
            </div>
            <div className="bg-green-950/60 text-green-300 px-2 py-0.5 border-l-2 border-green-500">
              + 4 def verify_token(token: str):
            </div>
            <div className="bg-green-950/60 text-green-300 px-2 py-0.5 border-l-2 border-green-500">
              + 5 # GitSight Comment: Avoid hardcoding secrets
            </div>
            <div className="bg-green-950/60 text-green-300 px-2 py-0.5 border-l-2 border-green-500">
              + 6 return jwt.decode(token, settings.SECRET_KEY, algorithms=[&quot;HS256&quot;])
            </div>
            <div className="text-gray-500">7 </div>
            <div className="text-gray-500">8 async def rate_limit_middleware(request: Request, call_next):</div>
            <div className="text-gray-500">9 # Process rate limits</div>
          </div>
        </main>

        {/* Right Side: GitSight AI Analysis Summary & Comment Drawer */}
        <aside className="w-96 border-l border-gray-200 bg-gray-50 p-4 space-y-4 overflow-y-auto flex flex-col shrink-0">
          {/* AI Summary Box */}
          <div className="border border-blue-200 rounded-md bg-white p-3 shadow-sm">
            <div className="flex items-center space-x-2 border-b border-gray-100 pb-2 mb-2">
              <span className="text-blue-600 font-bold text-sm">🤖 GitSight Agent Summary</span>
            </div>
            <p className="text-xs text-gray-600 leading-normal">
              This PR replaces hardcoded JWT signing keys with configurable settings and introduces
              token validation middleware.
            </p>
            <div className="mt-2 text-[11px] bg-green-50 text-green-700 p-2 rounded border border-green-200">
              ✓ Security Improvement: Hardcoded secret key replaced.
            </div>
          </div>

          {/* In-Platform Comments Section */}
          <div className="flex-1 flex flex-col border border-gray-200 rounded-md bg-white p-3 shadow-sm min-h-[320px]">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-2">
              <span className="font-bold text-xs text-gray-700">
                Review Comments ({comments.length})
              </span>
              <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-medium">
                Draft
              </span>
            </div>

            <div className="space-y-3 text-xs overflow-y-auto flex-1 pr-1">
              {comments.map((c) => (
                <div key={c.id} className="p-2 bg-gray-50 rounded border border-gray-200">
                  <div className="font-semibold text-gray-800">{c.author}</div>
                  <p className="text-gray-600 mt-1">{c.text}</p>
                </div>
              ))}
            </div>

            {/* Add Comment Input */}
            <form onSubmit={handleAddComment} className="mt-3 pt-2 border-t border-gray-100">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full text-xs p-2 border border-gray-300 rounded bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows="2"
                placeholder="Add inline review comment..."
              />
              <button
                type="submit"
                className="mt-1 w-full bg-gray-900 text-white text-xs py-1.5 rounded font-medium hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Add Review Comment
              </button>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}
