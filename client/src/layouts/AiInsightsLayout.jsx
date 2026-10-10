import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { pullRequestsApi } from '../api/pullRequests';
import StatusBadge from '../components/StatusBadge';

const AiNavbar = ({ navigate, location, stats, insights }) => {
  const [searchParams] = useSearchParams();
  const [isReReviewing, setIsReReviewing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isTracking, setIsTracking] = useState(false);

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

  return (
    <header className="bg-white border-b border-gray-200 shrink-0 sticky top-0 z-20">
      {/* Top utility bar */}
      <div className="px-6 py-2 border-b border-gray-100 flex items-center justify-between bg-gray-100">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-xs font-medium text-gray-500 hover:text-gray-900 cursor-pointer"
        >
          &larr; Back to Pull Request Details
        </button>
      </div>
      
      {/* PR Metadata bar */}
      <div className="px-6 py-4 mx-auto w-full">
        {stats ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <h1 className="text-xl font-bold text-gray-900">{stats.title}</h1>
                <span className="text-xl font-light text-gray-400">#{stats.prNumber}</span>
                <StatusBadge state={stats.state} mergedAt={stats.mergedAt} isDraft={stats.isDraft} />
                <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2.5 py-0.5 rounded-full">
                  {stats.repositoryFullName || (stats.htmlUrl && stats.htmlUrl.split('github.com/')[1]?.split('/pull')[0]) || "repository"}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="inline-flex items-center space-x-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors shrink-0 cursor-pointer p-1.5"
                  title="Sync all active issues to track"
                >
                  <span>Track Issues</span>
                </button>
                <button
                  onClick={handleReReview}
                  disabled={isReReviewing}
                  className="inline-flex items-center space-x-1 text-xs font-medium bg-slate-50 border border-gray-300 text-gray-700 px-3 py-1.5 rounded shadow-sm hover:bg-gray-50 disabled:opacity-50 cursor-pointer transition-colors shrink-0"
                >
                  <i className={`fa-solid fa-rotate-right ${isReReviewing ? 'animate-spin' : ''}`}></i>
                  <span>{isReReviewing ? 'Re-reviewing...' : 'Trigger Re-review'}</span>
                </button>
              </div>
            </div>
            
            <div className="flex items-center text-xs text-gray-600 space-x-4">
              <div>
                <span className="font-semibold text-gray-900">{stats.author}</span>
                <span> wants to merge </span>
                <span className="font-mono text-blue-600 bg-blue-50 px-1 rounded">{stats.headBranch}</span>
                <span> into </span>
                <span className="font-mono text-blue-600 bg-blue-50 px-1 rounded">{stats.baseBranch}</span>
              </div>
              <span className="text-gray-300">&bull;</span>
              <span>Opened: {new Date(stats.createdAt).toLocaleDateString()}</span>
              <span className="text-gray-300">&bull;</span>
              <div className="flex items-center space-x-2 font-medium">
                <span className="text-gray-900">{stats.changedFiles} Files changed</span>
                <span className="text-emerald-600">+{stats.additions}</span>
                <span className="text-red-600">-{stats.deletions}</span>
              </div>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white p-6 shadow-2xl w-[400px] border border-gray-400 rounded-none">
            <h2 className="text-base font-bold text-gray-900 mb-3">Track Issues</h2>
            <p className="text-sm text-gray-800 mb-6 leading-relaxed">
              You are about to track <span className="font-bold">{insights?.issues?.length || 0} issues</span> to manage them. You can see them on <span className="font-bold">Home &rarr; Issues</span>.
            </p>
            <div className="flex justify-end space-x-4">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="px-5 py-2 border-2 border-gray-300 text-gray-700 text-sm font-bold hover:bg-gray-100 rounded-none cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setIsTracking(true);
                  // Simulate network request
                  setTimeout(() => {
                    console.log('Confirmed tracking issues...');
                    setIsTracking(false);
                    setShowConfirmModal(false);
                  }, 1500);
                }}
                disabled={isTracking}
                className={`px-5 py-2 text-white text-sm font-bold rounded-none ${
                  isTracking ? 'bg-blue-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
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
    </header>
  );
};

const RightSidebar = () => (
  <div className="p-5 space-y-8">

    <div>
      <h3 className="text-sm font-bold text-gray-900 mb-3 border-b pb-2 flex items-center space-x-2">
        <i className="fa-solid fa-list-ul text-blue-500"></i>
        <span>Legend Guide</span>
      </h3>
      <div className="text-xs text-gray-600 space-y-4">
        <div>
          <span className="font-semibold text-gray-900 block mb-1">Confidence Score</span>
          <p className="text-gray-500 leading-relaxed">
            The AI's self-assessed certainty (0-100%) that the reported issues are valid bugs and not false positives.
          </p>
        </div>
        
        <div className="space-y-2">
          <span className="font-semibold text-gray-900 block mb-1">Severity Levels</span>
          <div className="flex items-start space-x-2">
            <span className="w-2 h-2 rounded-full bg-red-600 mt-1 shrink-0"></span>
            <p><span className="font-semibold text-gray-800">High (7-10):</span> Critical security vulnerabilities or breaking bugs that must be fixed.</p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0"></span>
            <p><span className="font-semibold text-gray-800">Medium (4-6):</span> Code smells, performance regressions, or bad architectural practices.</p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0"></span>
            <p><span className="font-semibold text-gray-800">Low (1-3):</span> Suggestions for code readability or test coverage improvements.</p>
          </div>
        </div>
      </div>
    </div>

    <div>
      <h3 className="text-sm font-bold text-gray-900 mb-3 border-b pb-2 flex items-center space-x-2">
        <i className="fa-solid fa-triangle-exclamation text-amber-500"></i>
        <span>Warning</span>
      </h3>
      <div className="text-xs text-gray-500 space-y-2 leading-relaxed">
        <p>
          GitSight AI can make mistakes. All insights and generated code should be carefully validated.
        </p>
        <p>
          Ensure that any accepted changes adhere to your organization's specific coding standards and security guidelines. This tool provides a general overview and is not a substitute for thorough manual review.
        </p>
      </div>
    </div>
  </div>
);

export default function AiInsightsLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState(null);

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

  return (
    <div className="bg-gray-50 text-gray-900 h-screen flex flex-col font-sans overflow-hidden">
      <AiNavbar navigate={navigate} location={location} stats={stats} insights={insights} />
      <div className="flex flex-1 overflow-hidden">
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {stats && insights && (
            <div className="bg-amber-50 border-b border-amber-200 w-full">
              <div className="px-6 py-2 text-amber-800 text-xs font-medium flex items-center">
                <i className="fa-solid fa-circle-exclamation mr-2 text-amber-500 text-sm"></i>
                <div>
                  This PR #{stats.prNumber} review was opened at {openedAt.toLocaleString()} and was reviewed at {reviewedAt.toLocaleString()} and has an overall confidence score of <span className="font-bold text-amber-900">{insights.overallConfidenceScore || 0}%</span>.
                </div>
              </div>
            </div>
          )}
          <div className="max-w-5xl mx-auto p-6 space-y-6">
            <Outlet context={{ setInsights, stats }} />
          </div>
        </main>
        
        {/* Fixed Right Sidebar */}
        <aside className="w-80 bg-white border-l border-gray-200 overflow-y-auto flex-shrink-0 shadow-sm z-10">
          <RightSidebar />
        </aside>
      </div>
    </div>
  );
}
