import React, { useState, useEffect, useRef } from "react";
import { generateExcelReport, generateTxtReport, generatePdfReport } from "../utils/exportUtils";

const DashboardCards = ({ insights }) => (
  <div className="flex flex-wrap items-center justify-center text-center gap-x-10 gap-y-4 pb-2">
    <div>
      <div className="text-xs text-gray-500 font-medium">Final Suggestions</div>
      <div className="text-xl font-bold text-gray-900">
        {insights?.finalSuggestionsCount || 0}
      </div>
    </div>

    <div>
      <div className="text-xs text-gray-500 font-medium">Security</div>
      <div className="text-xl font-bold text-gray-900">
        {insights?.securityIssuesCount || 0}
      </div>
    </div>

    <div>
      <div className="text-xs text-gray-500 font-medium">Syntax Errors</div>
      <div className="text-xl font-bold text-gray-900">
        {insights?.syntaxErrorsCount || 0}
      </div>
    </div>

    <div>
      <div className="text-xs text-gray-500 font-medium">Breaches</div>
      <div className="text-xl font-bold text-gray-900">
        {insights?.breachesCount || 0}
      </div>
    </div>

    <div>
      <div className="text-xs text-gray-500 font-medium">
        Performance Issues
      </div>
      <div className="text-xl font-bold text-gray-900">
        {insights?.performanceIssuesCount || 0}
      </div>
    </div>

    <div>
      <div className="text-xs text-gray-500 font-medium">Code Smells</div>
      <div className="text-xl font-bold text-gray-900">
        {insights?.codeSmellsCount || 0}
      </div>
    </div>

    <div>
      <div className="text-xs text-gray-500 font-medium">
        Test Coverage Impact
      </div>
      <div
        className={`text-xl font-bold ${insights?.testCoverageImpact < 0 ? "text-red-600" : "text-emerald-600"}`}
      >
        {insights?.testCoverageImpact > 0 ? "+" : ""}
        {insights?.testCoverageImpact || 0}%
      </div>
    </div>

    <div>
      <div className="text-xs text-gray-500 font-medium">Code Complexity</div>
      <div className="text-xl font-bold text-amber-600">
        {insights?.codeComplexity || "N/A"}
      </div>
    </div>
  </div>
);

import { useLocation, useSearchParams, useOutletContext } from "react-router-dom";
import { pullRequestsApi } from "../api/pullRequests";

