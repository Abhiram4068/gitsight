import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { pullRequestsApi } from '../api/pullRequests';
import StatusBadge from '../components/StatusBadge';

const AiNavbar = ({ navigate, location, stats }) => {
  const [searchParams] = useSearchParams();
  const [isReReviewing, setIsReReviewing] = useState(false);

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
              <button
                onClick={handleReReview}
                disabled={isReReviewing}
                className="inline-flex items-center space-x-1 text-xs font-medium bg-slate-50 border border-gray-300 text-gray-700 px-3 py-1.5 rounded shadow-sm hover:bg-gray-50 disabled:opacity-50 cursor-pointer transition-colors shrink-0"
              >
                <i className={`fa-solid fa-rotate-right ${isReReviewing ? 'animate-spin' : ''}`}></i>
                <span>{isReReviewing ? 'Re-reviewing...' : 'Trigger Re-review'}</span>
              </button>
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
    </header>
  );
};

const RightSidebar = () => (
  <div className="p-5 space-y-8">

    {/* <div>
      <h3 className="text-sm font-bold text-gray-900 mb-3 border-b pb-2">AI Confidence Score</h3>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-gray-600">Overall Accuracy</span>
          <span className="text-emerald-600">94%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '94%' }}></div>
        </div>
        <p className="text-[10px] text-gray-500 pt-2">
          Insights generated by GitSight AI based on 142 similar repositories.
        </p>
      </div>
    </div> */}

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

  return (
    <div className="bg-gray-50 text-gray-900 h-screen flex flex-col font-sans overflow-hidden">
      <AiNavbar navigate={navigate} location={location} stats={stats} />
      <div className="flex flex-1 overflow-hidden">
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {stats && (
            <div className="bg-amber-50 border-b border-amber-200 w-full">
              <div className="max-w-5xl mx-auto px-6 py-2 text-amber-800 text-xs font-medium flex items-center">
                <i className="fa-solid fa-circle-exclamation mr-3 text-amber-500 text-base"></i>
                <div>
                  This PR review was triggered at {new Date(stats.createdAt || Date.now()).toLocaleString()} and was completed at {new Date(stats.updatedAt || Date.now()).toLocaleString()} and has an overall confidence score of <span className="font-bold text-amber-900">{insights?.overallConfidenceScore ? insights.overallConfidenceScore : 0}%</span>.
                </div>
              </div>
            </div>
          )}
          <div className="max-w-5xl mx-auto p-6 space-y-6">
            <Outlet context={{ setInsights }} />
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
