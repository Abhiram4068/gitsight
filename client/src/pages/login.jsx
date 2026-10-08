import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authApi } from '../api/auth';

export default function Login() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const username = searchParams.get('username');
    const error = searchParams.get('error');

    if (error) {
      setErrorMessage(decodeURIComponent(error));
      return;
    }

    if (token) {
      setIsProcessing(true);
      localStorage.setItem('gitsight_token', token);
      if (username) {
        localStorage.setItem('gitsight_username', username);
      }
      // Redirect to dashboard upon successful login
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 500);
    } else {
      // If already logged in, redirect directly to dashboard
      const existingToken = authApi.getToken();
      if (existingToken) {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [searchParams, navigate]);

  const handleGitHubLogin = () => {
    setErrorMessage('');
    // Trigger GitHub OAuth flow via backend /api/auth/login endpoint
    authApi.loginWithGitHub();
  };

  return (
    <div className="bg-gray-50 text-gray-900 min-h-screen flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm max-w-sm w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center text-black font-semibold text-2xl tracking-tight">
          GitSight Login
        </div>

        <div>
          <h1 className="text-lg font-semibold text-gray-900">Sign in to your account</h1>
          <p className="text-xs text-gray-500 mt-1">
            Automated AI code reviews for your GitHub repositories
          </p>
        </div>

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded text-left">
            ⚠️ <strong>Authentication Error:</strong> {errorMessage}
          </div>
        )}

        {isProcessing ? (
          <div className="py-6 space-y-2">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-gray-600 font-medium">Authenticating with GitHub...</p>
          </div>
        ) : (
          <button
            onClick={handleGitHubLogin}
            type="button"
            className="w-full flex items-center justify-center space-x-2 bg-gray-900 hover:bg-black text-white py-2.5 px-4 rounded-md font-medium text-sm transition-colors shadow cursor-pointer"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
            <span>Sign in with GitHub SSO</span>
          </button>
        )}
      </div>
    </div>
  );
}
