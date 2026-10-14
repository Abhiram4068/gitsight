import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
    <div className="bg-slate-50 text-slate-900 min-h-screen flex items-center justify-center p-4 font-sans antialiased selection:bg-slate-900 selection:text-white">
      <div className="p-8 flex flex-col items-center justify-center space-y-10 max-w-sm w-full text-center -mt-24">
        <div className="flex flex-col items-center space-y-4">
          {/* Logo & Brand Header */}
          <div className="inline-flex items-center justify-center space-x-2.5 text-slate-900 font-bold text-2xl tracking-tight">
            <img src="/gitsight.svg" alt="GitSight Logo" className="w-7 h-7 object-contain" />
            <span>GitSight Sign In</span>
          </div>

          <div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Sign in to unlock AI-powered insights for your repositories.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="bg-red-50/80 border border-red-200/80 text-red-700 text-xs p-3 rounded-lg text-left shadow-sm">
            ⚠️ <strong>Authentication Error:</strong> {errorMessage}
          </div>
        )}

        {isProcessing ? (
          <div className="py-6 space-y-3">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-600 font-medium tracking-wide">Authenticating with GitHub...</p>
          </div>
        ) : (
          <button
            onClick={handleGitHubLogin}
            type="button"
            className="w-full flex items-center justify-center space-x-2.5 bg-slate-900 hover:bg-black active:scale-[0.99] text-white py-2.5 px-4  font-medium text-sm transition-all duration-150 shadow-md hover:shadow-lg cursor-pointer"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
            <span>Sign in with GitHub</span>
          </button>
        )}
      </div>
    </div>
  );
}