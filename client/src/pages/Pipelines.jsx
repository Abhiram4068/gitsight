import React, { useState, useEffect, useRef } from "react";

const PIPELINE_ENVIRONMENTS = ["Production", "Staging", "Development"];

const INITIAL_PIPELINE_STAGES = [
  {
    id: "source",
    name: "1. Source Control",
    category: "Source",
    status: "succeeded", // succeeded, running, failed, pending, waiting_approval
    duration: "42s",
    startTime: "14:02:10 UTC",
    provider: "GitHub Enterprise",
    meta: {
      commit: "a8f3d91",
      branch: "main",
      author: "alex.dev@enterprise.io",
      message: "feat(auth): migrate JWT validation to OAuth2 OIDC provider"
    },
    jobs: [
      { name: "Checkout Code", status: "succeeded", duration: "12s" },
      { name: "Fetch Git LFS & Tags", status: "succeeded", duration: "18s" },
      { name: "Verify Commit Signature", status: "succeeded", duration: "12s" }
    ],
    artifacts: [
      { name: "source-archive.tar.gz", size: "14.2 MB" }
    ],
    logs: [
      "[INFO] Initializing Git checkout context...",
      "[INFO] Fetching origin refs for commit hash a8f3d91c10...",
      "[INFO] Checking out branch refs/heads/main",
      "[INFO] Verifying GPG commit signature: VALID (KeyID: 0x9B1A2F)",
      "[SUCCESS] Git repository synchronized in 42s"
    ]
  },
  {
    id: "security",
    name: "2. Security & SAST",
    category: "Quality Gate",
    status: "succeeded",
    duration: "1m 18s",
    startTime: "14:02:53 UTC",
    provider: "SonarQube & Trivy",
    meta: {
      vulnerabilities: "0 Critical, 0 High, 2 Low",
      coverage: "88.4%",
      licenseCheck: "Passed"
    },
    jobs: [
      { name: "SAST Vulnerability Scan", status: "succeeded", duration: "34s" },
      { name: "Secret Detection (Gitleaks)", status: "succeeded", duration: "14s" },
      { name: "Dependency Vulnerability Check", status: "succeeded", duration: "30s" }
    ],
    artifacts: [
      { name: "security-audit-report.json", size: "2.4 MB" },
      { name: "sast-sarif.json", size: "840 KB" }
    ],
    logs: [
      "[SECURITY] Starting Static Application Security Testing (SAST)...",
      "[SECURITY] Scanning 412 source files across 8 modules...",
      "[GITLEAKS] No plaintext API keys or high-entropy secrets found in commit diff.",
      "[DEPENDENCY] Checking package-lock.json against CVE database v2026.04...",
      "[AUDIT] Code coverage baseline threshold met: 88.4% >= 80.0%",
      "[SUCCESS] Security and compliance gate passed successfully."
    ]
  },
  {
    id: "build",
    name: "3. Container Build",
    category: "Build & Test",
    status: "succeeded",
    duration: "3m 04s",
    startTime: "14:04:12 UTC",
    provider: "Docker / AWS ECR",
    meta: {
      imageTag: "v2.8.4-build.912",
      digest: "sha256:e89f4a...7c",
      layers: "12 cached / 3 updated"
    },
    jobs: [
      { name: "Compile & Transpile TS/React", status: "succeeded", duration: "52s" },
      { name: "Execute Unit & Integration Tests", status: "succeeded", duration: "1m 12s" },
      { name: "Build OCI Docker Container", status: "succeeded", duration: "40s" },
      { name: "Push Image to Container Registry", status: "succeeded", duration: "20s" }
    ],
    artifacts: [
      { name: "docker-image-manifest.json", size: "12 KB" },
      { name: "test-results-junit.xml", size: "1.1 MB" }
    ],
    logs: [
      "[BUILD] Running webpack --config webpack.prod.js...",
      "[TEST] Executing 148 Jest unit tests across 12 suites...",
      " PASS  src/auth/jwt.test.ts (4.2s)",
      " PASS  src/api/client.test.ts (2.8s)",
      " PASS  src/components/Pipeline.test.ts (6.1s)",
      "[DOCKER] Building container image registry.internal/app:v2.8.4-build.912...",
      "[DOCKER] Pushing image layers to AWS ECR us-east-1...",
      "[SUCCESS] Build stage completed without errors."
    ]
  },
  {
    id: "staging",
    name: "4. Staging Validation",
    category: "Deployment",
    status: "succeeded",
    duration: "2m 10s",
    startTime: "14:07:18 UTC",
    provider: "Kubernetes / Helm",
    meta: {
      cluster: "k8s-staging-us-east",
      namespace: "staging-app-v2",
      replicas: "3/3 Ready"
    },
    jobs: [
      { name: "Helm Upgrade Staging Release", status: "succeeded", duration: "45s" },
      { name: "Pod Readiness & Liveness Checks", status: "succeeded", duration: "40s" },
      { name: "E2E Smoke Suite (Playwright)", status: "succeeded", duration: "45s" }
    ],
    artifacts: [
      { name: "helm-release-summary.yaml", size: "8 KB" },
      { name: "playwright-trace-report.zip", size: "18.5 MB" }
    ],
    logs: [
      "[KUBERNETES] Connecting to cluster k8s-staging-us-east...",
      "[HELM] Upgrading release 'staging-core' with values-staging.yaml...",
      "[KUBERNETES] Deployment rollout status: 3 of 3 updated replicas are available.",
      "[E2E] Triggering automated smoke testing against https://staging.internal.app...",
      "[E2E] 24/24 synthetic API endpoints returned HTTP 200 OK.",
      "[SUCCESS] Staging validation complete and cluster status is healthy."
    ]
  },
  {
    id: "approval",
    name: "5. Production Gate",
    category: "Manual Gate",
    status: "waiting_approval", // Active gate awaiting approval
    duration: "Awaiting approval",
    startTime: "14:09:29 UTC",
    provider: "Azure IAM Gate",
    meta: {
      approversRequired: "1 of 2",
      requestedBy: "CI/CD Automation Pipeline",
      targetEnv: "Production Cluster (AWS EKS us-west-2)"
    },
    jobs: [
      { name: "Verify Policy Authorization", status: "succeeded", duration: "02s" },
      { name: "Manual Security & Tech Lead Approval", status: "pending", duration: "In Progress" }
    ],
    artifacts: [
      { name: "deployment-approval-token.sig", size: "4 KB" }
    ],
    logs: [
      "[POLICY] Evaluating Deployment Authorization Rules...",
      "[POLICY] Environment 'Production' requires manual sign-off from Release Lead.",
      "[WAITING] Manual Approval requested at 14:09:29 UTC.",
      "[WAITING] Notification dispatched to #release-approvals Slack channel & PagerDuty.",
      "[INFO] Awaiting interactive operator click on 'Approve Deployment' button..."
    ]
  },
  {
    id: "production",
    name: "6. Prod Canary Deploy",
    category: "Production",
    status: "pending",
    duration: "--",
    startTime: "--",
    provider: "ArgoCD / AWS EKS",
    meta: {
      strategy: "Canary (10% -> 50% -> 100%)",
      targetCluster: "eks-prod-us-west-2",
      rollbackPolicy: "Auto on HTTP 5xx spikes"
    },
    jobs: [
      { name: "ArgoCD Canary Rollout (10%)", status: "pending", duration: "--" },
      { name: "Prometheus Metric Anomaly Check", status: "pending", duration: "--" },
      { name: "Promote Canary to 100% Traffic", status: "pending", duration: "--" }
    ],
    artifacts: [],
    logs: [
      "[PENDING] Production deployment stage queued.",
      "[PENDING] Waiting for upstream stage [5. Production Gate] to complete successfully."
    ]
  }
];

