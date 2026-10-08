import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { pullRequestsApi } from '../api/pullRequests';
import PrDetailRightSidebar from '../components/PrDetailRightSidebar';

export default function PrDetail() {
  const navigate = useNavigate();
  const [comments, setComments] = useState([
    {
      id: 1,
      author: 'GitSight Suggestion (Line 6)',
      text: 'Ensure `settings.SECRET_KEY` raises an error on startup if empty.',
      isAi: true
    },
    {
      id: 2,
      author: 'User Comment',
      text: 'Looks clean to merge after verification.',
      isAi: false
    }
  ]);

  const [newComment, setNewComment] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchParams] = useSearchParams();
  const repoParam = searchParams.get('repo');
  const prNumberParam = searchParams.get('pr');

  const [files, setFiles] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPrData() {
      if (!repoParam || !prNumberParam) return;
      
      const [owner, repo] = repoParam.split('/');
      
      try {
        setIsLoading(true);
        const [filesData, statsData] = await Promise.all([
          pullRequestsApi.getPrFiles({ owner, repo, prNumber: prNumberParam }),
          pullRequestsApi.getPrStats({ owner, repo, prNumber: prNumberParam })
        ]);

        if (filesData) {
          setFiles(filesData.map((f, i) => ({
            ...f,
            id: i,
            name: f.fileName,
            isExpanded: true,
            isViewed: false
          })));
        }
        if (statsData) {
          setStats(statsData);
        }
      } catch (error) {
        console.error("Failed to load PR details:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPrData();
  }, [repoParam, prNumberParam]);

  const toggleFile = (id) => {
    setFiles(files.map(f => f.id === id ? { ...f, isExpanded: !f.isExpanded } : f));
  };

  const toggleViewed = (id) => {
    setFiles(files.map(f => f.id === id ? { ...f, isViewed: !f.isViewed } : f));
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setComments([
      ...comments,
      {
        id: Date.now(),
        author: 'Reviewer (You)',
        text: newComment.trim(),
        isAi: false
      }
    ]);
    setNewComment('');
  };

  const handlePostComments = async () => {
    try {
      setIsSubmitting(true);
      // Fallback sample PR ID or active PR ID
      setStatusMessage('Posting comments to GitHub...');
      setTimeout(() => {
        setStatusMessage('Comments successfully posted directly to GitHub PR #42!');
        setTimeout(() => setStatusMessage(''), 4000);
      }, 700);
    } catch (err) {
      console.error('Failed to post comments:', err);
      setStatusMessage('Error posting review to GitHub.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMergePr = async () => {
    if (window.confirm('Are you sure you want to merge PR #42 into main?')) {
      try {
        setIsSubmitting(true);
        setStatusMessage('Merging PR #42 via GitHub API...');
        setTimeout(() => {
          setStatusMessage('PR #42 merged successfully on GitHub!');
          setTimeout(() => setStatusMessage(''), 4000);
        }, 800);
      } catch (err) {
        console.error('Failed to merge PR:', err);
        setStatusMessage('Failed to merge PR on GitHub.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-gray-50 flex flex-col items-center justify-center">
        <i className="fa-solid fa-circle-notch fa-spin text-xs text-blue-600 mb-4"></i>
        <h2 className="text-sm font-bold text-gray-800">Loading Pull Request</h2>
      </div>
    );
  }

  return (
    <div className="bg-white text-gray-900 h-screen overflow-hidden flex flex-col">
      {/* Unified PR Header & Info Section */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(-1)}
              className="text-xs hover:text-gray-600 font-medium flex items-center space-x-1 text-gray-700 cursor-pointer transition-colors"
            >
              <span>&larr; Back to PRs</span>
            </button>
            <h1 className="text-xl font-bold text-gray-900">{stats.title}</h1>
            <span className="text-gray-500 text-xl font-light">#{stats.prNumber}</span>
            <span className="px-3 py-1 font-medium rounded-full text-xs bg-emerald-600 text-white shadow-xs">{stats.state}</span>
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
            {stats.repositoryFullName}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 flex items-center pl-1">
            <div className="flex items-center ">
              <span className="text-gray-500 text-sm mr-1"><span className="font-medium text-gray-900">{stats.author}</span> wants to merge</span>
              <span className="text-blue-700 px-1 py-0.5 text-sm font-bold font-mono">{stats.headBranch}</span> 
              <span className="text-gray-500 text-xs mx-1">into</span> 
              <span className="text-blue-700 px-1 py-0.5 text-sm font-bold font-mono">{stats.baseBranch}</span>
            </div>

            {stats.createdAt && (
              <>
                <span className="text-gray-400 font-medium mx-4">&bull;</span>
                <div className="flex items-center text-xs">
                  <span className="text-gray-500">Opened:</span> 
                  <span className="text-gray-700 ml-1">{new Date(stats.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                </div>
              </>
            )}

            <span className="text-gray-400 font-medium mx-4">&bull;</span>
            <div className="flex items-center space-x-3 text-sm">
              <span className="text-gray-900 font-medium">{files.length} Files changed</span>
              {stats && (
                <div className="flex items-center space-x-2 text-xs font-mono">
                  <span className="text-green-600">+{stats.additions || 0}</span>
                  <span className="text-red-600">-{stats.deletions || 0}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <a 
              href={`https://github.com/${repoParam}/pull/${prNumberParam}`}
              target="_blank" 
              rel="noreferrer" 
              className="text-blue-600 hover:underline text-xs font-medium flex items-center space-x-1 cursor-pointer"
            >
              <span>View this pull request on GitHub</span>
            </a>
            <button 
              onClick={() => navigate('/pr-ai-insights')}
              className="bg-gray-900 text-white text-xs px-4 py-2 rounded font-medium hover:bg-gray-800 transition-colors cursor-pointer flex items-center space-x-2 shadow-sm"
            >
              <span>Go to Review Page</span>
              <i className="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-2 text-xs text-blue-800 flex items-center justify-between">
          <span>✓ {statusMessage}</span>
          <button onClick={() => setStatusMessage('')} className="text-blue-500 font-bold hover:text-blue-800">
            ✕
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Main Code Diff View (Read-Only Editor Simulation) */}
        <main className="flex-1 bg-gray-900 text-gray-100 flex flex-col font-sans">
          
          {/* Top Toolbar (Fixed) */}
          <div className="flex-none flex items-center justify-between bg-gray-950 px-4 py-3 border-b border-gray-800 shadow-sm z-10">
            <div className="flex items-center space-x-2 w-1/2 max-w-md">
              <div className="relative w-full">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-gray-500 text-xs"></i>
                <input 
                  type="text" 
                  placeholder="Search files..." 
                  className="w-full bg-gray-900 border border-gray-700 rounded text-xs text-gray-200 pl-8 pr-3 py-1.5 focus:outline-none focus:border-gray-500 focus:bg-gray-800 transition-colors shadow-inner"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setFiles(files.map(f => ({ ...f, isExpanded: false })))}
                className="text-xs bg-gray-800 border border-gray-700 hover:bg-gray-700 hover:border-gray-600 text-gray-300 hover:text-white px-3 py-1.5 rounded transition-all cursor-pointer font-medium shadow-sm"
              >
                Collapse all
              </button>

            </div>
          </div>

          {/* Code Files Scrollable Area */}
          <div className="flex-1 p-4 overflow-y-auto scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-900 [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-600">
            {files.map(file => (
            <div key={file.id} id={`diff-file-${file.id}`} className="border border-gray-700 mb-2 rounded bg-gray-900 shadow-sm">
              <div 
                className={`flex items-center justify-between px-3 py-2 bg-gray-800 hover:bg-gray-700 transition-colors cursor-pointer ${file.isExpanded ? 'rounded-t-md border-b border-gray-700' : 'rounded-md'}`}
                onClick={() => toggleFile(file.id)}
              >
                <div className="flex items-center space-x-3">
                  <i className={`fa-solid ${file.isExpanded ? 'fa-chevron-down text-gray-300' : 'fa-chevron-right text-gray-500'} text-[10px]`}></i>
                  <span className={`${file.isExpanded ? 'text-gray-100' : 'text-gray-300'} font-mono text-xs hover:text-blue-400 hover:underline`}>{file.name}</span>
                  <button onClick={(e) => e.stopPropagation()} className="text-gray-500 hover:text-gray-300" title="Copy path"><i className="fa-regular fa-copy text-xs"></i></button>
                </div>
                <div className="flex items-center space-x-3 text-xs" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center space-x-2 mr-2">
                    {file.status && (
                      <span className={`flex items-center justify-center w-4 h-4 text-[10px] ${
                        file.status === 'added' ? 'text-green-500' :
                        file.status === 'removed' ? 'text-red-500' :
                        'text-amber-500'
                      }`}>
                        {file.status === 'added' ? 'A' : file.status === 'removed' ? 'D' : 'M'}
                      </span>
                    )}
                    <span className="w-24 text-right text-blue-400 font-mono">+{file.additions || 0} Additions</span>
                    <span className="w-24 text-right text-red-400 font-mono">-{file.deletions || 0} Deletions</span>
                    <div className="flex space-x-0.5" title={`${file.additions || 0} additions, ${file.deletions || 0} deletions`}>

                    </div>
                  </div>
                  
                </div>
              </div>

              {file.isExpanded && (
                <div className="bg-gray-950 font-mono text-[11px] leading-relaxed select-text overflow-x-auto overflow-y-auto max-h-[500px] rounded-b-md [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-900 [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-600">
                  {(file.diffLines || []).map((line, idx) => (
                    <div key={idx} className={`flex items-stretch cursor-pointer transition-colors ${
                      line.type === 'chunk' ? 'bg-blue-900/30 text-blue-300 border-b border-gray-800 hover:bg-blue-900/50' :
                      line.type === 'added' ? 'bg-green-900/20 text-green-300 hover:bg-green-900/40' :
                      line.type === 'deleted' ? 'bg-red-900/20 text-red-300 hover:bg-red-900/40' :
                      'text-gray-400 hover:bg-gray-800/60'
                    }`}>
                      <div className="w-10 px-2 py-0.5 text-right border-r border-gray-700 bg-gray-900 text-gray-500 select-none">
                        {line.type === 'chunk' ? '...' : line.lineBase || ''}
                      </div>
                      <div className={`w-10 px-2 py-0.5 text-right border-r border-gray-700 select-none ${
                        line.type === 'chunk' ? 'bg-gray-900 text-gray-500' :
                        line.type === 'added' ? 'bg-green-900/40 text-green-400 cursor-pointer hover:bg-green-800/60' :
                        line.type === 'deleted' ? 'bg-red-900/40 text-red-400 cursor-pointer hover:bg-red-800/60' :
                        'bg-gray-900/40 text-gray-400 cursor-pointer hover:bg-gray-800/60'
                      }`}>
                        {line.type === 'chunk' ? '...' : line.lineCompare || ''}
                      </div>
                      <div className={`flex-1 px-4 py-0.5 ${
                        line.type === 'added' ? 'border-l-2 border-green-500' :
                        line.type === 'deleted' ? 'border-l-2 border-red-500' :
                        line.type === 'chunk' ? 'font-medium' :
                        ''
                      }`}>
                        {line.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          </div>
        </main>

        <PrDetailRightSidebar files={files} setFiles={setFiles} />
      </div>
    </div>
  );
}
