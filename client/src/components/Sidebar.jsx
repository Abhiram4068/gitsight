import React from "react";
import { NavLink, useLocation } from "react-router-dom";

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const isPullRequests = location.pathname.includes("pull-requests");

  return (
    <>
      {/* Sidebar â€” hidden off-screen on mobile, slides in when open; always visible on lg+ */}
      <aside
        className={`
          fixed top-14 left-0 bottom-0 w-64 z-40
          py-4 border-r border-gray-200 space-y-6 bg-gray-100 select-none
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:static lg:translate-x-0 lg:top-auto lg:bottom-auto lg:z-auto
          lg:min-h-[calc(100vh-3.5rem)] lg:shrink-0 overflow-y-auto
        `}
      >
        {/* Close button â€” mobile only */}
        <button
          onClick={onClose}
          aria-label="Close menu"
          className="lg:hidden absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded text-gray-500 hover:bg-gray-200 transition-colors"
        >
          <i className="fa-solid fa-xmark text-sm"></i>
        </button>

        {/* Navigation links */}
        <nav className="flex flex-col">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center space-x-3 px-6 py-2.5 text-xs font-medium transition-colors ${
                isActive
                  ? "text-blue-600 bg-blue-50/50 border-r-2 border-blue-600"
                  : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
              }`
            }
          >
            <i className="fa-solid fa-table-columns w-4 text-center"></i>{" "}
            <span>Dashboard</span>
          </NavLink>

          <hr className="border-gray-200" />
          <NavLink
            to="/repositories"
            className={({ isActive }) =>
              `flex items-center space-x-3 px-6 py-2.5 text-xs font-medium transition-colors ${
                isActive
                  ? "text-blue-600 bg-blue-50/50 border-r-2 border-blue-600"
                  : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
              }`
            }
          >
            <i className="fa-solid fa-box-archive w-4 text-center"></i>{" "}
            <span>Repositories</span>
          </NavLink>

          <hr className="border-gray-200" />
          <NavLink
            to="/pull-requests"
            className={({ isActive }) =>
              `flex items-center space-x-3 px-6 py-2.5 text-xs font-medium transition-colors ${
                isActive
                  ? "text-blue-600 bg-blue-50/50 border-r-2 border-blue-600"
                  : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
              }`
            }
          >
            <i className="fa-solid fa-code-pull-request w-4 text-center"></i>{" "}
            <span>Pull Requests</span>
          </NavLink>
          <hr className="border-gray-200" />
          <NavLink
            to="/tracked-issues"
            className={({ isActive }) =>
              `flex items-center space-x-3 px-6 py-2.5 text-xs font-medium transition-colors ${
                isActive
                  ? "text-blue-600 bg-blue-50/50 border-r-2 border-blue-600"
                  : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
              }`
            }
          >
            <i className="fa-solid fa-circle-exclamation w-4 text-center"></i>{" "}
            <span>Tracked Issues</span>
          </NavLink>
          <hr className="border-gray-200" />
          {/* <NavLink
            to="/analytics"
            className={({ isActive }) =>
              `flex items-center space-x-3 px-6 py-2.5 text-xs font-medium transition-colors ${
                isActive
                  ? "text-blue-600 bg-blue-50/50 border-r-2 border-blue-600"
                  : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
              }`
            }
          >
            <i className="fa-solid fa-chart-column w-4 text-center"></i>{" "}
            <span>Analytics</span>
          </NavLink>
          <hr className="border-gray-200" />
          <NavLink
            to="/webhooks"
            className={({ isActive }) =>
              `flex items-center space-x-3 px-6 py-2.5 text-xs font-medium transition-colors ${
                isActive
                  ? "text-blue-600 bg-blue-50/50 border-r-2 border-blue-600"
                  : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
              }`
            }
          >
            <i className="fa-solid fa-gears w-4 text-center"></i>{" "}
            <span>Webhooks</span>
          </NavLink>
          <hr className="border-gray-200" />       
          <NavLink
            to="/review-rules"
            className={({ isActive }) =>
              `flex items-center space-x-3 px-6 py-2.5 text-xs font-medium transition-colors ${
                isActive
                  ? "text-blue-600 bg-blue-50/50 border-r-2 border-blue-600"
                  : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
              }`
            }
          >
            <i className="fa-solid fa-sliders  w-4 text-center"></i>{" "}
            <span>Configure Rules</span>
          </NavLink>
          <hr className="border-gray-200" /> 
          <NavLink
            to="/pipelines"
            className={({ isActive }) =>
              `flex items-center space-x-3 px-6 py-2.5 text-xs font-medium transition-colors ${
                isActive
                  ? "text-blue-600 bg-blue-50/50 border-r-2 border-blue-600"
                  : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
              }`
            }
          >
            <i className="fa-solid fa-play w-4 text-center"></i>{" "}
            <span>Pipelines</span>
          </NavLink>
          <hr className="border-gray-200" />
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center space-x-3 px-6 py-2.5 text-xs font-medium transition-colors ${
                isActive
                  ? "text-blue-600 bg-blue-50/50 border-r-2 border-blue-600"
                  : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
              }`
            }
          >
            <i className="fa-solid fa-gear w-4 text-center"></i>{" "}
            <span>Settings</span>
          </NavLink>
          <hr className="border-gray-200" />
          <NavLink
            to="/notifications"
            className={({ isActive }) =>
              `flex items-center space-x-3 px-6 py-2.5 text-xs font-medium transition-colors ${
                isActive
                  ? "text-blue-600 bg-blue-50/50 border-r-2 border-blue-600"
                  : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
              }`
            }
          >
            <i className="fa-solid fa-bell w-4 text-center"></i>{" "}
            <span>Notifications</span>
          </NavLink>
          <hr className="border-gray-200" />
          <a
            href="https://github.com/settings/profile"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-3 px-6 py-2.5 text-xs font-medium transition-colors text-gray-600 hover:bg-gray-200 hover:text-gray-900"
          >
            <i className="fa-brands fa-github w-4 text-center"></i>{" "}
            <span>GitHub Profile</span>
          </a>
          <hr className="border-gray-200" />
          <NavLink
            to="/delete-account"
            className={({ isActive }) =>
              `flex items-center space-x-3 px-6 py-2.5 text-xs font-medium transition-colors ${
                isActive
                  ? "text-red-700 bg-red-50 border-r-2 border-red-600 font-semibold"
                  : "text-red-600 hover:bg-red-50 hover:text-red-700"
              }`
            }
          >
            <i className="fa-solid fa-trash-can w-4 text-center"></i>{" "}
            <span>Delete Account</span>
          </NavLink>
          <hr className="border-gray-200" /> */}
        </nav>

        {/* Filter Repository Widget on Pull Requests */}
        {/* {isPullRequests && (
          <div className="p-3 text-xs bg-white border border-gray-200 rounded-md shadow-sm">
            <div className="font-semibold text-gray-700">Filter Repository</div>
            <select className="w-full mt-2 p-1.5 border border-gray-300 rounded text-xs bg-gray-50 text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option>All Repositories</option>
              <option defaultValue="fastapi-backend-service">fastapi-backend-service</option>
              <option>react-frontend-app</option>
            </select>
          </div>
        )} */}

        {/* Active PR Webhook Queue */}
        {/* <div className="border border-gray-200 rounded-md overflow-hidden bg-white shadow-sm">
          <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex justify-between items-center text-xs font-bold text-gray-600 uppercase tracking-wider">
            <span>Incoming Webhooks</span>
            <span className="flex items-center gap-1"><i className="fa-solid fa-bolt "></i> Live</span>
          </div>
          <div className="p-3 text-xs text-gray-500 bg-white space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-mono text-gray-700">pr.opened #42</span>
              <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[10px]">
                Triggered
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-mono text-gray-700">pr.synchronize #39</span>
              <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px]">
                Analyzing
              </span>
            </div>
          </div>
        </div> */}

        {/* Agent Status */}
        {/* <div className="border border-gray-200 rounded-md overflow-hidden bg-white shadow-sm">
          <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex justify-between items-center text-xs font-bold text-gray-600 uppercase tracking-wider">
            <span>GitSight Engine</span>
            <span className="text-green-600 font-bold">Online</span>
          </div>
          <div className="p-3 text-xs text-gray-500 bg-white space-y-1.5">
            <div className="flex justify-between">
              <span>Diff Parsing</span>
              <span className="text-green-600 font-medium">Ready</span>
            </div>
            <div className="flex justify-between">
              <span>Comment Engine</span>
              <span className="text-green-600 font-medium">Ready</span>
            </div>
          </div>
        </div> */}
      </aside>
    </>
  );
}
