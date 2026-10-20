import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import repositoryApi from "../api/repositories";
import rulesApi from "../api/rules";

export default function ReviewRules() {
  const [repositories, setRepositories] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRules, setIsLoadingRules] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [rules, setRules] = useState([]);
  const [savedRuleIds, setSavedRuleIds] = useState([]);

  useEffect(() => {
    fetchRepositories();
  }, []);

  const fetchRepositories = async () => {
    setIsLoading(true);
    try {
      const response = await repositoryApi.getRepositories({ pageSize: 100 });
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

  const handleRepoChange = async (e) => {
    const repoFullName = e.target.value;
    setSelectedRepo(repoFullName);
    setSaveSuccess(false);
    setErrorMessage("");

    if (!repoFullName) {
      setRules([]);
      setSavedRuleIds([]);
      return;
    }

    setIsLoadingRules(true);
    try {
      const config = await rulesApi.getRepoRuleConfig(repoFullName);
      if (config && config.rules) {
        const selectedList = config.selectedRuleIds || [];
        const selectedSet = new Set(selectedList);
        setSavedRuleIds(selectedList);
        const mapped = config.rules.map((rule) => ({
          ...rule,
          isEnabled: selectedSet.has(rule.id),
        }));
        setRules(mapped);
      } else {
        // Fallback: fetch all rules directly if config was empty
        const allRules = await rulesApi.getAllRules();
        setSavedRuleIds([]);
        setRules(
          (allRules || []).map((rule) => ({
            ...rule,
            isEnabled: false,
          }))
        );
      }
    } catch (error) {
      console.error("Failed to fetch repo rule config", error);
      setErrorMessage("Could not load rules for this repository. Please make sure database migrations are applied.");
    } finally {
      setIsLoadingRules(false);
    }
  };

  const handleToggleRule = (ruleId) => {
    if (!selectedRepo) return;
    setRules((prev) =>
      prev.map((rule) =>
        rule.id === ruleId ? { ...rule, isEnabled: !rule.isEnabled } : rule
      )
    );
    setSaveSuccess(false);
  };

  const handleSaveRules = async () => {
    if (!selectedRepo) return;
    const enabledRuleIds = rules.filter((r) => r.isEnabled).map((r) => r.id);

    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMessage("");

    try {
      const selectedRepoObj = repositories.find((r) => r.fullName === selectedRepo);

      await rulesApi.applyRules({
        repositoryId: selectedRepoObj?.id || null,
        repositoryFullName: selectedRepo,
        ruleIds: enabledRuleIds,
      });

      setSavedRuleIds(enabledRuleIds);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (error) {
      console.error("Failed to save rules", error);
      setErrorMessage(
        error.response?.data?.message || "Failed to save configuration. Please try again."
      );
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
              Home
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
      </div>

      {/* Banner Alerts */}
      {saveSuccess && (
        <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 text-xs flex items-center gap-2">
          <i className="fa-solid fa-circle-check text-emerald-600"></i>
          <span>
            {savedRuleIds.length > 0 ? (
              <>Rules successfully applied to <strong>{selectedRepo}</strong>! They will be strictly enforced during subsequent PR reviews.</>
            ) : (
              <>All custom rules have been removed from <strong>{selectedRepo}</strong>. Reviews will proceed with standard guidelines.</>
            )}
          </span>
        </div>
      )}

      {errorMessage && (
        <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-md text-rose-800 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-triangle-exclamation text-rose-600"></i>
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage("")} className="text-rose-500 hover:text-rose-700">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}

      <div className="mt-3 overflow-hidden">
        {/* Scope Selector Bar */}
        <div className="p-5 border-b border-gray-200 bg-gray-50/75 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="w-full max-w-lg">
            <label className="block text-xs font-bold tracking-wider text-gray-700 mb-1.5 text-left">
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
          isLoadingRules ? (
            <div className="p-16 text-center text-gray-500 flex flex-col items-center justify-center">
              <i className="fa-solid fa-circle-notch fa-spin text-2xl text-blue-600 mb-2"></i>
              <p className="text-xs font-medium">Loading rules for {selectedRepo}...</p>
            </div>
          ) : rules.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <i className="fa-solid fa-list-check text-2xl text-gray-400 mb-2"></i>
              <p className="text-xs font-semibold text-gray-800">No Rules Found.</p>
              <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
The system cant find any rules at the moment.
              </p>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Two Column Radio-Style Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    onClick={() => handleToggleRule(rule.id)}
                    className={`p-3.5 text-left flex items-start gap-3  transition-all cursor-pointer select-none ${
                      rule.isEnabled
                        ? ""
                        : ""
                    }`}
                  >
                    {/* Radio Button Indicator */}
                    <div className="flex-shrink-0 mt-0.5">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                          rule.isEnabled
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        {rule.isEnabled && (
                          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                        )}
                      </div>
                    </div>

                    {/* Rule Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-xs font-semibold ${rule.isEnabled ? "text-blue-900" : "text-gray-900"}`}>
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
                <button
                  onClick={handleSaveRules}
                  disabled={isSaving || !selectedRepo || (!rules.some((r) => r.isEnabled) && savedRuleIds.length === 0)}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-sm transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-blue-600 cursor-pointer shadow-sm"
                >
                  {isSaving ? (
                    <>
                      <i className="fa-solid fa-circle-notch fa-spin text-[10px]"></i> Saving...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-floppy-disk text-[10px]"></i> Confirm & Apply Rules
                    </>
                  )}
                </button>
              </div>
            </div>
          )
        ) : (
          <div className="p-16 text-center text-gray-400 flex flex-col items-center justify-center">
            <p className="text-xs font-semibold text-gray-700">
              No Repository Selected
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Please choose a target repository from the dropdown above to manage rule configurations.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
