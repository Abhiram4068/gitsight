import React from "react";
import { NavLink, useLocation } from "react-router-dom";

export default function Sidebar() {
  const location = useLocation();
  const isPullRequests = location.pathname.includes("pull-requests");

  return (
    <aside className="w-64 py-4 border-r border-gray-200 space-y-6 bg-gray-100 select-none shrink-0 min-h-[calc(100vh-3.5rem)]">
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
          to="/issues"
          className={({ isActive }) =>
            `flex items-center space-x-3 px-6 py-2.5 text-xs font-medium transition-colors ${
              isActive
                ? "text-blue-600 bg-blue-50/50 border-r-2 border-blue-600"
                : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
            }`
          }
        >
          <i className="fa-solid fa-circle-exclamation w-4 text-center"></i>{" "}
          <span>Issues</span>
        </NavLink>
        <hr className="border-gray-200" />
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
  );
}
