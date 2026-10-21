import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';

export default function Settings() {
  // Navigation Tabs State
  const [activeTab, setActiveTab] = useState('automation');

  // UX Feedback & Toolbar State
  const [showBanner, setShowBanner] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState('5');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [exportNotice, setExportNotice] = useState(false);

  // Practical GitSight Profile & Reviewer Preferences
  const initialFormState = {
    // 1. PR Review Automation & Triggers
    autoTriggerPrs: 'enabled',          // 'enabled' | 'disabled'
    skipDraftPrs: 'yes',                // 'yes' | 'no'
    ignoreBotPrs: 'yes',                // 'yes' | 'no'
    targetBranchScope: 'all',           // 'all' | 'default_only' | 'release_only'
    
    // 2. GitHub PR Commenting & Direct Posting Permission
    allowDirectPosting: 'enabled',       // 'enabled' | 'preview_only' | 'disabled'
    formalReviewAction: 'comment_only', // 'comment_only' | 'approve_request_changes'
    includeCodeSuggestions: 'yes',      // 'yes' | 'no'
    
    // 3. AI Reviewer Persona & Strictness
    aiPersona: 'senior_engineer',       // 'senior_engineer' | 'security_auditor' | 'concise_minimal'
    aiModel: 'Claude 3.5 Sonnet (High Precision)',
    reviewStrictness: 'balanced',       // 'critical_only' | 'balanced' | 'strict_audit'
    
    // 4. File Ignorance Rules
    ignoredFilePatterns: '*.min.js, *.lock, package-lock.json, **/dist/**, **/vendor/**',
    
    // 5. Notifications & Email Preferences
    emailNotificationTrigger: 'completed', // 'started' | 'failed' | 'success' | 'completed' | 'none'
    doNotDisturb: 'disabled',              // 'enabled' | 'disabled'
    slackWebhook: 'https://hooks.slack.com/services/T048382/B049281/xyz98240982',
    
    // Identity Defaults
    displayName: 'Octocat GitHub',
    email: 'octocat@github.com',
    githubUsername: 'octocat',
    defaultRepo: 'fastapi-backend-service',
    timezone: 'UTC+05:30',
  };

  const [formData, setFormData] = useState(initialFormState);

  // Available Section Tabs
  const TABS = [
    { id: 'automation', label: 'PR Automation', icon: 'fa-solid fa-bolt' },
    { id: 'comments', label: 'GitHub Comments', icon: 'fa-brands fa-github' },
    { id: 'ai_persona', label: 'AI Persona & Model', icon: 'fa-solid fa-brain' },
    { id: 'file_rules', label: 'File Ignorance Rules', icon: 'fa-solid fa-filter' },
    { id: 'notifications', label: 'Email Notifications & DND', icon: 'fa-solid fa-envelope' },
  ];

  const currentTabIndex = TABS.findIndex((t) => t.id === activeTab);

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    setSaveSuccess(false);
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setHasChanges(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    }, 600);
  };

  const handleDiscard = () => {
    setFormData(initialFormState);
    setHasChanges(false);
    setSaveSuccess(false);
  };

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    }, 800);
  };

  const handleExportConfig = () => {
    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 3000);
  };

  const handleSendFeedback = (e) => {
    e.preventDefault();
    setFeedbackSent(true);
    setTimeout(() => {
      setFeedbackSent(false);
      setFeedbackModalOpen(false);
      setFeedbackText('');
    }, 1500);
  };

  return (
    <div className="pb-12">
      {/* Header section matching GitSight / Analytics.jsx */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-gray-200 gap-3">
        <div>
          <nav className="flex items-center space-x-1.5 text-xs text-gray-500 mb-1">
            <Link to="/" className="hover:underline hover:text-gray-900 cursor-pointer transition-colors">
              Home
            </Link>
            <span className="text-gray-400">&gt;</span>
            <span className="font-bold text-gray-900">Settings</span>
          </nav>
          <h1 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
            <span className="font-bold text-blue-700">Settings</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure PR auto-review triggers, GitHub comment posting policies, AI persona, and email alert rules.
          </p>
        </div>
      </div>

      {/* Main Container */}
      <div className="mt-4 bg-white border border-gray-200 rounded-sm shadow-xs overflow-hidden">
        
        {/* Top Section Navigation Tabs Bar (from user screenshot) */}
        <div className="bg-[#f8f9fa] border-b border-gray-200 px-3 flex flex-wrap items-center justify-between gap-2">
          
          {/* Clickable and selectable Section Tabs */}
          <div className="flex items-center space-x-1 sm:space-x-1 text-xs overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden w-full sm:w-auto py-1">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center space-x-2 px-3 sm:px-3.5 py-2 sm:py-2.5 font-medium transition-colors cursor-pointer select-none shrink-0 text-xs ${
                    isActive
                      ? "text-blue-700 font-semibold"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/80"
                  }`}
                >
                  <i className={`${tab.icon} ${isActive ? 'text-blue-600' : 'text-gray-400'} text-xs`}></i>
                  <span>{tab.label}</span>
                  {/* Active Blue Underline Indicator */}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600"></div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Actions (Save & Discard) on the right */}
          <div className="flex items-center space-x-2 text-xs py-1.5 w-full sm:w-auto justify-end border-t sm:border-t-0 border-gray-100">
            {/* Current Status Badge (Unsaved vs Saved) */}
            <StatusBadge state={hasChanges ? 'unsaved' : 'saved'} />

            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`px-3 py-1 font-medium rounded-xs text-xs transition-colors flex items-center space-x-1.5 ${
                hasChanges
                  ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-2xs"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
              title="Save configuration changes"
            >
              <i className={`fa-regular fa-floppy-disk ${isSaving ? 'animate-spin' : ''}`}></i>
              <span>Save</span>
            </button>

            <button
              onClick={handleDiscard}
              disabled={!hasChanges}
              className={`px-2.5 py-1 text-xs font-medium rounded-xs border transition-colors ${
                hasChanges
                  ? "border-gray-300 text-gray-700 hover:bg-gray-100 cursor-pointer"
                  : "border-gray-200 text-gray-300 cursor-not-allowed"
              }`}
              title="Discard unsaved changes"
            >
              Discard
            </button>
          </div>
        </div>

        {/* Informational Callout Banner */}
        {showBanner && (
          <div className="bg-[#e7f3fd] border-b border-[#c2e0f9] text-[#0b5394] px-4 py-2.5 flex items-center justify-between text-xs transition-all">
            <div className="flex items-start sm:items-center space-x-2.5">
              <i className="fa-solid fa-circle-info text-[#0078d4] text-sm shrink-0 mt-0.5 sm:mt-0"></i>
              <div>
                <span>Automated review settings apply to all pull requests authored or tracked by <strong>@{formData.githubUsername}</strong>. </span>
                <Link to="/review-rules" className="text-[#0078d4] hover:underline font-semibold ml-1">
                  Configure repository-specific rules &gt;
                </Link>
              </div>
            </div>
            <button
              onClick={() => setShowBanner(false)}
              className="text-[#0b5394] hover:text-black ml-4 p-1 transition-colors"
              title="Dismiss notice"
            >
              <i className="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>
        )}

        {/* Form Body Area: Renders the Active Tab */}
        <div className="p-6">

          {/* ======================================================== */}
          {/* TAB 1: PR REVIEW AUTOMATION & TRIGGERS                    */}
          {/* ======================================================== */}
          {activeTab === 'automation' && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <h2 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
                  <span>PR Review Automation & Triggers</span>
                </h2>
                <p className="text-xs text-gray-600 mt-1 max-w-3xl leading-relaxed">
                  Control when and how GitSight initiates AI review analysis when pull requests are created or updated with new commits.
                </p>
              </div>

              {/* Auto-Trigger AI Reviews (Radio Group) */}
              <div className="space-y-2 max-w-2xl">
                <label className="text-xs font-semibold text-gray-900 flex items-center">
                  Automated PR Review Trigger <span className="text-red-500 ml-0.5">*</span>
                </label>

                <div className="space-y-2 p-3 ">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="autoTriggerPrs"
                      value="enabled"
                      checked={formData.autoTriggerPrs === 'enabled'}
                      onChange={() => handleFieldChange('autoTriggerPrs', 'enabled')}
                      className="mt-0.5 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-xs font-semibold text-gray-900 block flex items-center space-x-1.5">
                        <span>Enabled — Auto-Trigger on Every PR</span>
                        <span className="text-[10px] text-green-700 px-1.5 py-0.2  font-semibold">Recommended</span>
                      </span>
                      <span className="text-[11px] text-gray-500">
                        GitSight automatically triggers a code review immediately when a pull request is opened or updated with new commits.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3 cursor-pointer pt-1">
                    <input
                      type="radio"
                      name="autoTriggerPrs"
                      value="disabled"
                      checked={formData.autoTriggerPrs === 'disabled'}
                      onChange={() => handleFieldChange('autoTriggerPrs', 'disabled')}
                      className="mt-0.5 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-xs font-semibold text-gray-900 block">
                        Disabled — Manual Trigger Only
                      </span>
                      <span className="text-[11px] text-gray-500">
                        Never reviews automatically. You must manually click <strong>"Run AI Review"</strong> in the dashboard or mention <code className="text-blue-700 bg-white px-1 border border-gray-200 rounded">@gitsight review</code> on GitHub.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Draft PRs & Bot Filtering (Radio Buttons in 2 Columns) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl pt-1">

                {/* Bot PR Filtering */}
                <div className="space-y-1.5">
                </div>

              </div>

              {/* Target Branch Scope Dropdown */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2 sm:gap-6 items-center max-w-2xl pt-1">
                <div className="md:col-span-4">
                  <label className="text-xs font-semibold text-gray-900 flex items-center">
                    Target Branch Scope <span className="text-red-500 ml-0.5">*</span>
                  </label>
                </div>
                <div className="md:col-span-8">
                  <select
                    value={formData.targetBranchScope}
                    onChange={(e) => handleFieldChange('targetBranchScope', e.target.value)}
                    className="w-full border border-gray-300 rounded-sm px-3 py-1.5 text-xs text-gray-800 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-2xs"
                  >
                    <option value="all">All Branches (Review PRs targeting any branch)</option>
                    <option value="default_only">Default Branch Only (main / master)</option>
                    <option value="release_only">Protected Branches Only (main, develop, release/*)</option>
                  </select>
                  <span className="text-[11px] text-gray-500 mt-1 block">
                    PRs targeting other branches will be skipped.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: GITHUB COMMENT POSTING & VISIBILITY POLICY         */}
          {/* ======================================================== */}
          {activeTab === 'comments' && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <h2 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
                  <span>GitHub Comment Posting & Visibility Policy</span>
                </h2>
                <p className="text-xs text-gray-600 mt-1 max-w-3xl leading-relaxed">
                  Choose whether AI reviews are published directly to GitHub conversations or held privately in GitSight for approval.
                </p>
              </div>

              {/* Direct GitHub PR Posting Dropdown */}
              <div className="space-y-2 max-w-3xl">
                <label className="text-xs font-semibold text-gray-900 flex items-center">
                  Direct GitHub PR Posting Permission <span className="text-red-500 ml-0.5">*</span>
                </label>

                <div className="space-y-2">
                  <select
                    value={formData.allowDirectPosting}
                    onChange={(e) => handleFieldChange('allowDirectPosting', e.target.value)}
                    className="w-full border border-gray-300 rounded-sm px-3 py-2 text-xs text-gray-800 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-2xs font-medium cursor-pointer"
                  >
                    <option value="enabled">
                      Enabled — Allow GitSight to post comments & reviews directly to GitHub PRs (Octokit)
                    </option>
                    <option value="preview_only">
                      Preview Only — Require manual approval in GitSight before posting to GitHub
                    </option>
                    <option value="disabled">
                      Disabled — Never post comments or reviews to GitHub (Read-Only Analysis)
                    </option>
                  </select>

                  <div className="p-3 text-xs leading-relaxed">
                    {formData.allowDirectPosting === 'enabled' && (
                      <div className="flex items-start space-x-2.5 text-gray-700">
                        <i className="fa-solid fa-circle-check text-green-600 text-sm mt-0.5 shrink-0"></i>
                        <div>
                          <span className="font-semibold text-gray-900 block">Direct GitHub Posting is Active</span>
                          <span className="text-[11px] text-gray-500 block mt-0.5">
                            GitSight uses authenticated Octokit APIs to publish inline diff comments, suggestions, and PR review summaries directly to the pull request conversation on GitHub as soon as automated reviews complete.
                          </span>
                        </div>
                      </div>
                    )}

                    {formData.allowDirectPosting === 'preview_only' && (
                      <div className="flex items-start space-x-2.5 text-gray-700">
                        <i className="fa-solid fa-eye text-blue-600 text-sm mt-0.5 shrink-0"></i>
                        <div>
                          <span className="font-semibold text-gray-900 block">Internal Staging & Approval Mode</span>
                          <span className="text-[11px] text-gray-500 block mt-0.5">
                            Review comments and security ratings remain private inside your GitSight dashboard. Nothing is published to GitHub until an engineer inspects the findings and clicks <strong>"Publish Review to GitHub"</strong>.
                          </span>
                        </div>
                      </div>
                    )}

                    {formData.allowDirectPosting === 'disabled' && (
                      <div className="flex items-start space-x-2.5 text-gray-700">
                        <i className="fa-solid fa-ban text-gray-500 text-sm mt-0.5 shrink-0"></i>
                        <div>
                          <span className="font-semibold text-gray-900 block">GitHub Posting is Disabled</span>
                          <span className="text-[11px] text-gray-500 block mt-0.5">
                            GitSight operates in passive read-only observation mode. It generates local telemetry and dashboard metrics, but will never write or post comments to GitHub repositories.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Code Suggestion Diff Blocks */}
              {formData.allowDirectPosting !== 'disabled' ? (
                <div className="space-y-1.5 max-w-3xl pt-1">
                  <label className="text-xs font-semibold text-gray-900 block">
                    Runnable Suggestion Blocks <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <div className="space-y-2 p-3">
                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input
                        type="radio"
                        name="includeCodeSuggestions"
                        value="yes"
                        checked={formData.includeCodeSuggestions === 'yes'}
                        onChange={() => handleFieldChange('includeCodeSuggestions', 'yes')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-800">Include 1-click 'Commit Suggestion' diffs</span>
                    </label>
                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input
                        type="radio"
                        name="includeCodeSuggestions"
                        value="no"
                        checked={formData.includeCodeSuggestions === 'no'}
                        onChange={() => handleFieldChange('includeCodeSuggestions', 'no')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-800">Text explanations only (No patch code)</span>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-gray-400 italic bg-gray-50 p-2.5 rounded-sm border border-dashed border-gray-200 max-w-3xl">
                  Commit suggestions are inactive while Direct GitHub PR Posting is set to 'Disabled'.
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: AI REVIEWER PERSONA, MODEL & STRICTNESS            */}
          {/* ======================================================== */}
          {activeTab === 'ai_persona' && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <h2 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
                  <span>AI Reviewer Persona & Intelligence Strictness</span>
                </h2>
                <p className="text-xs text-gray-600 mt-1 max-w-3xl leading-relaxed">
                  Tune the tone of comments left on pull requests and specify how rigorously GitSight enforces code standards.
                </p>
              </div>

              {/* AI Reviewer Persona (Radio Cards) */}
              <div className="space-y-2 max-w-3xl">
                <label className="text-xs font-semibold text-gray-900 block">
                  Reviewer Tone & Persona <span className="text-red-500 ml-0.5">*</span>
                </label>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label className={`p-3 border rounded-sm cursor-pointer transition-all ${
                    formData.aiPersona === 'senior_engineer'
                      ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-600'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="aiPersona"
                        value="senior_engineer"
                        checked={formData.aiPersona === 'senior_engineer'}
                        onChange={() => handleFieldChange('aiPersona', 'senior_engineer')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs font-semibold text-gray-900">Senior Engineer</span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-2 leading-normal">
                      Constructive, friendly, and educational. Explains <em>why</em> an edge case is risky and suggests idiomatic patterns.
                    </p>
                  </label>

                  <label className={`p-3 border rounded-sm cursor-pointer transition-all ${
                    formData.aiPersona === 'security_auditor'
                      ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-600'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="aiPersona"
                        value="security_auditor"
                        checked={formData.aiPersona === 'security_auditor'}
                        onChange={() => handleFieldChange('aiPersona', 'security_auditor')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs font-semibold text-gray-900">Security Auditor</span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-2 leading-normal">
                      Direct and vigilant. Zeroes in on race conditions, OWASP vulnerabilities, token leaks, and SQL injections without fluff.
                    </p>
                  </label>

                  <label className={`p-3 border rounded-sm cursor-pointer transition-all ${
                    formData.aiPersona === 'concise_minimal'
                      ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-600'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="aiPersona"
                        value="concise_minimal"
                        checked={formData.aiPersona === 'concise_minimal'}
                        onChange={() => handleFieldChange('aiPersona', 'concise_minimal')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs font-semibold text-gray-900">Concise & Minimal</span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-2 leading-normal">
                      Ultra-compact bullet points and code patches only. Zero conversational sentences to save reading time.
                    </p>
                  </label>
                </div>
              </div>

              {/* AI Reasoning Model & Strictness Dropdowns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl pt-1">
                
                {/* LLM Model Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-900 block">
                    AI Model Engine <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <select
                    value={formData.aiModel}
                    onChange={(e) => handleFieldChange('aiModel', e.target.value)}
                    className="w-full border border-gray-300 rounded-sm px-3 py-1.5 text-xs text-gray-800 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-2xs"
                  >
                    <option value="Claude 3.5 Sonnet (High Precision)">Claude 3.5 Sonnet (Deep Architectural Reasoning)</option>
                    <option value="OpenAI GPT-4o (Fast Response)">OpenAI GPT-4o (High Speed & Balanced Logic)</option>
                    <option value="DeepSeek V3 (Deep Algorithms)">DeepSeek V3 (Algorithmic & Math Scrutiny)</option>
                    <option value="GitSight Fast Mini (Low Latency)">GitSight Fast Mini (Ultra-Fast Lint & Syntax)</option>
                  </select>
                  <span className="text-[11px] text-gray-500">Determines the core reasoning LLM invoked during pull request diff analysis.</span>
                </div>

                {/* Review Strictness Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-900 block">
                    Review Strictness & Threshold <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <select
                    value={formData.reviewStrictness}
                    onChange={(e) => handleFieldChange('reviewStrictness', e.target.value)}
                    className="w-full border border-gray-300 rounded-sm px-3 py-1.5 text-xs text-gray-800 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-2xs"
                  >
                    <option value="critical_only">High & Critical Only (Zero noise, only fatal bugs)</option>
                    <option value="balanced">Balanced Quality (Standard bugs, performance, and security)</option>
                    <option value="strict_audit">Strict Audit (Flags style, docs, type safety, test gaps)</option>
                  </select>
                  <span className="text-[11px] text-gray-500">Lower strictness eliminates low-value stylistic noise on PR discussions.</span>
                </div>

              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: FILE IGNORANCE RULES                               */}
          {/* ======================================================== */}
          {activeTab === 'file_rules' && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <h2 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
                  <span>File Ignorance Rules</span>
                </h2>
                <p className="text-xs text-gray-600 mt-1 max-w-3xl leading-relaxed">
                  Prevent PR comment overload by skipping automatically generated build bundles and lockfiles.
                </p>
              </div>

              <div className="space-y-4 max-w-3xl">
                {/* Ignored File Patterns (Glob) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-900 block">
                    Ignored File Patterns (Glob Syntax) <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.ignoredFilePatterns}
                    onChange={(e) => handleFieldChange('ignoredFilePatterns', e.target.value)}
                    placeholder="*.min.js, *.lock, package-lock.json, **/dist/**"
                    className="w-full border border-gray-300 rounded-sm px-3 py-2 text-xs text-gray-800 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-2xs font-mono"
                  />
                  <span className="text-[11px] text-gray-500">
                    Files matching these glob patterns will be completely ignored by the AI review engine to eliminate noise and save compute tokens.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: EMAIL NOTIFICATIONS & DO NOT DISTURB               */}
          {/* ======================================================== */}
          {activeTab === 'notifications' && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <h2 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
                  <span>Email Notifications & Delivery Preferences</span>
                </h2>
                <p className="text-xs text-gray-600 mt-1 max-w-3xl leading-relaxed">
                  Configure when GitSight sends email alerts to <strong>{formData.email}</strong>, and toggle Do Not Disturb mode.
                </p>
              </div>

              {/* DND Active Alert Callout */}
              {formData.doNotDisturb === 'enabled' && (
                <div className="text-amber-900 p-3 text-xs flex items-start space-x-2.5 max-w-3xl">
                  <i className="fa-solid fa-bell-slash text-amber-600 text-sm mt-0.5 shrink-0"></i>
                  <div>
                    <span className="font-semibold block">Do Not Disturb is currently Active</span>
                    <span className="text-[11px] text-amber-800 block mt-0.5">
                      All outgoing email notifications are completely suppressed. Even though an email trigger is configured below, <strong>no emails will be sent</strong> while Do Not Disturb is enabled.
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-4 max-w-3xl pt-1">
                
                {/* Radio Group: Receive Email Notifications For */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-900 flex items-center">
                      Receive Email Notifications For <span className="text-red-500 ml-0.5">*</span>
                    </label>
                    {formData.doNotDisturb === 'enabled' && (
                      <span className="text-[10px] font-semibold text-amber-700 px-2 py-0.5">
                        Muted by Do Not Disturb
                      </span>
                    )}
                  </div>

                  <div className={`space-y-2.5 p-3.5 transition-opacity ${
                    formData.doNotDisturb === 'enabled' ? 'opacity-75' : ''
                  }`}>
                    {/* Option 1: Started */}
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="emailNotificationTrigger"
                        value="started"
                        checked={formData.emailNotificationTrigger === 'started'}
                        onChange={() => handleFieldChange('emailNotificationTrigger', 'started')}
                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-xs font-medium text-gray-900 block">When PR review started</span>
                        <span className="text-[11px] text-gray-500">
                          Sends an email alert immediately when a pull request webhook is received and AI analysis begins.
                        </span>
                      </div>
                    </label>

                    {/* Option 2: Failed */}
                    <label className="flex items-start space-x-3 cursor-pointer pt-1">
                      <input
                        type="radio"
                        name="emailNotificationTrigger"
                        value="failed"
                        checked={formData.emailNotificationTrigger === 'failed'}
                        onChange={() => handleFieldChange('emailNotificationTrigger', 'failed')}
                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-xs font-medium text-gray-900 block">When PR review failed</span>
                        <span className="text-[11px] text-gray-500">
                          Sends an email alert only if automated checks, AI pipeline parsing, or repository webhooks encounter an error.
                        </span>
                      </div>
                    </label>

                    {/* Option 3: Success */}
                    <label className="flex items-start space-x-3 cursor-pointer pt-1">
                      <input
                        type="radio"
                        name="emailNotificationTrigger"
                        value="success"
                        checked={formData.emailNotificationTrigger === 'success'}
                        onChange={() => handleFieldChange('emailNotificationTrigger', 'success')}
                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-xs font-medium text-gray-900 block">When PR review is successful</span>
                        <span className="text-[11px] text-gray-500">
                          Sends an email alert when review finishes with 0 blocking bugs or vulnerabilities (Clean pass).
                        </span>
                      </div>
                    </label>

                    {/* Option 4: Completed */}
                    <label className="flex items-start space-x-3 cursor-pointer pt-1">
                      <input
                        type="radio"
                        name="emailNotificationTrigger"
                        value="completed"
                        checked={formData.emailNotificationTrigger === 'completed'}
                        onChange={() => handleFieldChange('emailNotificationTrigger', 'completed')}
                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-xs font-medium text-gray-900 block flex items-center space-x-1.5">
                          <span>When PR review is completed</span>
                          <span className="text-[10px] text-blue-700 px-1.5 py-0.2 font-semibold">Recommended</span>
                        </span>
                        <span className="text-[11px] text-gray-500">
                          Sends an email review summary whenever any PR review finishes, regardless of issue count.
                        </span>
                      </div>
                    </label>

                    {/* Option 5: None */}
                    <label className="flex items-start space-x-3 cursor-pointer pt-1">
                      <input
                        type="radio"
                        name="emailNotificationTrigger"
                        value="none"
                        checked={formData.emailNotificationTrigger === 'none'}
                        onChange={() => handleFieldChange('emailNotificationTrigger', 'none')}
                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-xs font-medium text-gray-900 block">Receive none</span>
                        <span className="text-[11px] text-gray-500">
                          Never send email notifications for pull request reviews (Dashboard only).
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Do Not Disturb Radio Group */}
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-semibold text-gray-900 block">
                    Do Not Disturb <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className={`p-3 border rounded-sm cursor-pointer transition-all ${
                      formData.doNotDisturb === 'enabled'
                        ? 'border-amber-500 bg-amber-50/50 ring-1 ring-amber-500'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="doNotDisturb"
                          value="enabled"
                          checked={formData.doNotDisturb === 'enabled'}
                          onChange={() => handleFieldChange('doNotDisturb', 'enabled')}
                          className="text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-xs font-semibold text-gray-900 flex items-center space-x-1.5">
                          <i className="fa-solid fa-bell-slash text-amber-600 text-xs"></i>
                          <span>Enabled — Do Not Disturb</span>
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600 mt-2 leading-normal">
                        <strong>Will NOT send any emails.</strong> Overrides all triggers selected above and completely silences outgoing email notifications.
                      </p>
                    </label>

                    <label className={`p-3 border rounded-sm cursor-pointer transition-all ${
                      formData.doNotDisturb === 'disabled'
                        ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-600'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="doNotDisturb"
                          value="disabled"
                          checked={formData.doNotDisturb === 'disabled'}
                          onChange={() => handleFieldChange('doNotDisturb', 'disabled')}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs font-semibold text-gray-900 flex items-center space-x-1.5">
                          <i className="fa-solid fa-bell text-blue-600 text-xs"></i>
                          <span>Disabled — Normal Delivery</span>
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600 mt-2 leading-normal">
                        Emails are sent normally according to the selected notification trigger above.
                      </p>
                    </label>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* BOTTOM ACTIONS & TAB NAVIGATION BAR                       */}
          {/* ======================================================== */}
          <div className="pt-6 mt-8 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            
            {/* Previous & Next Tab Navigation Helpers */}
            <div className="flex items-center space-x-2">
              {currentTabIndex > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab(TABS[currentTabIndex - 1].id)}
                  className="px-3 py-1.5 bg-gray-50 border border-gray-300 hover:bg-gray-100 text-xs text-gray-700 rounded-sm font-medium transition-colors flex items-center space-x-1 cursor-pointer"
                >
                  <i className="fa-solid fa-chevron-left text-[10px]"></i>
                  <span>Previous: {TABS[currentTabIndex - 1].label}</span>
                </button>
              )}

              {currentTabIndex < TABS.length - 1 && (
                <button
                  type="button"
                  onClick={() => setActiveTab(TABS[currentTabIndex + 1].id)}
                  className="px-3 py-1.5 bg-gray-50 border border-gray-300 hover:bg-gray-100 text-xs text-gray-700 rounded-sm font-medium transition-colors flex items-center space-x-1 cursor-pointer"
                >
                  <span>Next: {TABS[currentTabIndex + 1].label}</span>
                  <i className="fa-solid fa-chevron-right text-[10px]"></i>
                </button>
              )}
            </div>

            {/* Save & Discard Buttons */}
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-sm shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                {isSaving && <i className="fa-solid fa-spinner animate-spin text-xs"></i>}
                <span>Save Changes</span>
              </button>

              <button
                type="button"
                onClick={handleDiscard}
                disabled={!hasChanges}
                className={`px-4 py-1.5 border border-gray-300 text-xs font-semibold rounded-sm transition-colors ${
                  hasChanges
                    ? "bg-white hover:bg-gray-50 text-gray-700 cursor-pointer"
                    : "bg-gray-50 text-gray-400 cursor-not-allowed"
                }`}
              >
                Discard
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* Feedback Modal */}
      {feedbackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-gray-200 rounded-sm shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <i className="fa-regular fa-heart text-blue-600 text-base"></i>
                <h3 className="text-sm font-bold text-gray-900">Send Feedback</h3>
              </div>
              <button
                onClick={() => setFeedbackModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            {feedbackSent ? (
              <div className="py-6 text-center space-y-2">
                <i className="fa-solid fa-circle-check text-green-600 text-3xl"></i>
                <div className="text-sm font-semibold text-gray-900">Thank you for your feedback!</div>
                <div className="text-xs text-gray-500">Your suggestions help make GitSight better.</div>
              </div>
            ) : (
              <form onSubmit={handleSendFeedback} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">How satisfied are you with GitSight settings?</label>
                  <select
                    value={feedbackRating}
                    onChange={(e) => setFeedbackRating(e.target.value)}
                    className="w-full border border-gray-300 rounded-sm px-2.5 py-1.5 text-xs text-gray-800 bg-white"
                  >
                    <option value="5">⭐⭐⭐⭐⭐ Very Satisfied (Clean & Intuitive)</option>
                    <option value="4">⭐⭐⭐⭐ Satisfied</option>
                    <option value="3">⭐⭐⭐ Neutral</option>
                    <option value="2">⭐⭐ Dissatisfied</option>
                    <option value="1">⭐ Very Dissatisfied</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Comments or Suggestions (Optional)</label>
                  <textarea
                    rows={3}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Tell us what you like or what settings you need..."
                    className="w-full border border-gray-300 rounded-sm p-2 text-xs text-gray-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setFeedbackModalOpen(false)}
                    className="px-3 py-1.5 border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-sm cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-sm cursor-pointer"
                  >
                    Submit Feedback
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
