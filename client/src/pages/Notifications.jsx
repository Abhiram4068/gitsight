import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatRelativeTime } from '../utils/datetimeFormatter';

// Generate dummy notifications
const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    type: 'critical',
    title: 'Critical Security Vulnerability Detected',
    message: 'GitSight identified a hardcoded AWS access key in Pull Request #42 on payment-service.',
    repo: 'payment-service',
    isRead: false,
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 mins ago
  },
  {
    id: '2',
    type: 'success',
    title: 'AI Review Completed',
    message: 'Review for backend-api PR #128 has finished. 3 low-priority issues were found.',
    repo: 'backend-api',
    isRead: false,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  },
  {
    id: '3',
    type: 'warning',
    title: 'Repository Health Drop',
    message: 'The health score for frontend dropped from 92 to 84 due to a high volume of unresolved bugs.',
    repo: 'frontend',
    isRead: true,
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  },
  {
    id: '4',
    type: 'info',
    title: 'New Webhook Configured',
    message: 'A new GitHub webhook was successfully registered for the mobile-app repository.',
    repo: 'mobile-app',
    isRead: true,
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
  },
  {
    id: '5',
    type: 'warning',
    title: 'High Risk Pull Request',
    message: 'PR #15 in payment-service touches 12 core files and introduces raw SQL statements.',
    repo: 'payment-service',
    isRead: true,
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
  },
];

export default function Notifications() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [filter, setFilter] = useState('all'); // 'all' or 'unread'

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const markAsRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    return true;
  });

  const getIconForType = (type) => {
    switch (type) {
      case 'critical':
        return <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600"><i className="fa-solid fa-shield-cat"></i></div>;
      case 'success':
        return <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"><i className="fa-solid fa-check-double"></i></div>;
      case 'warning':
        return <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600"><i className="fa-solid fa-triangle-exclamation"></i></div>;
      case 'info':
      default:
        return <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><i className="fa-solid fa-circle-info"></i></div>;
    }
  };

  return (
    <div>
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-gray-200 gap-3">
        <div>
          <nav className="flex items-center space-x-1.5 text-xs text-gray-500 mb-1">
            <Link to="/" className="hover:underline hover:text-gray-900 cursor-pointer transition-colors">
              Home
            </Link>
            <span className="text-gray-400">&gt;</span>
            <span className="font-bold text-gray-900">Notifications</span>
          </nav>
          <h1 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
            <span className="font-bold text-blue-700">Notifications</span>
            {unreadCount > 0 && (
              <span className="text-blue-700 text-[14px] font-bold px-1.5 py-0.5 rounded-full ">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Stay updated on high-risk pull requests, review completions, and security alerts.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="text-xs border bg-white border-gray-300 px-3 py-1.5 rounded-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm font-medium"
          >
            <i className="fa-solid fa-check-double"></i>
            <span>Mark all as read</span>
          </button>
        </div>
      </div>

      <div className="mt-4 bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        {/* Controls / Tabs */}
        <div className="flex items-center border-b border-gray-100 bg-gray-50/50 overflow-x-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 sm:px-5 py-2.5 sm:py-3 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap ${
              filter === 'all'
                ? 'text-blue-700 border-b-2 border-blue-600 bg-white'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            All Notifications
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 sm:px-5 py-2.5 sm:py-3 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              filter === 'unread'
                ? 'text-blue-700 border-b-2 border-blue-600 bg-white'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Unread
            {unreadCount > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${filter === 'unread' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'}`}>
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-gray-400">
              <i className="fa-regular fa-bell-slash text-4xl mb-3 text-gray-300"></i>
              <p className="text-sm font-medium text-gray-600">You're all caught up!</p>
              <p className="text-xs mt-1">No notifications found.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-3 sm:p-4 flex items-start gap-3 sm:gap-4 transition-colors hover:bg-gray-50/80 ${
                    !notification.isRead ? 'bg-blue-50/20 relative' : 'bg-white'
                  }`}
                  onClick={() => !notification.isRead && markAsRead(notification.id)}
                >
                  {/* Unread indicator dot */}
                  {!notification.isRead && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                  )}

                  {getIconForType(notification.type)}

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 mb-1">
                      <h3 className={`text-sm ${!notification.isRead ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'}`}>
                        {notification.title}
                      </h3>
                      <span className="text-[11px] text-gray-500 whitespace-nowrap">
                        {formatRelativeTime(notification.timestamp)}
                      </span>
                    </div>
                    
                    <p className={`text-xs ${!notification.isRead ? 'text-gray-700 font-medium' : 'text-gray-600'}`}>
                      {notification.message}
                    </p>
                    
                    <div className="mt-2.5 flex items-center gap-2">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded border border-gray-200 bg-gray-50 text-[10px] font-medium text-gray-600">
                        <i className="fa-brands fa-github mr-1"></i> {notification.repo}
                      </span>
                      {!notification.isRead && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
