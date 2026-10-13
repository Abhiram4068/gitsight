import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Header({ user, onLogout, onMenuToggle, sidebarOpen }) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const dropdownRef = useRef(null);

  // Fallback mock user object if no user prop is provided
  const currentUser = user || {
    username: 'octocat github',
    email: 'octocat@github.com',
    avatarUrl: 'https://github.com/github.png',
    role: 'User'
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowLogoutConfirm(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogoutConfirm = () => {
    setShowLogoutConfirm(false);
    if (onLogout) {
      onLogout();
    } else {
      console.log('User logged out');
    }
  };

  return (
    <header className="h-14 border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 bg-white shrink-0 relative z-40">
      <div className="flex items-center space-x-3">
        {/* Hamburger button — mobile only */}
        <button
          onClick={onMenuToggle}
          aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
          className="lg:hidden flex items-center justify-center w-8 h-8 rounded text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
        >
          <i className={`fa-solid ${sidebarOpen ? 'fa-xmark' : 'fa-bars'} text-base`}></i>
        </button>

        <Link to="/" className="flex items-center space-x-2.5 group">
          <img src="/gitsight.svg" alt="GitSight Logo" className="w-5 h-5 object-contain" />
          <div className="text-black text-md font-bold tracking-wider group-hover:text-blue-600 transition-colors">
            GitSight.
          </div>
        </Link>
      </div>

      <div className="flex items-center space-x-4 text-gray-600">

        {/* User Entity Info */}
        <div className="flex items-center space-x-3 sm:space-x-6 pl-3 sm:pl-4 border-l border-gray-200">
          
          <div className="flex items-center space-x-2 sm:space-x-2.5">
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
        
            <div className="hidden sm:flex flex-col text-left leading-none">
              <span className="text-xs font-semibold text-gray-800">
                {currentUser.username}
              </span>
              <span className="text-[10px] text-gray-500 tracking-wider font-medium">
                {currentUser.email}
              </span>
            </div>
          </div>

          {/* Logout Container with Confirmation Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowLogoutConfirm((prev) => !prev)}
              aria-expanded={showLogoutConfirm}
              aria-label="Toggle logout confirmation"
              className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-sm border border-red-700 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 transition-colors cursor-pointer shadow-sm"
            >
              <i className="fa-solid fa-right-from-bracket text-[11px]"></i>
              <span className="hidden sm:inline">Logout</span>
            </button>

            {showLogoutConfirm && (
              <div className="absolute right-0 mt-2 w-56 bg-white  shadow-lg border border-gray-200 py-3 px-3.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <p className="text-xs font-medium text-gray-800 mb-2.5 leading-relaxed">
                  Are you sure you want to log out?
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleLogoutConfirm}
                    className="flex-1 bg-red-700 hover:bg-red-800 text-white text-xs font-semibold py-1.5 px-3  transition-colors shadow-sm text-center"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold py-1.5 px-3  transition-colors text-center border border-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}