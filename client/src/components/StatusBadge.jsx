import React from 'react';

export default function StatusBadge({ state, mergedAt, isDraft }) {
  const normalizedState = state?.toLowerCase() || '';
  const isMerged = normalizedState === 'merged' || !!mergedAt;
  const isOpen = normalizedState === 'open' || normalizedState === 'opened';
  const isInProgress = normalizedState === 'inprogress' || normalizedState === 'in progress';
  const isResolved = normalizedState === 'resolved';

  return (
    <>
      {isMerged ? (
        <span className="w-[68px] py-0.5 text-[11px] font-semibold text-white bg-purple-600 rounded-full inline-flex items-center justify-center shadow-xs capitalize">
          Merged
        </span>
      ) : isResolved ? (
        <span className="w-[68px] py-0.5 text-[11px] font-semibold text-white bg-emerald-600 rounded-full inline-flex items-center justify-center shadow-xs capitalize">
          Resolved
        </span>
      ) : isInProgress ? (
        <span className="w-[78px] py-0.5 text-[11px] font-semibold text-white bg-blue-500 rounded-full inline-flex items-center justify-center shadow-xs capitalize">
          In Progress
        </span>
      ) : isOpen ? (
        <span className="w-[68px] py-0.5 text-[11px] font-semibold text-white bg-emerald-600 rounded-full inline-flex items-center justify-center shadow-xs capitalize">
          Open
        </span>
      ) : (
        <span className="w-[68px] py-0.5 text-[11px] font-semibold text-white bg-gray-500 rounded-full inline-flex items-center justify-center shadow-xs capitalize">
          {normalizedState === 'dismissed' ? 'Dismissed' : 'Closed'}
        </span>
      )}

      {isDraft && (
        <span className="w-[68px] py-0.5 text-[10px] font-semibold text-white bg-slate-400 rounded-full inline-flex items-center justify-center shadow-xs capitalize">
          Draft
        </span>
      )}
    </>
  );
}
