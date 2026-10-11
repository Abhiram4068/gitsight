import React from 'react';
import { Link } from 'react-router-dom';

export default function Header({ user, onLogout }) {
  // Fallback mock user object if no user prop is provided
  const currentUser = user || {
    username: 'octocat github',
    email: 'octocat@github.com',
    avatarUrl: 'https://github.com/github.png',
    role: 'User'
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      console.log('User logged out');
    }
  };

  return (
    <header className="h-14 border-b border-gray-200 flex items-center justify-between px-6 bg-white shrink-0 relative">
      <div className="flex items-center space-x-3">
        <Link to="/" className="flex items-center space-x-3">
          <div className="text-black p-1.5 text-md font-bold tracking-wider">
            GitSight.
          </div>
        </Link>
      </div>

      <div className="flex items-center space-x-4 text-gray-600">

        {/* User Entity Info */}
        {/* User Entity Info */}
        <div className="flex items-center space-x-6 pl-4 border-l border-gray-200">
          
          <div className="flex items-center space-x-2.5">
            <div className="flex items-center justify-center">
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.username}
                  className="w-7 h-7 rounded-full border border-gray-200 object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-700 font-bold text-xs flex items-center justify-center border">
                  {currentUser.username ? currentUser.username.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
            </div>
        
            <div className="flex flex-col text-left leading-none">
              <span className="text-xs font-semibold text-gray-800">
                {currentUser.username}
              </span>
              <span className="text-[10px] text-gray-500 tracking-wider font-medium">
                {currentUser.email}
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-sm border border-red-700 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors cursor-pointer shadow-sm"
          >
            <i className="fa-solid fa-right-from-bracket text-[11px]"></i>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}