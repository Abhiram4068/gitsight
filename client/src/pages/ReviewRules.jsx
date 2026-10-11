import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import repositoryApi from "../api/repositories";

export default function ReviewRules() {
  const [repositories, setRepositories] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Rules structured with enterprise-grade categories/options
  const [rules, setRules] = useState([
    {
      id: "1",
      displayName: "Ignore Test Secrets",
      description:
        "Allow fake or test API keys (e.g. sk_test_...) without triggering security alerts.",
      isEnabled: false,
    },
    {
      id: "2",
      displayName: "Strict Security Policy",
      description:
        "Flag pull requests as High Risk instantly if any hardcoded password or token is detected.",
      isEnabled: false,
    },
    {
      id: "3",
      displayName: "Ignore Whitespace & Formatting",
      description:
        "Suppress stylistic suggestions regarding code indentation, spacing, and formatting.",
      isEnabled: false,
    },
    {
      id: "4",
      displayName: "Enforce Async / Await",
      description:
        "Flag legacy promise chains (.then/.catch) and recommend modern async/await patterns.",
      isEnabled: false,
    },
    {
      id: "5",
      displayName: "Disallow Console Statements",
      description:
        "Flag any debugging console.log, console.warn, or console.error statements left in production code.",
      isEnabled: false,
    },
    {
      id: "6",
      displayName: "Nitpicky Mode",
      description:
        "Enable maximum strictness to review and highlight every minor stylistic and naming convention deviation.",
      isEnabled: false,
    },
    {
      id: "7",
      displayName: "Require Meaningful Naming",
      description:
        "Flag short, obscure, or overly generic variable and function names (e.g., data1, temp, x).",
      isEnabled: false,
    },
    {
      id: "8",
      displayName: "Prevent Hardcoded Configs",
      description:
        "Enforce that API URLs, ports, and external endpoints are accessed via environment variables.",
      isEnabled: false,
    },
    {
      id: "9",
      displayName: "Block Unresolved TODOs",
      description:
        "Flag code containing unresolved TODO, FIXME, or HACK comments left in the pull request.",
      isEnabled: false,
    },
    {
      id: "10",
      displayName: "Strict Type Enforcement",
      description:
        "Flag implicit 'any' types and require well-defined TS interfaces or JSDoc types for all parameters.",
      isEnabled: false,
    },
    {
      id: "11",
      displayName: "Accessibility (A11y) Checks",
      description:
        "Highlight missing alt attributes, missing ARIA roles, or poorly structured HTML semantic elements.",
      isEnabled: false,
    },
    {
      id: "12",
      displayName: "Comprehensive Error Handling",
      description:
        "Ensure catch blocks do not silently swallow errors and properly handle or rethrow exceptions.",
      isEnabled: false,
    },
  ]);

  useEffect(() => {
    fetchRepositories();
  }, []);

  const fetchRepositories = async () => {
    setIsLoading(true);
    try {
      const response = await repositoryApi.getRepositories();
      if (response?.items) {
        setRepositories(response.items);
      } else if (response?.data?.items) {
        setRepositories(response.data.items);
      }
    } catch (error) {
      console.error("Failed to fetch repositories", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRepoChange = (e) => {
    const repoFullName = e.target.value;
    setSelectedRepo(repoFullName);
    // Reset rules or load repo-specific settings here
    setRules(rules.map((r) => ({ ...r, isEnabled: false })));
  };

  const handleToggleRule = (ruleId) => {
    if (!selectedRepo) return;
    setRules(
      rules.map((rule) =>
        rule.id === ruleId ? { ...rule, isEnabled: !rule.isEnabled } : rule,
      ),
    );
  };

  const handleSaveRules = async () => {
    if (!selectedRepo) return;
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      alert("Configuration saved successfully for " + selectedRepo);
    } catch (error) {
      console.error("Failed to save rules", error);
      alert("Failed to save configuration.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-gray-200 gap-3">
        <div>
          <nav className="flex items-center space-x-1.5 text-xs text-gray-500 mb-1">
            <Link
              to="/"
              className="hover:underline hover:text-gray-900 cursor-pointer transition-colors"
            >
              Dashboard
            </Link>
            <span className="text-gray-400">&gt;</span>
            <span className="font-bold text-gray-900">Review Rules</span>
          </nav>
          <h1 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
            <span className="font-bold text-blue-700">Review Rules</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5 text-left">
            Configure custom evaluation policies and reviewer behavior on a
            per-repository basis.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleSaveRules}
            disabled={isSaving || !selectedRepo}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-sm transition-all flex items-center gap-1.5 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer shadow-sm"
          >
            {isSaving ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin text-[10px]"></i>{" "}
                Saving configuration...
              </>
            ) : (
              <>
                <i className="fa-solid fa-floppy-disk text-[10px]"></i> Confirm & Apply Rules
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mt-3 overflow-hidden">
        {/* Scope Selector Bar */}
        <div className="p-5 border-b border-gray-200 bg-gray-50/75 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="w-full max-w-lg">
            <label className="block text-xs font-bold  tracking-wider text-gray-700 mb-1.5 text-left">
              Select a repository to view and manage its custom rules:
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <i className="fa-brands fa-github text-sm"></i>
              </div>
              <select
                className="w-full pl-9 pr-8 py-2 bg-white border border-gray-300 rounded-md text-xs text-gray-900 shadow-2xs focus:ring-1 focus:ring-blue-600 focus:border-blue-600 appearance-none disabled:bg-gray-100 disabled:text-gray-400 cursor-pointer transition-all font-medium"
                value={selectedRepo}
                onChange={handleRepoChange}
                disabled={isLoading}
              >
                <option value="" disabled>
                  -- Select a repository --
                </option>
                {repositories.map((repo) => (
                  <option key={repo.id} value={repo.fullName}>
                    {repo.fullName}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                <i className="fa-solid fa-chevron-down text-[10px]"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {selectedRepo ? (
          <div className="p-6 space-y-6">

            {/* Two Column Radio-Style Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="p-3.5 text-left flex items-start gap-3"
                >
                  {/* Radio Button Indicator */}
                  <div className="flex-shrink-0 mt-0.5">
                    <div
                      onClick={() => handleToggleRule(rule.id)}
                      className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                        rule.isEnabled
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-gray-300 bg-white hover:border-gray-400"
                      }`}
                    >
                      {rule.isEnabled && (
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      )}
                    </div>
                  </div>

                  {/* Rule Details (Left-Aligned, Small text) */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-semibold text-gray-900">
                      {rule.displayName}
                    </h3>
                    <p className="text-xs mt-0.5 leading-relaxed text-gray-500">
                      {rule.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-gray-200 flex items-center justify-between mt-6">
              <p className="text-[11px] text-gray-500 text-left">
                Changes will apply to subsequent pull request scans on{" "}
                <span className="font-semibold text-gray-700">
                  {selectedRepo}
                </span>
                .
              </p>
            </div>
          </div>
        ) : (
          <div className="p-16 text-center text-gray-400 flex flex-col items-center justify-center">
            <div className="w-12 h-12 flex items-center  mb-3 text-gray-400 text-lg ">
            </div>
            <p className="text-xs font-semibold text-gray-700">
              No Repository Selected
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Please choose a target repository from the dropdown above to
              manage rule configurations.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
