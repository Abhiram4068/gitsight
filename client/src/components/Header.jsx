import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api/auth';

export default function Header({ user, loading, onLogout, onMenuToggle, sidebarOpen }) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [allowEmailNotifications, setAllowEmailNotifications] = useState(
    user?.isEmailAllowed !== undefined ? user.isEmailAllowed : false
  );
  const [isTogglingEmail, setIsTogglingEmail] = useState(false);

  useEffect(() => {
    if (user && typeof user.isEmailAllowed === 'boolean') {
      setAllowEmailNotifications(user.isEmailAllowed);
    }
  }, [user?.isEmailAllowed]);

  const handleToggleEmail = async () => {
    if (isTogglingEmail) return;
    setIsTogglingEmail(true);
    const previousState = allowEmailNotifications;
    setAllowEmailNotifications(!previousState);

    try {
      const data = await authApi.toggleEmail();
      if (data && typeof data.isEmailAllowed === 'boolean') {
        setAllowEmailNotifications(data.isEmailAllowed);
        if (user) {
          user.isEmailAllowed = data.isEmailAllowed;
        }
      }
    } catch (error) {
      console.error('Failed to toggle email notifications:', error);
      setAllowEmailNotifications(previousState);
    } finally {
      setIsTogglingEmail(false);
    }
  };

  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);

  const isLoading = loading || !user;

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowLogoutConfirm(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotificationMenu(false);
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
    <header className="h-14 border-b border-gray-800 flex items-center justify-between px-4 sm:px-6 bg-gray-900 shrink-0 relative z-40 shadow-sm">
      <div className="flex items-center space-x-3">
        {/* Hamburger button — mobile only */}
        <button
          onClick={onMenuToggle}
          aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
          className="lg:hidden flex items-center justify-center w-8 h-8 rounded text-white hover:bg-gray-800 transition-colors shrink-0"
        >
          <i className={`fa-solid ${sidebarOpen ? 'fa-xmark' : 'fa-bars'} text-base`}></i>
        </button>

        {/* Logo and Title */}
        <Link to="/" className="flex items-center space-x-2.5 group">
          <img src="/gitsight.svg" alt="GitSight Logo" className="w-5 h-5 object-contain brightness-0 invert" />
          <div className="text-white text-md font-bold tracking-wider ">
            GitSight.
          </div>
        </Link>
      </div>

      <div className="flex items-center space-x-4 text-white">

        {/* Mail / Notification Settings Dropdown */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => {
              setShowNotificationMenu((prev) => !prev);
              setShowLogoutConfirm(false);
            }}
            aria-label="Notification settings"
            className="flex items-center justify-center w-8 h-8 rounded-full text-white hover:bg-gray-800 transition-colors relative cursor-pointer"
          >
            <i className="fa-solid fa-envelope text-base"></i>
            {/* Status indicator badge */}
            <span
              className={`absolute top-0 right-0 w-3.5 h-3.5 rounded-full ring-2 ring-gray-900 flex items-center justify-center text-[8px] text-white ${
                allowEmailNotifications ? 'bg-emerald-500' : 'bg-red-500'
              }`}
            >
              <i className={`fa-solid ${allowEmailNotifications ? 'fa-check' : 'fa-xmark'}`}></i>
            </span>
          </button>

          {showNotificationMenu && (
            <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] bg-white shadow-xl border border-gray-200 py-3.5 px-4 z-50 animate-in fade-in zoom-in-95 duration-100 rounded-md text-gray-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                  <i className="fa-solid fa-bell text-gray-700 text-xs"></i> Email Preferences
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${allowEmailNotifications ? 'text-gray-800' : 'text-gray-500'}`}>
                  {allowEmailNotifications ? 'Allowed' : 'Blocked'}
                </span>
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-3">
                <label htmlFor="email-toggle" className="text-xs text-gray-600 font-medium leading-tight cursor-pointer select-none">
                  Allow or block email notifications from this app
                </label>
                
                {/* Toggle Switch */}
                <button
                  id="email-toggle"
                  type="button"
                  role="switch"
                  aria-checked={allowEmailNotifications}
                  disabled={isTogglingEmail}
                  onClick={handleToggleEmail}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed ${
                    allowEmailNotifications ? 'bg-gray-700' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      allowEmailNotifications ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Entity Info */}
        <div className="flex items-center space-x-3 sm:space-x-6 pl-3 sm:pl-4 border-l border-gray-800">
          
          {isLoading ? (
            /* User Info Skeleton */
            <div className="flex items-center space-x-2 sm:space-x-2.5 animate-pulse">
              <div className="w-7 h-7 rounded-full bg-gray-700"></div>
              <div className="hidden sm:flex flex-col space-y-1.5 text-left">
                <div className="w-20 h-2.5 bg-gray-700 rounded"></div>
                <div className="w-28 h-2 bg-gray-700/70 rounded"></div>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2 sm:space-x-2.5">
              <div className="flex items-center justify-center">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.username}
                    className="w-7 h-7 rounded-full border border-gray-700 object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gray-700 text-white font-bold text-xs flex items-center justify-center border border-gray-600">
                    {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
              </div>
          
              <div className="hidden sm:flex flex-col text-left leading-none">
                <span className="text-xs font-semibold text-white">
                  {user.username}
                </span>
                <span className="text-[10px] tracking-wider font-medium text-gray-300">
                  {user.email}
                </span>
              </div>
            </div>
          )}

          {/* Logout Container with Confirmation Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => {
                setShowLogoutConfirm((prev) => !prev);
                setShowNotificationMenu(false);
              }}
              aria-expanded={showLogoutConfirm}
              aria-label="Toggle logout confirmation"
              className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 border border-red-500/40 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors cursor-pointer shadow-2xs"
            >
              <i className="fa-solid fa-right-from-bracket text-[11px]"></i>
              <span className="hidden sm:inline">Logout</span>
            </button>

            {showLogoutConfirm && (
              <div className="absolute right-0 mt-2 w-56 bg-white shadow-xl border border-gray-200 py-3 px-3.5 z-50 animate-in fade-in zoom-in-95 duration-100 rounded-md">
                <p className="text-xs font-medium text-gray-800 mb-2.5 leading-relaxed">
                  Are you sure you want to log out?
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleLogoutConfirm}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-1.5 px-3 transition-colors shadow-xs text-center rounded"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold py-1.5 px-3 transition-colors text-center border border-gray-200 rounded"
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