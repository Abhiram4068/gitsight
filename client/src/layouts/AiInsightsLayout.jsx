import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { pullRequestsApi } from '../api/pullRequests';
import { trackedIssuesApi } from '../api/trackedIssues';
import StatusBadge from '../components/StatusBadge';

const AiNavbar = ({ navigate, location, stats, insights, setInsights, onToggleSidebar }) => {
  const [searchParams] = useSearchParams();
  const [isReReviewing, setIsReReviewing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showUntrackModal, setShowUntrackModal] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [isUntracking, setIsUntracking] = useState(false);

  const handleReReview = async () => {
    const repoParam = location.state?.repoParam || searchParams.get('repo');
    const prNumberParam = location.state?.prNumberParam || searchParams.get('pr');
    if (!repoParam || !prNumberParam) return;
    
    const [owner, repo] = repoParam.split('/');
    try {
      setIsReReviewing(true);
      await pullRequestsApi.analyzePr({ owner, repo, prNumber: prNumberParam });
      // Reload the window so the nested insights component fetches the fresh data
      window.location.reload();
    } catch (error) {
      console.error("Failed to trigger re-review:", error);
    } finally {
      setIsReReviewing(false);
    }
  };

  const isAnalyzed = 
    (insights?.analysisStatus || stats?.analysisStatus)?.toLowerCase() === 'analyzed' ||
    (insights?.analysisStatus || stats?.analysisStatus)?.toLowerCase() === 'completed';

  return (
    <header className="bg-white border-b border-gray-200 shrink-0 sticky top-0 z-20">
      {/* Top utility bar */}
      <div className="px-4 sm:px-6 border-b border-gray-200 flex items-center justify-between bg-gray-100 h-9">
        <div className="flex items-center h-full space-x-3">
          <Link
            to="/"
            className="flex items-center space-x-1.5 text-xs text-blue-600 hover:underline hover:text-blue-700 font-medium cursor-pointer"
          >
            <i className="fa-solid fa-house text-xs"></i>
            <span>Home</span>
          </Link>

          {/* Vertical divider touching top of utility bar and bottom border */}
          <div className="h-full w-[1px] bg-gray-300"></div>

          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-xs font-medium text-gray-600 hover:text-gray-900 cursor-pointer"
          >
            <span className="hidden sm:inline">
              {searchParams.get('from') === 'tracked' ? 'Back to Tracked Issues' : 'Back to Pull Request Details'}
            </span>
            <span className="sm:hidden">
              Back
            </span>
          </button>
          <div className="h-full w-[1px] bg-gray-300"></div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Mobile right-sidebar toggle */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden flex items-center space-x-1 text-xs font-medium text-gray-500 hover:text-gray-900 border border-gray-300 px-2 py-0.5 rounded bg-white cursor-pointer"
            >
              <i className="fa-solid fa-sidebar text-[10px]"></i>
              <span>Legend</span>
            </button>
          )}

          <Link
            className="flex items-center space-x-1.5 text-gray-800 hover:text-gray-950 transition-colors cursor-pointer select-none"
            title="GitSight"
          >
            <img src="/gitsight.svg" alt="GitSight Logo" className="w-3.5 h-3.5 object-contain" />
            <span className="text-xs font-bold tracking-wider">GitSight.</span>
          </Link>
        </div>
      </div>
      
      {/* PR Metadata bar */}
      <div className="px-4 sm:px-6 py-4 mx-auto w-full">
        {stats ? (
          <div className="space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">{stats.title}</h1>
                <span className="text-xl font-light text-gray-400">#{stats.prNumber}</span>
                <StatusBadge state={stats.state} mergedAt={stats.mergedAt} isDraft={stats.isDraft} />
                <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2.5 py-0.5 rounded-full">
                  {stats.repositoryFullName || (stats.htmlUrl && stats.htmlUrl.split('github.com/')[1]?.split('/pull')[0]) || "repository"}
                </span>
              </div>
  {isAnalyzed && (
  <div className="flex items-center space-x-2">
    {!insights?.issues || insights.issues.length === 0 ? (
      <span className="text-xs italic text-gray-400 px-1.5 py-1.5">
        No issues to track
      </span>
    ) : insights?.isTracked ? (
      <button
        onClick={() => setShowUntrackModal(true)}
        className="inline-flex items-center space-x-1.5 text-xs font-medium text-red-600 hover:text-red-800 hover:underline transition-colors shrink-0 cursor-pointer p-1.5"
        title="Stop tracking issues for this PR"
      >
        <span>Untrack Issues</span>
      </button>
    ) : (
      <button
        onClick={() => setShowConfirmModal(true)}
        className="inline-flex items-center space-x-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors shrink-0 cursor-pointer p-1.5"
        title="Sync all active issues to track"
      >
        <span>Track Issues</span>
      </button>
    )}
  </div>
)}
            </div>
            
            <div className="flex flex-wrap items-center justify-between gap-y-1">
              <div className="flex flex-wrap items-center text-xs text-gray-600 gap-x-3 gap-y-1">
                <div>
                  <span className="font-semibold text-gray-900">{stats.author}</span>
                  <span> wants to merge </span>
                  <span className="font-mono text-blue-600 bg-blue-50 px-1 rounded">{stats.headBranch}</span>
                  <span> into </span>
                  <span className="font-mono text-blue-600 bg-blue-50 px-1 rounded">{stats.baseBranch}</span>
                </div>
                <span className="text-gray-300 hidden sm:inline">&bull;</span>
                <span className="hidden sm:inline">Opened: {new Date(stats.createdAt).toLocaleDateString()}</span>
                <span className="text-gray-300 hidden sm:inline">&bull;</span>
                <div className="flex items-center space-x-2 font-medium">
                  <span className="text-gray-900">{stats.changedFiles} Files changed</span>
                  <span className="text-emerald-600">+{stats.additions}</span>
                  <span className="text-red-600">-{stats.deletions}</span>
                </div>
              </div>
              
              {insights && (
                <div className="flex items-center text-xs">
                  {insights.isWebhook ? (
                    <div className="text-amber-700 font-medium flex items-center space-x-1.5 px-2.5 py-1" title="Review triggered automatically by GitHub webhook">
                      <span className="hidden sm:inline">Webhook Triggered on {new Date(insights.createdAt.endsWith('Z') ? insights.createdAt : insights.createdAt + 'Z').toLocaleString()}</span>
                      <span className="sm:hidden">Webhook</span>
                    </div>
                  ) : (
                    <div className="text-gray-600 font-medium flex items-center space-x-1.5 px-2.5 py-1" title="Review triggered manually from GitSight dashboard">
                      <span className="hidden sm:inline">Manually Triggered on {new Date(insights.createdAt.endsWith('Z') ? insights.createdAt : insights.createdAt + 'Z').toLocaleString()}</span>
                      <span className="sm:hidden">Manual</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="animate-pulse space-y-3 py-1">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-100 rounded w-1/2"></div>
          </div>
        )}
      </div>


      {/* Confirm Tracking Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-40 p-3">
          <div className="bg-white p-5 sm:p-6 shadow-2xl w-full max-w-sm sm:max-w-md border border-gray-400 rounded-none">
            <h2 className="text-base font-bold text-gray-900 mb-3">Track Issues</h2>
            <p className="text-sm text-gray-800 mb-6 leading-relaxed">
              {(() => {
                const trackableCount = insights?.issues?.filter((i) => !i.isIgnored && !i.IsIgnored)?.length || 0;
                if (trackableCount > 0) {
                  return (
                    <>
                      You are about to track <span className="font-bold">{trackableCount} {trackableCount === 1 ? 'issue' : 'issues'}</span> to manage them. You can see them on <span className="font-bold">Home &rarr; Issues</span>.
                    </>
                  );
                }
                return (
                  <>
                    All reported issues for this PR have been marked as ignored. There are no active issues to track.
                  </>
                );
              })()}
            </p>
            <div className="flex justify-end space-x-3 sm:space-x-4">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="px-4 sm:px-5 py-2 border-2 border-gray-300 text-gray-700 text-sm font-bold hover:bg-gray-100 rounded-none cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (!insights?.id || !stats?.prNumber) return;
                  const trackableCount = insights?.issues?.filter((i) => !i.isIgnored && !i.IsIgnored)?.length || 0;
                  if (trackableCount === 0) return;
                  try {
                    setIsTracking(true);
                    await trackedIssuesApi.trackIssues({ 
                      pullRequestNumber: stats.prNumber, 
                      sessionId: insights.id 
                    });
                    setInsights({ ...insights, isTracked: true });
                    setShowConfirmModal(false);
                  } catch (err) {
                    console.error("Failed to track issues", err);
                  } finally {
                    setIsTracking(false);
                  }
                }}
                disabled={isTracking || (insights?.issues?.filter((i) => !i.isIgnored && !i.IsIgnored)?.length || 0) === 0}
                className={`px-4 sm:px-5 py-2 text-white text-sm font-bold rounded-none ${
                  isTracking
                    ? 'bg-blue-400 cursor-wait'
                    : (insights?.issues?.filter((i) => !i.isIgnored && !i.IsIgnored)?.length || 0) === 0
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                }`}
              >
                {isTracking ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i> Tracking...
                  </>
                ) : (
                  'Confirm'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Untrack Confirm Modal */}
      {showUntrackModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-40 p-3">
          <div className="bg-white p-5 sm:p-6 shadow-2xl w-full max-w-sm sm:max-w-md border border-gray-400 rounded-none">
            <h2 className="text-base font-bold text-gray-900 mb-3">Untrack Issues</h2>
            <p className="text-sm text-gray-800 mb-6 leading-relaxed">
              You are about to stop tracking issues for this pull request. They will be removed from tracked issues. Do you wish to continue?
            </p>
            <div className="flex justify-end space-x-3 sm:space-x-4">
              <button 
                onClick={() => setShowUntrackModal(false)}
                className="px-4 sm:px-5 py-2 border-2 border-gray-300 text-gray-700 text-sm font-bold hover:bg-gray-100 rounded-none cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (!insights?.id || !stats?.prNumber) return;
                  try {
                    setIsUntracking(true);
                    await trackedIssuesApi.untrackIssues({ 
                      pullRequestNumber: stats.prNumber, 
                      sessionId: insights.id 
                    });
                    setInsights({ ...insights, isTracked: false });
                    setShowUntrackModal(false);
                  } catch (err) {
                    console.error("Failed to untrack issues", err);
                  } finally {
                    setIsUntracking(false);
                  }
                }}
                disabled={isUntracking}
                className={`px-5 py-2 text-white text-sm font-bold rounded-none ${
                  isUntracking ? 'bg-red-400 cursor-wait' : 'bg-red-600 hover:bg-red-700 cursor-pointer'
                }`}
              >
                {isUntracking ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i> Untracking...
                  </>
                ) : (
                  'Confirm'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

const RightSidebar = () => (
  <div className="p-5 space-y-6 text-gray-800">
    {/* Section 1: Confidence Score Ranges */}
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center space-x-1.5">
        <span>Confidence Score</span>
      </h3>
      <p className="text-xs text-gray-500 mb-3 leading-relaxed">
        AI-calculated certainty based on static diff analysis, security pattern matching, and rule compliance.
      </p>

      <div className="space-y-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-emerald-600">85% – 100%</span>
            <span className="text-gray-300">&bull;</span>
            <span className="text-xs font-semibold text-gray-900">Ready to Merge</span>
          </div>
          <p className="text-gray-500 text-[11px] leading-relaxed mt-0.5">
            High certainty. No blocking bugs or security threats detected.
          </p>
        </div>

        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-amber-600">60% – 84%</span>
            <span className="text-gray-300">&bull;</span>
            <span className="text-xs font-semibold text-gray-900">Needs Review</span>
          </div>
          <p className="text-gray-500 text-[11px] leading-relaxed mt-0.5">
            Potential issues found. Peer verification recommended before merge.
          </p>
        </div>

        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-red-600">&lt; 60%</span>
            <span className="text-gray-300">&bull;</span>
            <span className="text-xs font-semibold text-gray-900">Requires Audit</span>
          </div>
          <p className="text-gray-500 text-[11px] leading-relaxed mt-0.5">
            High risk or unverified patterns. Thorough manual audit required.
          </p>
        </div>
      </div>
    </div>

    {/* Section 3: Professional Advisory */}
    <div className="pt-2 border-t border-gray-200">
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center space-x-1.5">
        <span>Review Advisory</span>
      </h3>
      <p className="text-[11px] text-gray-500 leading-relaxed">
        AI insights serve as an automated preliminary check. Always validate critical suggestions alongside team standards and CI test pipelines.
      </p>
    </div>
  </div>
);

export default function AiInsightsLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState(null);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      const repoParam = location.state?.repoParam || searchParams.get('repo');
      const prNumberParam = location.state?.prNumberParam || searchParams.get('pr');

      if (repoParam && prNumberParam) {
        const [owner, repo] = repoParam.split('/');
        try {
          const data = await pullRequestsApi.getPrStats({ owner, repo, prNumber: prNumberParam });
          setStats(data);
        } catch (error) {
          console.error("AiInsightsLayout failed to fetch PR stats:", error);
        }
      }
    };
    fetchStats();
  }, [location.state, searchParams]);

  // Handle UTC parsing safely for .NET DateTime that might omit 'Z'
  const openedAt = stats?.createdAt 
    ? new Date(stats.createdAt.endsWith('Z') ? stats.createdAt : stats.createdAt + 'Z') 
    : new Date();
    
  const reviewedAt = insights?.createdAt 
    ? new Date(insights.createdAt.endsWith('Z') ? insights.createdAt : insights.createdAt + 'Z') 
    : new Date();

  const totalIssues = insights?.issues?.length ?? insights?.finalSuggestionsCount ?? 0;
  const rawScore = insights?.overallConfidenceScore ?? 0;
  const formattedConfidence = rawScore > 0 && rawScore <= 1
    ? Math.round(rawScore * 100)
    : Math.round(rawScore);

  return (
    <div className="bg-gray-50 text-gray-900 h-screen flex flex-col font-sans overflow-hidden">
      <AiNavbar
        navigate={navigate}
        location={location}
        stats={stats}
        insights={insights}
        setInsights={setInsights}
        onToggleSidebar={() => setRightSidebarOpen(prev => !prev)}
      />
      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile right sidebar overlay backdrop */}
        {rightSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-30 lg:hidden"
            onClick={() => setRightSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {stats && insights && (
            totalIssues === 0 ? (
              <div className="bg-emerald-50 border-b border-emerald-200 w-full">
                <div className="px-4 sm:px-6 py-2 text-emerald-800 text-xs font-medium flex items-center">
                  <i className="fa-solid fa-circle-check mr-2 text-emerald-600 text-sm"></i>
                  <div>
                    PR #{stats.prNumber} (reviewed at {reviewedAt.toLocaleString()}) &bull; <span className="font-semibold text-emerald-900">Clean Review</span>: 0 potential issues found &bull; All automated checks passed.
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border-b border-amber-200 w-full">
                <div className="px-4 sm:px-6 py-2 text-amber-800 text-xs font-medium flex items-center">
                  <i className="fa-solid fa-circle-exclamation mr-2 text-amber-500 text-sm"></i>
                  <div>
                    PR #{stats.prNumber} (reviewed at {reviewedAt.toLocaleString()}) &bull; Confidence: <span className="font-bold text-amber-900">{formattedConfidence}%</span>. Please validate reported issues before applying changes &bull; Suggestions can be safely ignored if not applicable.
                  </div>
                </div>
              </div>
            )
          )}
          <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
            <Outlet context={{ setInsights, stats, globalInsights: insights }} />
          </div>
        </main>
        
        {/* Right Sidebar â€” fixed overlay on mobile, always visible on lg+ */}
        <aside
          className={`
            fixed top-0 right-0 bottom-0 w-80 bg-white border-l border-gray-200 overflow-y-auto z-40 shadow-xl
            transform transition-transform duration-300 ease-in-out
            ${rightSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
            lg:static lg:translate-x-0 lg:shadow-sm lg:z-auto lg:flex-shrink-0
          `}
        >
          {/* Mobile close button */}
          <button
            onClick={() => setRightSidebarOpen(false)}
            className="lg:hidden absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
          <RightSidebar />
        </aside>
      </div>
    </div>
  );
}
