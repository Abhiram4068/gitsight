import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Analytics() {
  const [selectedRepo, setSelectedRepo] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

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
            <span className="font-bold text-gray-900">Analytics</span>
          </nav>
          <h1 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
            <span className="font-bold text-blue-700">Analytics</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Engineering intelligence, PR risk metrics, and repository health insights.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs w-full sm:w-auto">
          <div className="flex items-center space-x-2">
            <label className="text-gray-600 font-medium">Repository:</label>
            <select 
              value={selectedRepo}
              onChange={(e) => setSelectedRepo(e.target.value)}
              className="border border-gray-300 rounded-sm px-2 py-1 bg-white text-gray-700 focus:outline-none focus:border-blue-500 shadow-sm text-xs cursor-pointer"
            >
              <option value="all">All Repositories</option>
              <option value="payment-service">payment-service</option>
              <option value="backend-api">backend-api</option>
              <option value="frontend">frontend</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-gray-600 font-medium">Period:</label>
            <select 
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border border-gray-300 rounded-sm px-2 py-1 bg-white text-gray-700 focus:outline-none focus:border-blue-500 shadow-sm text-xs cursor-pointer"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 3 Months</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-4 sm:space-y-6">

        {/* AI Engineering Insight */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 p-3.5 sm:p-4 shadow-sm relative overflow-hidden rounded-sm">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <i className="fa-solid fa-chart-column text-2xl text-indigo-900"></i>
          </div>
          <div className="space-y-2 text-xs text-indigo-800/80 leading-relaxed max-w-2xl relative z-10">
            <p>
              Security-related findings increased <strong>23%</strong> this month, primarily due to recent architectural changes in authentication modules.
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4">
          <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-3 sm:p-4 flex flex-col justify-between">
            <span className="text-gray-500 text-[11px] font-semibold uppercase tracking-wider mb-1 truncate">PRs Reviewed</span>
            <div className="flex items-end justify-between mt-1 sm:mt-2">
              <span className="text-xl sm:text-2xl font-bold text-gray-900">248</span>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-3 sm:p-4 flex flex-col justify-between">
            <span className="text-gray-500 text-[11px] font-semibold uppercase tracking-wider mb-1 truncate">Issues Found</span>
            <div className="flex items-end justify-between mt-1 sm:mt-2">
              <span className="text-xl sm:text-2xl font-bold text-gray-900">631</span>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-3 sm:p-4 flex flex-col justify-between">
            <span className="text-gray-500 text-[11px] font-semibold uppercase tracking-wider mb-1 truncate">Security Bugs</span>
            <div className="flex items-end justify-between mt-1 sm:mt-2">
              <span className="text-xl sm:text-2xl font-bold text-red-600">18</span>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-3 sm:p-4 flex flex-col justify-between">
            <span className="text-gray-500 text-[11px] font-semibold uppercase tracking-wider mb-1 truncate">Risk Score</span>
            <div className="flex items-end justify-between mt-1 sm:mt-2">
              <span className="text-xl sm:text-2xl font-bold text-amber-600">Low</span>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-3 sm:p-4 flex flex-col justify-between">
            <span className="text-gray-500 text-[11px] font-semibold uppercase tracking-wider mb-1 truncate">Resolution</span>
            <div className="flex items-end justify-between mt-1 sm:mt-2">
              <span className="text-xl sm:text-2xl font-bold text-gray-900">81%</span>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-3 sm:p-4 flex flex-col justify-between">
            <span className="text-gray-500 text-[11px] font-semibold uppercase tracking-wider mb-1 truncate">Avg Review</span>
            <div className="flex items-end justify-between mt-1 sm:mt-2">
              <span className="text-xl sm:text-2xl font-bold text-gray-900">38s</span>
            </div>
          </div>
        </div>

        {/* Charts Section: Severity & Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Severity Distribution */}
          <div className="bg-white border border-gray-200 rounded-sm shadow-sm flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Issue Severity Distribution</h3>
              <i className="fa-solid fa-chart-bar text-gray-400"></i>
            </div>
            <div className="p-5 flex-1 space-y-4">
              
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-gray-700">Critical</span>
                  <span className="text-gray-500">18</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: '8%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-gray-700">High</span>
                  <span className="text-gray-500">94</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-gray-700">Medium</span>
                  <span className="text-gray-500">312</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-amber-400 h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-gray-700">Low</span>
                  <span className="text-gray-500">207</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-blue-400 h-2 rounded-full" style={{ width: '42%' }}></div>
                </div>
              </div>

            </div>
          </div>

          {/* Issue Categories */}
          <div className="bg-white border border-gray-200 rounded-sm shadow-sm flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Issue Categories</h3>
              <i className="fa-solid fa-layer-group text-gray-400"></i>
            </div>
            <div className="p-5 flex-1 space-y-4">
              
              <div className="flex items-center gap-3">
                <div className="w-8 text-right text-xs font-semibold text-gray-700">31%</div>
                <div className="flex-1 bg-gray-100 rounded-r-md h-6 flex items-center overflow-hidden">
                  <div className="bg-indigo-500 h-full flex items-center px-2 text-[10px] text-white font-medium" style={{ width: '31%' }}>Bugs</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 text-right text-xs font-semibold text-gray-700">24%</div>
                <div className="flex-1 bg-gray-100 rounded-r-md h-6 flex items-center overflow-hidden">
                  <div className="bg-blue-500 h-full flex items-center px-2 text-[10px] text-white font-medium" style={{ width: '24%' }}>Code Quality</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 text-right text-xs font-semibold text-gray-700">18%</div>
                <div className="flex-1 bg-gray-100 rounded-r-md h-6 flex items-center overflow-hidden">
                  <div className="bg-red-500 h-full flex items-center px-2 text-[10px] text-white font-medium" style={{ width: '18%' }}>Security</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 text-right text-xs font-semibold text-gray-700">12%</div>
                <div className="flex-1 bg-gray-100 rounded-r-md h-6 flex items-center overflow-hidden">
                  <div className="bg-emerald-500 h-full flex items-center px-2 text-[10px] text-white font-medium whitespace-nowrap" style={{ width: '12%' }}>Perf.</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 text-right text-xs font-semibold text-gray-700">9%</div>
                <div className="flex-1 bg-gray-100 rounded-r-md h-6 flex items-center overflow-hidden">
                  <div className="bg-amber-500 h-full flex items-center px-2 text-[10px] text-white font-medium whitespace-nowrap" style={{ width: '9%' }}>Arch.</div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Repository Health & Risk */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* PR Risk Distribution */}
          <div className="bg-white border border-gray-200 rounded-sm shadow-sm flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">PR Risk Distribution</h3>
              <i className="fa-solid fa-triangle-exclamation text-gray-400"></i>
            </div>
            <div className="p-5 flex-1">
              <div className="mb-4 text-xs text-gray-600">
                GitSight classifies PR risk based on change size, sensitive files, and historical bug density.
              </div>
              
              <div className="flex flex-col space-y-2 mt-4">
                <div className="flex items-center text-xs">
                  <div className="w-16 font-medium text-gray-600">Low</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-3">
                    <div className="bg-emerald-500 h-3 rounded-full" style={{ width: '72%' }}></div>
                  </div>
                  <div className="w-8 text-right text-gray-500">72%</div>
                </div>
                <div className="flex items-center text-xs">
                  <div className="w-16 font-medium text-gray-600">Medium</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-3">
                    <div className="bg-amber-400 h-3 rounded-full" style={{ width: '18%' }}></div>
                  </div>
                  <div className="w-8 text-right text-gray-500">18%</div>
                </div>
                <div className="flex items-center text-xs">
                  <div className="w-16 font-medium text-gray-600">High</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-3">
                    <div className="bg-orange-500 h-3 rounded-full" style={{ width: '8%' }}></div>
                  </div>
                  <div className="w-8 text-right text-gray-500">8%</div>
                </div>
                <div className="flex items-center text-xs">
                  <div className="w-16 font-medium text-gray-600">Critical</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-3">
                    <div className="bg-red-600 h-3 rounded-full" style={{ width: '2%' }}></div>
                  </div>
                  <div className="w-8 text-right text-gray-500">2%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Repository Health Table */}
          <div className="bg-white border border-gray-200 rounded-sm shadow-sm flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Repository Health</h3>
              <i className="fa-solid fa-heart-pulse text-gray-400"></i>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/50 text-gray-500 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-2 font-medium">Repository</th>
                    <th className="px-4 py-2 font-medium text-center">Score</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5">mobile-app</td>
                    <td className="px-4 py-2.5 text-center font-bold text-emerald-600">95</td>
                    <td className="px-4 py-2.5"><span className="text-emerald-500"><i className="fa-solid fa-circle text-[8px] mr-1 border border-emerald-200 rounded-full"></i> Excellent</span></td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5">frontend</td>
                    <td className="px-4 py-2.5 text-center font-bold text-emerald-600">91</td>
                    <td className="px-4 py-2.5"><span className="text-emerald-500"><i className="fa-solid fa-circle text-[8px] mr-1 border border-emerald-200 rounded-full"></i> Excellent</span></td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5">backend-api</td>
                    <td className="px-4 py-2.5 text-center font-bold text-amber-600">82</td>
                    <td className="px-4 py-2.5"><span className="text-amber-500"><i className="fa-solid fa-circle text-[8px] mr-1 border border-amber-200 rounded-full"></i> Fair</span></td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors bg-red-50/30">
                    <td className="px-4 py-2.5">payment-service</td>
                    <td className="px-4 py-2.5 text-center font-bold text-red-600">68</td>
                    <td className="px-4 py-2.5"><span className="text-red-500"><i className="fa-solid fa-circle text-[8px] mr-1 border border-red-200 rounded-full"></i> Needs Attention</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
