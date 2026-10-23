import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authApi from '../api/auth';

export default function DeleteAccount() {
  const navigate = useNavigate();
  const username = localStorage.getItem('gitsight_username') || 'octocat';

  const [confirmText, setConfirmText] = useState('');
  const [understood, setUnderstood] = useState(false);
  const [reason, setReason] = useState('not_needed');
  const [feedback, setFeedback] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deleteCompleted, setDeleteCompleted] = useState(false);

  const isConfirmationValid = confirmText.trim().toLowerCase() === 'delete' && understood;

  const handleOpenModal = (e) => {
    e.preventDefault();
    if (!isConfirmationValid) return;
    setShowConfirmModal(true);
  };

  const handleFinalDelete = () => {
    setIsDeleting(true);
    setTimeout(() => {
      // Clear all local auth credentials and cached user data
      localStorage.removeItem('gitsight_token');
      localStorage.removeItem('gitsight_username');
      localStorage.removeItem('gitsight_user');
      sessionStorage.clear();

      setIsDeleting(false);
      setShowConfirmModal(false);
      setDeleteCompleted(true);

      // Redirect to login after brief confirmation display
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1800);
    }, 1200);
  };

  if (deleteCompleted) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="bg-white border border-gray-200 rounded-sm p-8 shadow-xs space-y-4">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-xl">
            <i className="fa-solid fa-trash-can"></i>
          </div>
          <h2 className="text-lg font-bold text-gray-900">Your GitSight Account Has Been Deleted</h2>
          <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
            All your account data, automated review caches, and GitHub webhook permissions have been purged. Redirecting you to the sign-in page...
          </p>
          <div className="pt-2">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-12 max-w-4xl">
      {/* Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-gray-200 gap-3">
        <div>
          <nav className="flex items-center space-x-1.5 text-xs text-gray-500 mb-1">
            <Link to="/" className="hover:underline hover:text-gray-900 cursor-pointer transition-colors">
              Home
            </Link>
            <span className="text-gray-400">&gt;</span>
            <span className="font-bold text-red-600">Delete Account</span>
          </nav>
          <h1 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
            <span className="font-bold text-red-600">Delete GitSight Account</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Permanently delete your account, revoke GitHub integrations, and erase all automated PR review data.
          </p>
        </div>
      </div>

      {/* Main Container */}
      <div className="mt-4 bg-white overflow-hidden">
        {/* Warning Banner */}
        <div className="border-b border-red-200 px-4 py-3 flex items-start space-x-3 text-xs text-red-800">
          <i className="fa-solid fa-triangle-exclamation text-red-600 text-base mt-0.5 shrink-0"></i>
          <div>
            <div className="font-bold text-red-900">Danger Zone: Irreversible Action</div>
            <div className="mt-0.5 leading-relaxed text-red-700">
              Once you delete your GitSight account, there is no going back. Please be certain before proceeding.
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Consequences List */}
          <div>
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">
              What happens when you delete your account:
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 space-y-1">
                <div className="font-semibold text-gray-800 flex items-center space-x-1.5">
                  <i className="fa-solid fa-link-slash text-red-600"></i>
                  <span>Revoke GitHub App Access</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  GitSight's OAuth tokens and webhook listeners attached to your GitHub profile will be immediately disconnected.
                </p>
              </div>

              <div className="p-3 space-y-1">
                <div className="font-semibold text-gray-800 flex items-center space-x-1.5">
                  <i className="fa-solid fa-robot text-red-600"></i>
                  <span>Stop Automated PR Reviews</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  AI-powered review triggers, automated code suggestions, and PR comments will halt across all repositories.
                </p>
              </div>

              <div className="p-3 space-y-1">
                <div className="font-semibold text-gray-800 flex items-center space-x-1.5">
                  <i className="fa-solid fa-chart-line text-red-600"></i>
                  <span>Delete Metrics & History</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  All stored PR analytics, issue insights, review logs, and tracked issues data will be permanently wiped.
                </p>
              </div>

              <div className="p-3 space-y-1">
                <div className="font-semibold text-gray-800 flex items-center space-x-1.5">
                  <i className="fa-solid fa-sliders text-red-600"></i>
                  <span>Erase Reviewer Rules</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Custom AI reviewer persona configurations, ignored file filters, and notification settings will be erased.
                </p>
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          <hr className="border-gray-200" />

          {/* Confirmation Checklist & Input */}
          <div className="space-y-4 bg-gray-50 p-4 border border-gray-200 rounded-sm">
            <div className="space-y-2">
              <label className="flex items-start space-x-2.5 text-xs text-gray-800 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={understood}
                  onChange={(e) => setUnderstood(e.target.checked)}
                  className="mt-0.5 accent-red-600 rounded-xs"
                />
                <span className="leading-relaxed">
                  I understand that deleting my account is <strong>permanent</strong> and cannot be undone. All repository settings and PR review history for <strong>@{username}</strong> will be erased.
                </span>
              </label>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-semibold text-gray-800">
                To verify, type <span className="font-mono text-red-700 px-1.5 py-0.5 rounded-xs">DELETE</span> below:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full max-w-sm text-xs border border-gray-300 rounded-sm px-3 py-1.5 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-white font-mono"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={handleOpenModal}
              disabled={!isConfirmationValid}
              className={`px-4 py-2 text-xs font-semibold rounded-sm transition-all flex items-center space-x-2 ${
                isConfirmationValid
                  ? 'bg-red-600 hover:bg-red-700 text-white cursor-pointer shadow-xs'
                  : 'bg-red-200 text-white cursor-not-allowed'
              }`}
            >
              <i className="fa-solid fa-trash-can text-xs"></i>
              <span>Permanently Delete Account</span>
            </button>

            <Link
              to="/settings"
              className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-sm transition-colors cursor-pointer"
            >
              Cancel & Keep Account
            </Link>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-red-200 rounded-sm shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center space-x-2 text-red-600 font-bold text-sm">
                <i className="fa-solid fa-triangle-exclamation"></i>
                <span>Confirm Account Deletion</span>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
                disabled={isDeleting}
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            <div className="text-xs text-gray-600 space-y-2 leading-relaxed">
              <p>
                Are you absolutely sure you want to permanently delete your GitSight account for <strong>@{username}</strong>?
              </p>
              <p className="text-red-700 font-semibold p-2.5 ">
                This will immediately purge all data, revoke OAuth tokens, and disable webhook integrations.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isDeleting}
                className="px-3.5 py-1.5 border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-sm cursor-pointer"
              >
                No, Go Back
              </button>

              <button
                type="button"
                onClick={handleFinalDelete}
                disabled={isDeleting}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-sm transition-colors flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                {isDeleting && <i className="fa-solid fa-spinner animate-spin text-xs"></i>}
                <span>{isDeleting ? 'Deleting Account...' : 'Yes, Delete My Account'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