export default function PipelineDashboard() {
  const [environment, setEnvironment] = useState("Production");
  const [pipelineStages, setPipelineStages] = useState(INITIAL_PIPELINE_STAGES);
  const [selectedStageId, setSelectedStageId] = useState("approval");
  const [isPipelineRunning, setIsPipelineRunning] = useState(false);
  const [executionId, setExecutionId] = useState("exec-20261011-08942");
  const [activeTab, setActiveTab] = useState("logs"); // 'logs', 'jobs', 'artifacts'
  const [logFilter, setLogFilter] = useState("");
  const [isPaused, setIsPaused] = useState(false);

  // Auto-scroll logs box when content changes
  const logTerminalRef = useRef(null);

  useEffect(() => {
    if (logTerminalRef.current) {
      logTerminalRef.current.scrollTop = logTerminalRef.current.scrollHeight;
    }
  }, [selectedStageId, pipelineStages, activeTab, logFilter]);

  const selectedStage = pipelineStages.find((s) => s.id === selectedStageId) || pipelineStages[0];

  const handleTriggerPipeline = () => {
    setIsPipelineRunning(true);
    const newExecId = `exec-20261011-${Math.floor(10000 + Math.random() * 90000)}`;
    setExecutionId(newExecId);

    // Reset pipeline state to running
    const resetStages = pipelineStages.map((stage, idx) => {
      if (idx === 0) {
        return {
          ...stage,
          status: "running",
          startTime: "Just now",
          duration: "In Progress",
          logs: [...stage.logs, `\n[${new Date().toISOString()}] Manual trigger requested for execution ${newExecId}`]
        };
      }
      return {
        ...stage,
        status: "pending",
        startTime: "--",
        duration: "--"
      };
    });

    setPipelineStages(resetStages);
    setSelectedStageId("source");

    // Simulate pipeline progression
    setTimeout(() => {
      setPipelineStages((prev) =>
        prev.map((s, idx) => (idx === 0 ? { ...s, status: "succeeded", duration: "18s" } : idx === 1 ? { ...s, status: "running", duration: "In Progress" } : s))
      );
    }, 2000);

    setTimeout(() => {
      setPipelineStages((prev) =>
        prev.map((s, idx) => (idx === 1 ? { ...s, status: "succeeded", duration: "45s" } : idx === 2 ? { ...s, status: "running", duration: "In Progress" } : s))
      );
      setIsPipelineRunning(false);
    }, 4500);
  };

  const handleApproveGate = (approved) => {
    setPipelineStages((prev) =>
      prev.map((stage) => {
        if (stage.id === "approval") {
          return {
            ...stage,
            status: approved ? "succeeded" : "failed",
            duration: "Approved by Lead Ops",
            logs: [
              ...stage.logs,
              approved
                ? `[APPROVED] Operator clicked Approve deployment at ${new Date().toLocaleTimeString()} UTC.`
                : `[REJECTED] Deployment rejected by manual gate operator.`
            ]
          };
        }
        if (stage.id === "production" && approved) {
          return {
            ...stage,
            status: "running",
            duration: "In Progress",
            startTime: `${new Date().toLocaleTimeString()} UTC`,
            jobs: stage.jobs.map((j, i) => (i === 0 ? { ...j, status: "running", duration: "In Progress" } : j)),
            logs: [
              "[CANARY] Commencing Canary deployment strategy on AWS EKS...",
              "[ARGOCD] Syncing manifest release v2.8.4-build.912 to production cluster...",
              "[CANARY] Directing 10% ingress traffic to Canary pods...",
              "[HEALTH] Monitoring Prometheus 5xx error rates (threshold < 0.01%)..."
            ]
          };
        }
        return stage;
      })
    );
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case "succeeded":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <i className="fa-solid fa-circle-check text-emerald-600 text-[10px]"></i> Succeeded
          </span>
        );
      case "running":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <i className="fa-solid fa-circle-notch fa-spin text-blue-600 text-[10px]"></i> In Progress
          </span>
        );
      case "waiting_approval":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-300 animate-pulse">
            <i className="fa-solid fa-user-check text-amber-600 text-[10px]"></i> Approval Needed
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
            <i className="fa-solid fa-circle-xmark text-red-600 text-[10px]"></i> Failed
          </span>
        );
      case "pending":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
            <i className="fa-solid fa-clock text-gray-400 text-[10px]"></i> Queued
          </span>
        );
    }
  };

  const filteredLogs = selectedStage.logs.filter((log) =>
    log.toLowerCase().includes(logFilter.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 p-4 lg:p-6 font-sans text-xs">
      <div className="max-w-7xl mx-auto space-y-4">
        
        {/* Top Enterprise Console Navigation Bar */}
        <div className="bg-gray-900 text-gray-200 rounded-lg p-4 shadow-sm border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-blue-600 text-white font-mono px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide">
                CI/CD
              </span>
              <h1 className="text-sm font-bold text-white tracking-tight font-mono">
                production-deploy-pipeline
              </h1>
              <span className="bg-gray-800 text-gray-300 text-[10px] px-2 py-0.5 rounded border border-gray-700 font-mono">
                {executionId}
              </span>
            </div>
            <div className="flex items-center gap-4 text-gray-400 text-[11px]">
              <span className="flex items-center gap-1">
                <i className="fa-solid fa-code-branch text-gray-500"></i> Branch: <strong className="text-gray-200 font-mono">main</strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <i className="fa-solid fa-bolt text-gray-500"></i> Trigger: <span className="text-gray-300">GitHub Webhook (Push)</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <i className="fa-regular fa-user text-gray-500"></i> Initiator: <span className="text-gray-300">alex.dev</span>
              </span>
            </div>
          </div>

          {/* Top Actions & Environment Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Environment Switcher */}
            <div className="flex items-center bg-gray-800 border border-gray-700 rounded p-0.5">
              {PIPELINE_ENVIRONMENTS.map((env) => (
                <button
                  key={env}
                  onClick={() => setEnvironment(env)}
                  className={`px-2.5 py-1 text-[11px] rounded font-medium transition-colors ${
                    environment === env
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  {env}
                </button>
              ))}
            </div>

            {/* Pause Trigger Toggle */}
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`px-3 py-1.5 rounded text-[11px] font-medium border flex items-center gap-1.5 transition-colors ${
                isPaused
                  ? "bg-amber-950/60 text-amber-300 border-amber-800 hover:bg-amber-900/60"
                  : "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-750"
              }`}
            >
              <i className={`fa-solid ${isPaused ? "fa-play text-amber-400" : "fa-pause text-gray-400"} text-[10px]`}></i>
              {isPaused ? "Resume Pipeline" : "Pause Triggers"}
            </button>

            {/* Run Pipeline Button */}
            <button
              onClick={handleTriggerPipeline}
              disabled={isPipelineRunning}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 text-white font-semibold rounded text-[11px] border border-emerald-500 flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <i className={`fa-solid ${isPipelineRunning ? "fa-circle-notch fa-spin" : "fa-play"} text-[10px]`}></i>
              {isPipelineRunning ? "Executing..." : "Run Pipeline"}
            </button>
          </div>
        </div>

        {}
        <div className="bg-white rounded-lg border border-gray-300 shadow-2xs p-5">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-diagram-project text-gray-500"></i>
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Pipeline Execution Flow Map
              </h2>
            </div>
            <div className="text-[11px] text-gray-500 font-mono">
              Total Duration: <span className="font-semibold text-gray-800">7m 14s</span>
            </div>
          </div>

          {/* Sequential Stage Cards Horizontal Scroll / Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 relative">
            {pipelineStages.map((stage, index) => {
              const isSelected = stage.id === selectedStageId;
              return (
                <div key={stage.id} className="relative flex flex-col">
                  {/* Pipeline Stage Card */}
                  <div
                    onClick={() => setSelectedStageId(stage.id)}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all h-full flex flex-col justify-between ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/40 ring-1 ring-blue-600 shadow-2xs"
                        : stage.status === "waiting_approval"
                        ? "border-amber-400 bg-amber-50/30 hover:border-amber-500"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div>
                      {/* Top Bar: Category & Status */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono uppercase text-gray-400 tracking-tight">
                          {stage.category}
                        </span>
                        {renderStatusBadge(stage.status)}
                      </div>

                      {/* Stage Name */}
                      <h3 className="font-semibold text-xs text-gray-900 mb-1 leading-tight">
                        {stage.name}
                      </h3>

                      {/* Provider info */}
                      <p className="text-[11px] text-gray-500 truncate mb-2">
                        <i className="fa-regular fa-square-check text-gray-400 mr-1 text-[10px]"></i>
                        {stage.provider}
                      </p>
                    </div>

                    {/* Card Footer Metrics */}
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400 font-mono">
                      <span>{stage.duration}</span>
                      <span>{stage.jobs.filter((j) => j.status === "succeeded").length}/{stage.jobs.length} jobs</span>
                    </div>
                  </div>

                  {/* Stage Arrow Connector for larger screens */}
                  {index < pipelineStages.length - 1 && (
                    <div className="hidden lg:block absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-gray-300">
                      <i className="fa-solid fa-chevron-right text-xs"></i>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Interactive Manual Gate Banner (If selected or pending approval) */}
          {selectedStage.status === "waiting_approval" && (
            <div className="mt-4 p-3.5 bg-amber-50 border border-amber-300 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900">
              <div className="flex items-start gap-2.5">
                <i className="fa-solid fa-triangle-exclamation text-amber-600 text-sm mt-0.5"></i>
                <div>
                  <h4 className="text-xs font-bold text-amber-950">
                    Production Approval Gate Required
                  </h4>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Release requires manual sign-off prior to triggering ArgoCD canary rollout to <strong className="font-mono">eks-prod-us-west-2</strong>.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => handleApproveGate(false)}
                  className="px-3 py-1.5 bg-white hover:bg-gray-50 text-red-700 border border-red-300 font-medium rounded text-xs transition-colors"
                >
                  Reject Rollout
                </button>
                <button
                  onClick={() => handleApproveGate(true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded text-xs shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-check text-[10px]"></i> Approve & Deploy
                </button>
              </div>
            </div>
          )}
        </div>

        {}
        <div className="bg-white rounded-lg border border-gray-300 shadow-2xs overflow-hidden">
          
          {/* Detail Tab Navigation Header */}
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-900">
                Stage Details: <span className="text-blue-700">{selectedStage.name}</span>
              </span>
              {renderStatusBadge(selectedStage.status)}
            </div>

            {/* Tab Buttons */}
            <div className="flex items-center gap-1 bg-gray-200/70 p-0.5 rounded border border-gray-300 self-start sm:self-auto">
              <button
                onClick={() => setActiveTab("logs")}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  activeTab === "logs" ? "bg-white text-gray-900 shadow-2xs" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <i className="fa-solid fa-terminal mr-1 text-[10px]"></i> Console Logs
              </button>
              <button
                onClick={() => setActiveTab("jobs")}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  activeTab === "jobs" ? "bg-white text-gray-900 shadow-2xs" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <i className="fa-solid fa-list-check mr-1 text-[10px]"></i> Jobs ({selectedStage.jobs.length})
              </button>
              <button
                onClick={() => setActiveTab("artifacts")}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  activeTab === "artifacts" ? "bg-white text-gray-900 shadow-2xs" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <i className="fa-solid fa-box-archive mr-1 text-[10px]"></i> Artifacts ({selectedStage.artifacts.length})
              </button>
            </div>
          </div>

          {/* Tab Content Box */}
          <div className="p-4">
            
            {/* LOGS TAB */}
            {activeTab === "logs" && (
              <div className="space-y-3">
                {/* Search / Filter Logs */}
                <div className="flex items-center justify-between gap-3">
                  <div className="relative w-full max-w-xs">
                    <i className="fa-solid fa-magnifying-glass absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]"></i>
                    <input
                      type="text"
                      placeholder="Filter console log lines..."
                      value={logFilter}
                      onChange={(e) => setLogFilter(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    />
                  </div>
                  <div className="text-[11px] text-gray-500 font-mono">
                    Showing {filteredLogs.length} lines
                  </div>
                </div>

                {/* Dark Terminal Window */}
                <div
                  ref={logTerminalRef}
                  className="bg-slate-950 text-slate-200 font-mono text-[11px] p-4 rounded-md h-64 overflow-y-auto leading-relaxed border border-slate-800 select-text"
                >
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((line, i) => (
                      <div key={i} className="hover:bg-slate-900/80 px-1 rounded flex items-start gap-2">
                        <span className="text-slate-600 select-none w-8 text-right font-mono text-[10px]">
                          {i + 1}
                        </span>
                        <span
                          className={
                            line.includes("[SUCCESS]")
                              ? "text-emerald-400 font-medium"
                              : line.includes("[SECURITY]") || line.includes("[POLICY]")
                              ? "text-cyan-300"
                              : line.includes("[WAITING]") || line.includes("[PENDING]")
                              ? "text-amber-300"
                              : line.includes("[APPROVED]")
                              ? "text-emerald-300 font-bold"
                              : "text-slate-300"
                          }
                        >
                          {line}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500 italic py-4 text-center">
                      No logs matching filter criteria "{logFilter}"
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* JOBS TAB */}
            {activeTab === "jobs" && (
              <div className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedStage.jobs.map((job, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded border border-gray-200 bg-gray-50/50 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <i className={`fa-solid ${job.status === "succeeded" ? "fa-circle-check text-emerald-600" : job.status === "running" ? "fa-circle-notch fa-spin text-blue-600" : "fa-clock text-gray-400"} text-sm`}></i>
                        <div>
                          <h4 className="text-xs font-semibold text-gray-800">{job.name}</h4>
                          <span className="text-[10px] text-gray-500 font-mono">Duration: {job.duration}</span>
                        </div>
                      </div>
                      {renderStatusBadge(job.status)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ARTIFACTS TAB */}
            {activeTab === "artifacts" && (
              <div>
                {selectedStage.artifacts.length > 0 ? (
                  <div className="divide-y divide-gray-200 border border-gray-200 rounded">
                    {selectedStage.artifacts.map((art, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <i className="fa-regular fa-file-code text-gray-500 text-sm"></i>
                          <div>
                            <span className="text-xs font-mono font-medium text-gray-800">{art.name}</span>
                            <span className="text-[10px] text-gray-400 block font-mono">Size: {art.size}</span>
                          </div>
                        </div>
                        <button className="px-2.5 py-1 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors flex items-center gap-1 font-medium">
                          <i className="fa-solid fa-download text-[10px]"></i> Download
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-400">
                    <i className="fa-solid fa-box-open text-2xl mb-2 text-gray-300"></i>
                    <p className="text-xs font-medium">No build artifacts generated for this stage.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Metadata Bar */}
          <div className="bg-gray-50 border-t border-gray-200 px-4 py-2 text-[11px] text-gray-500 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span>Provider: <strong className="text-gray-700 font-mono">{selectedStage.provider}</strong></span>
              <span>•</span>
              <span>Start Time: <span className="text-gray-700 font-mono">{selectedStage.startTime}</span></span>
            </div>
            <div className="text-gray-400">
              AWS CodePipeline Agent v2.14.0 • Region: us-east-1
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}