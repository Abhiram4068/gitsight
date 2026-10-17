import React, { useState, useEffect, useRef } from "react";
import { formatDateTime } from "../utils/datetimeFormatter";
import {
  generateExcelReport,
  generateTxtReport,
  generatePdfReport,
} from "../utils/exportUtils";

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

import {
  useLocation,
  useSearchParams,
  useOutletContext,
  useNavigate,
} from "react-router-dom";
import { pullRequestsApi } from "../api/pullRequests";

export default function PrAiInsights() {
  const navigate = useNavigate();
  const { setInsights: setGlobalInsights, stats } = useOutletContext();
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reviewFailed, setReviewFailed] = useState(false);
  const [reviewErrorMessage, setReviewErrorMessage] = useState("");
  const [insights, setInsights] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [ignoredIssues, setIgnoredIssues] = useState(new Set());
  const [togglingIgnoreId, setTogglingIgnoreId] = useState(null);
  const [postingIssueId, setPostingIssueId] = useState(null);
  const [postedIssues, setPostedIssues] = useState(new Set());
  const [postErrors, setPostErrors] = useState({});
  const [toastNotification, setToastNotification] = useState(null);
  const [wordIndex, setWordIndex] = useState(0);

  const LOADING_WORDS = ["Analyzing", "code", "changes", "thoroughly", "now"];

  useEffect(() => {
    if (!isLoading && !isGenerating && insights) return;

    const timer = setInterval(() => {
      setWordIndex((prev) => (prev < LOADING_WORDS.length - 1 ? prev + 1 : prev));
    }, 7000);

    return () => clearInterval(timer);
  }, [isLoading, isGenerating, insights]);

  const loadingPhrase = `${LOADING_WORDS.slice(0, wordIndex + 1).join(" ")}...`;
  const hasFetched = useRef(false);
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const repoParam = location.state?.repoParam || searchParams.get("repo");
  const prNumberParam = location.state?.prNumberParam || searchParams.get("pr");
  const issueIdParam = searchParams.get("issue");
  const isFromTracked = searchParams.get("from") === "tracked";

  const modalConfig = {
    export: {
      title: "Export Review",
      message: "Are you sure you want to export this review report?",
      confirmText: "Export",
      confirmColor: "bg-blue-600 hover:bg-blue-700",
    },
  };

  const handleReturn = () => {
    if (searchParams.get("from") === "tracked") {
      navigate("/tracked-issues");
    } else if (repoParam && prNumberParam) {
      navigate(`/pr-detail?repo=${encodeURIComponent(repoParam)}&pr=${prNumberParam}`);
    } else {
      navigate(-1);
    }
  };

  const fetchInsights = async () => {
    if (!repoParam || !prNumberParam) return;
    const [owner, repo] = repoParam.split("/");
    try {
      setIsLoading(true);
      setReviewFailed(false);

      // Check current PR stats first if available
      let currentStats = stats;
      if (!currentStats?.analysisStatus) {
        try {
          currentStats = await pullRequestsApi.getPrStats({ owner, repo, prNumber: prNumberParam });
        } catch (e) {
          console.warn("Could not fetch current PR stats:", e);
        }
      }

      if (currentStats?.analysisStatus === "failed") {
        setReviewFailed(true);
        setReviewErrorMessage("The last AI review failed for this pull request. Click to retry again.");
        setIsLoading(false);
        return;
      }

      const data = await pullRequestsApi.getInsights({
        owner,
        repo,
        prNumber: prNumberParam,
      });
      const dataWithStatus = data ? { ...data, analysisStatus: "analyzed" } : data;
      setInsights(dataWithStatus);
      setGlobalInsights(dataWithStatus);
      setIsLoading(false);
    } catch (error) {
      if (
        error.response?.status === 422 || 
        error.response?.data?.message?.toLowerCase().includes("failed")
      ) {
        console.warn("The last AI review failed:", error);
        setReviewFailed(true);
        setReviewErrorMessage(error.response?.data?.message || "The last AI review was failed. Click to retry again.");
        setIsLoading(false);
      } else if (error.response?.status === 404) {
        console.log("No existing review found. Triggering AI analysis...");
        await generateInsights();
      } else {
        console.error("Failed to fetch PR insights:", error);
        setReviewFailed(true);
        setReviewErrorMessage("Failed to fetch PR insights. Click to retry again.");
        setIsLoading(false);
      }
    }
  };

  const generateInsights = async () => {
    if (!repoParam || !prNumberParam) return;
    const [owner, repo] = repoParam.split("/");
    try {
      setIsGenerating(true);
      setReviewFailed(false);
      setReviewErrorMessage("");
      const data = await pullRequestsApi.analyzePr({
        owner,
        repo,
        prNumber: prNumberParam,
      });
      const dataWithStatus = data ? { ...data, analysisStatus: "analyzed" } : data;
      setInsights(dataWithStatus);
      setGlobalInsights(dataWithStatus);
    } catch (error) {
      console.error("Failed to generate PR insights:", error);
      setReviewFailed(true);
      const msg = error.response?.data?.message || 
        (error.response?.status === 408 
          ? "AI review analysis timed out after 3 minutes." 
          : "The last review was failed. Click to retry again.");
      setReviewErrorMessage(msg);
    } finally {
      setIsGenerating(false);
      setIsLoading(false);
    }
  };

  const toggleIgnore = async (id) => {
    const willBeIgnored = !ignoredIssues.has(id);

    // Optimistic UI update
    setIgnoredIssues((prev) => {
      const next = new Set(prev);
      if (willBeIgnored) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });

    try {
      setTogglingIgnoreId(id);
      const res = await pullRequestsApi.toggleIssueIgnore(id);
      const isActuallyIgnored = res?.data !== undefined ? Boolean(res.data) : willBeIgnored;

      setIgnoredIssues((prev) => {
        const next = new Set(prev);
        if (isActuallyIgnored) {
          next.add(id);
        } else {
          next.delete(id);
        }
        return next;
      });

      // Update issue object inside insights state
      setInsights((prev) => {
        if (!prev || !prev.issues) return prev;
        return {
          ...prev,
          issues: prev.issues.map((i) =>
            i.id === id ? { ...i, isIgnored: isActuallyIgnored } : i
          ),
        };
      });

      setToastNotification({
        type: "success",
        message: isActuallyIgnored
          ? "Issue ignored and excluded from tracking."
          : "Issue restored to active list.",
      });
      setTimeout(() => setToastNotification(null), 3000);
    } catch (err) {
      console.error("Failed to toggle ignore status:", err);
      // Revert optimistic update
      setIgnoredIssues((prev) => {
        const next = new Set(prev);
        if (willBeIgnored) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
      setToastNotification({
        type: "error",
        message: "Failed to update ignore status. Please try again.",
      });
      setTimeout(() => setToastNotification(null), 4000);
    } finally {
      setTogglingIgnoreId(null);
    }
  };

  const handlePostToGitHub = async (thread) => {
    if (!repoParam || !prNumberParam) return;
    const [owner, repo] = repoParam.split("/");
    const issueId = thread.id;

    setPostingIssueId(issueId);
    setPostErrors((prev) => {
      const copy = { ...prev };
      delete copy[issueId];
      return copy;
    });

    try {
      const suggestedCode = thread.suggestedAddedCode || null;
      await pullRequestsApi.postCommentToGitHub({
        owner,
        repo,
        prNumber: prNumberParam,
        issueId,
        filePath: thread.filePath,
        line: thread.startLine || thread.endLine || 1,
        comment: thread.comment,
        suggestedCode,
        suggestedRemovedCode: thread.suggestedRemovedCode,
      });

      thread.isCommented = true;
      setPostedIssues((prev) => new Set(prev).add(issueId));
      setToastNotification({
        type: "success",
        message: `Comment for ${thread.filePath} (line ${thread.startLine}) successfully posted to GitHub PR #${prNumberParam}!`,
      });
      setTimeout(() => setToastNotification(null), 5000);
    } catch (err) {
      console.error("Failed to post comment to GitHub:", err);
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to post comment to GitHub.";
      setPostErrors((prev) => ({ ...prev, [issueId]: errMsg }));
      setToastNotification({
        type: "error",
        message: `Failed to post comment for ${thread.filePath}: ${errMsg}`,
      });
      setTimeout(() => setToastNotification(null), 5000);
    } finally {
      setPostingIssueId(null);
    }
  };

  useEffect(() => {
    if (!repoParam || !prNumberParam) return;
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchInsights();
  }, [repoParam, prNumberParam]);

  // Poll for insights if the analysis is still in progress
  useEffect(() => {
    if (insights || reviewFailed || !repoParam || !prNumberParam) return;
    const interval = setInterval(async () => {
      const [owner, repo] = repoParam.split("/");
      try {
        const data = await pullRequestsApi.getInsights({
          owner,
          repo,
          prNumber: prNumberParam,
        });
        if (data) {
          const dataWithStatus = { ...data, analysisStatus: "analyzed" };
          setInsights(dataWithStatus);
          setGlobalInsights(dataWithStatus);
          setIsLoading(false);
          setReviewFailed(false);
        }
      } catch (err) {
        if (err.response?.status === 422 || err.response?.data?.message?.toLowerCase().includes("failed")) {
          setReviewFailed(true);
          setReviewErrorMessage(err.response?.data?.message || "The last review was failed. Click to retry again.");
          setIsLoading(false);
        }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [insights, reviewFailed, repoParam, prNumberParam]);

  // Synchronize posted and ignored issues from database API response
  useEffect(() => {
    if (insights?.issues) {
      const alreadyCommentedIds = new Set(
        insights.issues
          .filter((i) => i.isCommented || i.IsCommented)
          .map((i) => i.id)
      );
      setPostedIssues((prev) => new Set([...prev, ...alreadyCommentedIds]));

      const alreadyIgnoredIds = new Set(
        insights.issues
          .filter((i) => i.isIgnored || i.IsIgnored)
          .map((i) => i.id)
      );
      setIgnoredIssues((prev) => new Set([...prev, ...alreadyIgnoredIds]));
    }
  }, [insights]);

  // Handle scrolling to specific issue
  useEffect(() => {
    if (insights && issueIdParam) {
      // Slight delay to ensure the DOM is painted
      const timer = setTimeout(() => {
        const element = document.getElementById(`issue-${issueIdParam}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });

          // Flash effect
          const card = element.querySelector(".bg-white");
          if (card) {
            card.classList.add("ring-2", "ring-blue-500", "ring-offset-2");
            setTimeout(() => {
              card.classList.remove("ring-2", "ring-blue-500", "ring-offset-2");
            }, 2000);
          }
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [insights, issueIdParam]);

  if (reviewFailed && !insights) {
    return (
      <div className="h-[65vh] bg-transparent flex flex-col items-center justify-center font-sans px-4">
        <div className="max-w-md w-full p-8 text-center ">
          <div className="w-14 h-14 mx-auto flex items-center justify-center text-amber-600 mb-4 shadow-inner">
            <i className="fa-solid fa-triangle-exclamation text-2xl"></i>
          </div>
          
          <h2 className="text-base font-bold text-gray-900 mb-2">
            The last review was failed
          </h2>
          
          <p className="text-xs text-gray-600 mb-6 leading-relaxed">
            {reviewErrorMessage || "The AI analysis timed out (3 minute limit) or encountered an error while processing this pull request."}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => generateInsights()}
              disabled={isGenerating}
              className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold  shadow-sm transition-all cursor-pointer space-x-2 disabled:opacity-50"
            >
              <i className={`fa-solid fa-rotate-right ${isGenerating ? 'animate-spin' : ''}`}></i>
              <span>{isGenerating ? "Retrying Review..." : "Click to retry again"}</span>
            </button>

            <button
              onClick={handleReturn}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium  transition-colors cursor-pointer"
            >
              <i className="fa-solid fa-arrow-left mr-1.5 text-xs"></i>
              <span>Return to PR Details</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || isGenerating || !insights) {
    return (
      <div className="h-[60vh] bg-transparent text-gray-700 flex flex-col items-center justify-center font-sans px-4">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mb-3"></div>
        <h2 className="text-sm font-semibold text-gray-900 tracking-tight">
          {loadingPhrase}
        </h2>
        <p className="text-xs text-gray-500 mt-1 max-w-sm text-center">
          {isGenerating 
            ? "AI Code Review analysis in progress..." 
            : "Loading pull request insights..."}
        </p>

        {/* Return Button during loading */}
        <div className="mt-5">
          <button
            onClick={handleReturn}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium  transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-arrow-left text-[11px]"></i>
            <span>Return to PR Details</span>
          </button>
        </div>
      </div>
    );
  }

  const reviewThreads = insights.issues || [];

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200 gap-3">
        <div className="flex items-center space-x-3">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            Overview
          </h1>
        </div>
      </div>

      {/* Failed Retry Banner if insights are already displayed */}
      {reviewFailed && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-3.5 text-xs text-amber-900 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2.5">
            <i className="fa-solid fa-triangle-exclamation text-amber-600 text-base"></i>
            <div>
              <span className="font-bold">The last review was failed.</span>
              <span className="ml-1 text-amber-800">{reviewErrorMessage}</span>
            </div>
          </div>
          <button
            onClick={() => generateInsights()}
            disabled={isGenerating}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white  text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            <i className={`fa-solid fa-rotate-right ${isGenerating ? 'animate-spin' : ''}`}></i>
            <span>{isGenerating ? "Retrying..." : "Click to retry again"}</span>
          </button>
        </div>
      )}

      {/* Toast Notification */}
      {toastNotification && (
        <div
          className={`px-4 py-2.5 rounded-sm border text-xs flex items-center justify-between transition-all ${
            toastNotification.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-800"
              : "bg-red-50 border-red-300 text-red-800"
          }`}
        >
          <div className="flex items-center space-x-2">
            <i
              className={`fa-solid ${
                toastNotification.type === "success"
                  ? "fa-circle-check text-emerald-600"
                  : "fa-circle-exclamation text-red-600"
              }`}
            ></i>
            <span className="font-medium">{toastNotification.message}</span>
          </div>
          <button
            onClick={() => setToastNotification(null)}
            className="text-gray-500 hover:text-gray-800 cursor-pointer ml-3"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}

      <DashboardCards insights={insights} />

      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
          Inline Code Reviews ({reviewThreads.length})
        </h2>
        <div className="flex items-center space-x-4 text-xs font-medium">
          {reviewThreads.length > 0 && (
            <button
              onClick={() => setActiveModal("export")}
              className="text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
            >
              Export Review
            </button>
          )}
        </div>
      </div>

      {reviewThreads.length === 0 ? (
        <div className=" p-10 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-14 h-14 flex items-center justify-center text-emerald-600 ">
            <i className="fa-solid fa-check text-2xl"></i>
          </div>
          <div>
            <h3 className="text-lg font-bold text-emerald-900 tracking-tight">
              0 Potential Issues Found.
            </h3>
            <p className="text-sm  mt-1 max-w-md mx-auto leading-relaxed">
              The AI code review completed successfully and didn't flag any
              security vulnerabilities, syntax errors, or major code smells.
              Great job!
            </p>
          </div>
        </div>
      ) : (
        /* Tree Line Wrapper */
        <div className="relative pl-6">
          {/* Continuous Trunk Line connecting all issues */}
          <div className="absolute left-[11px] top-3 bottom-6 w-0.5 bg-emerald-500"></div>

          <div className="space-y-10">
            {reviewThreads.map((thread) => (
              <div
                key={thread.id}
                id={`issue-${thread.id}`}
                className="relative group"
              >
                {/* Horizontal Branch Line pointing from the main trunk to the card */}
                <div className="absolute -left-[12px] top-5 w-3 h-0.5 bg-emerald-500"></div>

                {/* Review Card */}
                <div
                  className={`bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm transition-all duration-500 ${ignoredIssues.has(thread.id) ? "opacity-50 grayscale" : ""}`}
                >
                  {/* Diff Context Header */}
                  <div className="bg-gray-100/70 px-3 py-2 border-b border-gray-200 flex items-center justify-between font-mono text-xs text-gray-600">
                    <span className="font-medium text-gray-900">
                      {thread.filePath}
                    </span>
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-500">
                        Lines +{thread.startLine} to +{thread.endLine}
                      </span>

                      {/* Minimalist Ignore Toggle */}
                      {!isFromTracked && (
                        <button
                          disabled={togglingIgnoreId === thread.id}
                          onClick={() => toggleIgnore(thread.id)}
                          className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-medium border cursor-pointer transition-all shadow-sm ${
                            togglingIgnoreId === thread.id
                              ? "opacity-60 cursor-not-allowed"
                              : ""
                          } ${
                            ignoredIssues.has(thread.id)
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                              : "bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100"
                          }`}
                          title={
                            ignoredIssues.has(thread.id)
                              ? "Restore this issue"
                              : "Ignore this issue"
                          }
                        >
                          <i
                            className={`fa-solid ${
                              togglingIgnoreId === thread.id
                                ? "fa-spinner fa-spin text-gray-500"
                                : ignoredIssues.has(thread.id)
                                  ? "fa-arrow-rotate-left text-emerald-600"
                                  : "fa-ban text-rose-500"
                            }`}
                          ></i>
                          <span>
                            {ignoredIssues.has(thread.id)
                              ? "Restore"
                              : "Ignore"}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Code Snippet Block */}
                  {(() => {
                    const computedCodeLines =
                      thread.codeLines ||
                      (thread.suggestedRemovedCode
                        ? thread.suggestedRemovedCode
                            .split("\n")
                            .map((text, i) => ({
                              num: thread.startLine + i,
                              text,
                            }))
                        : null);
                    return (
                      computedCodeLines && (
                        <div className="border-b border-gray-200">
                          <div className="bg-gray-100 px-3 py-1.5 border-b border-gray-200 text-[11px] text-gray-600 font-semibold flex justify-between items-center">
                            <span className=" tracking-wider">
                              Current Code
                            </span>
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
                                <pre className="whitespace-pre">
                                  {line.text}
                                </pre>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
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
                    {/* Card Action Footer */}
                    <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center space-x-1.5 text-[11px] text-gray-500 font-mono">
                        <i className="fa-brands fa-github text-gray-700"></i>
                        <span>
                          Targets: {thread.filePath}:{thread.startLine}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        {(postedIssues.has(thread.id) || thread.isCommented || thread.IsCommented) ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-emerald-700 font-semibold text-xs flex items-center space-x-1">
                              <i className="fa-solid fa-circle-check text-emerald-600"></i>
                              <span>Posted to GitHub PR Diff</span>
                            </span>
                            <a
                              href={`https://github.com/${repoParam}/pull/${prNumberParam}/changes`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-xs font-medium flex items-center space-x-1"
                            >
                              <span>View PR</span>
                              <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                            </a>
                          </div>
                        ) : (
                          <button
                            onClick={() => handlePostToGitHub(thread)}
                            disabled={
                              postingIssueId === thread.id ||
                              ignoredIssues.has(thread.id)
                            }
                            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-sm text-xs font-semibold transition-all shadow-xs ${
                              postingIssueId === thread.id
                                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                : "bg-black hover:bg-gray-800 text-white cursor-pointer"
                            }`}
                          >
                            {postingIssueId === thread.id ? (
                              <>
                                <i className="fa-solid fa-spinner animate-spin text-xs"></i>
                                <span>Posting Comment...</span>
                              </>
                            ) : (
                              <>
                                <i className="fa-brands fa-github text-xs"></i>
                                <span>Post Comment Directly to GitHub</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Inline Error if Posting Failed */}
                    {postErrors[thread.id] && (
                      <div className="mt-2 p-2.5 bg-red-50 border border-red-200 rounded-sm text-xs text-red-700 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <i className="fa-solid fa-circle-exclamation text-red-600"></i>
                          <span>{postErrors[thread.id]}</span>
                        </div>
                        <button
                          onClick={() => handlePostToGitHub(thread)}
                          className="text-red-700 font-bold hover:underline cursor-pointer ml-3 shrink-0"
                        >
                          Retry
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                  onClick={() => {
                    generateTxtReport(insights, prNumberParam);
                    setActiveModal(null);
                  }}
                  className="px-4 py-2.5 text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 rounded transition-colors text-center cursor-pointer shadow-sm"
                >
                  <i className="fa-regular fa-file-lines mr-2"></i> Download as
                  TXT
                </button>
                <button
                  onClick={() => {
                    generateExcelReport(insights, prNumberParam);
                    setActiveModal(null);
                  }}
                  className="px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors text-center cursor-pointer shadow-sm"
                >
                  <i className="fa-regular fa-file-excel mr-2"></i> Download as
                  Excel
                </button>
                <button
                  onClick={() => {
                    generatePdfReport(insights, prNumberParam);
                    setActiveModal(null);
                  }}
                  className="px-4 py-2.5 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded transition-colors text-center cursor-pointer shadow-sm"
                >
                  <i className="fa-regular fa-file-pdf mr-2"></i> Download as
                  PDF
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