export default function PrAiInsights() {
  const { setInsights: setGlobalInsights } = useOutletContext();
  const [isLoading, setIsLoading] = useState(true);
  const [loadingPhrase] = useState(() => {
    const phrases = ["Analyzing...", "Processing...", "Working...", "Inspecting...", "Reviewing..."];
    return phrases[Math.floor(Math.random() * phrases.length)];
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [insights, setInsights] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const hasFetched = useRef(false);
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const repoParam = location.state?.repoParam || searchParams.get("repo");
  const prNumberParam = location.state?.prNumberParam || searchParams.get("pr");

  const modalConfig = {
    export: {
      title: "Export Review",
      message: "Are you sure you want to export this review report?",
      confirmText: "Export",
      confirmColor: "bg-blue-600 hover:bg-blue-700",
    },
    critical: {
      title: "Mark as Critical",
      message: "Mark this entire review as Critical?",
      confirmText: "Mark Critical",
      confirmColor: "bg-red-600 hover:bg-red-700",
    }
  };

  const fetchInsights = async () => {
    if (!repoParam || !prNumberParam) return;
    const [owner, repo] = repoParam.split("/");
    try {
      setIsLoading(true);
      const data = await pullRequestsApi.getInsights({
        owner,
        repo,
        prNumber: prNumberParam,
      });
      setInsights(data);
      setGlobalInsights(data);
      setIsLoading(false);
    } catch (error) {
      if (error.response?.status === 404) {
        console.log("No existing review found. Triggering AI analysis...");
        await generateInsights();
      } else {
        console.error("Failed to fetch PR insights:", error);
      }
      setIsLoading(false);
    }
  };

  const generateInsights = async () => {
    if (!repoParam || !prNumberParam) return;
    const [owner, repo] = repoParam.split("/");
    try {
      setIsGenerating(true);
      const data = await pullRequestsApi.analyzePr({
        owner,
        repo,
        prNumber: prNumberParam,
      });
      setInsights(data);
      setGlobalInsights(data);
    } catch (error) {
      console.error("Failed to generate PR insights:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (!repoParam || !prNumberParam) return;
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchInsights();
  }, [repoParam, prNumberParam]);

  if (isLoading) {
    return (
      <div className="h-[60vh] bg-transparent text-gray-700 flex flex-col items-center justify-center font-sans">
        <div className="w-5 h-5 border-2 border-gray-400 border-t-blue-600 rounded-full animate-spin mb-3"></div>
        <h2 className="text-xs font-semibold text-gray-900 tracking-tight">
          {loadingPhrase}
        </h2>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <h2 className="text-lg font-bold text-gray-900">AI Review Pending</h2>
        <p className="text-sm text-gray-500 max-w-sm text-center">
          The automated AI review for this Pull Request has not completed yet,
          or is currently analyzing. Please check back later.
        </p>
      </div>
    );
  }

  const reviewThreads = insights.issues || [];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="pb-2">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">
          Overview
        </h1>
      </div>

      <DashboardCards insights={insights} />

      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
          Inline Code Reviews ({reviewThreads.length})
        </h2>
        <div className="flex items-center space-x-4 text-xs font-medium">
          <button
            onClick={() => setActiveModal("export")}
            className="text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
          >
            Export Review
          </button>
          <button
            onClick={() => setActiveModal("critical")}
            className="text-red-500 hover:text-red-700 transition-colors cursor-pointer"
          >
            Mark as Critical
          </button>
        </div>
      </div>

      {/* Tree Line Wrapper */}
      <div className="relative pl-6">
        {/* Continuous Trunk Line connecting all issues */}
        <div className="absolute left-[11px] top-3 bottom-6 w-0.5 bg-emerald-500"></div>

        <div className="space-y-10">
          {reviewThreads.map((thread) => (
            <div key={thread.id} className="relative group">
              {/* Horizontal Branch Line pointing from the main trunk to the card */}
              <div className="absolute -left-[12px] top-5 w-3 h-0.5 bg-emerald-500"></div>

              {/* Review Card */}
              <div className="bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm">
                {/* Diff Context Header */}
                <div className="bg-gray-100/70 px-3 py-2 border-b border-gray-200 flex items-center justify-between font-mono text-xs text-gray-600">
                  <span className="font-medium text-gray-900">
                    {thread.filePath}
                  </span>
                  <span className="text-gray-500">
                    Lines +{thread.startLine} to +{thread.endLine}
                  </span>
                </div>

                {/* Code Snippet Block */}
                {(() => {
                  const computedCodeLines = thread.codeLines || (thread.suggestedRemovedCode ? thread.suggestedRemovedCode.split('\n').map((text, i) => ({ num: thread.startLine + i, text })) : null);
                  return computedCodeLines && (
                    <div className="border-b border-gray-200">
                      <div className="bg-gray-100 px-3 py-1.5 border-b border-gray-200 text-[11px] text-gray-600 font-semibold flex justify-between items-center">
                        <span className=" tracking-wider">Current Code</span>
                      </div>
                      <div className="bg-gray-50 font-mono text-xs overflow-x-auto">
                        {computedCodeLines.map((line, idx) => (
                          <div
                            key={idx}
                            className="flex items-center px-3 py-1 bg-emerald-50/50 text-emerald-900"
                          >
                            <span className="w-8 text-right pr-3 text-gray-400 select-none text-[11px]">
                              {line.num}
                            </span>
                            <span className="text-emerald-600 font-semibold select-none mr-2">
                              +
                            </span>
                            <pre className="whitespace-pre">{line.text}</pre>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Comment Thread */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-900">
                      {thread.author || "GitSight"}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">Type:</span>
                      <span className="text-blue-700 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">
                        {thread.issueType}
                      </span>
                      <span className="text-gray-500 ml-1">Severity:</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${thread.severity?.toLowerCase() === "high" || thread.severity?.toLowerCase() === "critical" ? " text-red-700" : thread.severity?.toLowerCase() === "medium" || thread.severity?.toLowerCase() === "warning" ? "text-amber-700" : " text-gray-700"}`}
                      >
                        {thread.severity}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-700 leading-relaxed">
                    {thread.comment}
                  </p>

                  {/* Diff Suggestion Box */}
                  {(thread.suggestedRemovedCode ||
                    thread.suggestedAddedCode) && (
                    <div className="border border-gray-200 mt-3 font-mono text-xs rounded overflow-hidden">
                      <div className="bg-gray-100 px-3 py-1.5 border-b border-gray-200 text-[11px] text-gray-600 font-semibold flex justify-between items-center">
                        <span>Suggested change</span>
                        <button className="text-blue-600 hover:text-blue-700 font-sans font-medium cursor-pointer">
                          Export Suggestion
                        </button>
                      </div>
                      <div className="bg-white">
                        {thread.suggestedRemovedCode && (
                          <div className="bg-red-50 text-red-800 px-3 py-1 border-l-2 border-red-500 flex items-start">
                            <span className="text-red-500 mr-2 select-none font-bold mt-0.5">
                              -
                            </span>
                            <pre className="whitespace-pre-wrap">
                              {thread.suggestedRemovedCode}
                            </pre>
                          </div>
                        )}
                        {thread.suggestedAddedCode && (
                          <div className="bg-emerald-50 text-emerald-800 px-3 py-1 border-l-2 border-emerald-500 flex items-start">
                            <span className="text-emerald-500 mr-2 select-none font-bold mt-0.5">
                              +
                            </span>
                            <pre className="whitespace-pre-wrap">
                              {thread.suggestedAddedCode}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Modal */}
      {activeModal && modalConfig[activeModal] && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {modalConfig[activeModal].title}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {modalConfig[activeModal].message}
            </p>
            {activeModal === "export" ? (
              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => { generateTxtReport(insights, prNumberParam); setActiveModal(null); }}
                  className="px-4 py-2.5 text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 rounded transition-colors text-center cursor-pointer shadow-sm"
                >
                  <i className="fa-regular fa-file-lines mr-2"></i> Download as TXT
                </button>
                <button
                  onClick={() => { generateExcelReport(insights, prNumberParam); setActiveModal(null); }}
                  className="px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors text-center cursor-pointer shadow-sm"
                >
                  <i className="fa-regular fa-file-excel mr-2"></i> Download as Excel
                </button>
                <button
                  onClick={() => { generatePdfReport(insights, prNumberParam); setActiveModal(null); }}
                  className="px-4 py-2.5 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded transition-colors text-center cursor-pointer shadow-sm"
                >
                  <i className="fa-regular fa-file-pdf mr-2"></i> Download as PDF
                </button>
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 mt-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors text-center cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setActiveModal(null)}
                  className={`px-4 py-2 text-sm font-medium text-white rounded transition-colors cursor-pointer ${modalConfig[activeModal].confirmColor}`}
                >
                  {modalConfig[activeModal].confirmText}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
