import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Header({ user, onLogout }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fallback mock user object if no user prop is provided
  const currentUser = user || {
    username: 'octocat github',
    avatarUrl: 'https://github.com/github.png',
    role: 'User'
  };

  // Close dropdown when clicking outside of the element
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    setIsDropdownOpen(false);
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
        <button className="hover:text-gray-900 text-sm flex items-center space-x-1 cursor-pointer">
          <i className="fa-solid fa-magnifying-glass text-xs"></i> <span>Search Repos</span>
        </button>

        {/* User Entity Info */}
        <div className="flex items-center space-x-2 pl-2 border-l border-gray-200">
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

          <div className="flex flex-col text-left leading-none">
            <span className="text-xs font-semibold text-gray-800">
              {currentUser.username}
            </span>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
              {currentUser.role}
            </span>
          </div>
        </div>

        {/* User Initials Trigger with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            title="Account Menu"
            className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-xs border hover:opacity-90 transition-opacity cursor-pointer focus:outline-none"
          >
            {currentUser.username ? currentUser.username.charAt(0).toUpperCase() + " " + currentUser.username.charAt(1).toUpperCase() : 'GH'}
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 shadow-md py-1 z-50 rounded-none">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-900 truncate">
                  {currentUser.username}
                </p>
                <p className="text-[10px] text-gray-500 truncate">
                  Signed in via GitHub
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-gray-50 font-medium flex items-center space-x-2 cursor-pointer"
              >
                <i className="fa-solid fa-right-from-bracket text-xs"></i>
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}