import React from 'react';

export default function StatusBadge({ state, mergedAt, isDraft }) {
  const isMerged = state?.toLowerCase() === 'merged' || !!mergedAt;
  const isOpen = state?.toLowerCase() === 'open';

  return (
    <>
      {isMerged ? (
        <span className="w-[68px] py-0.5 text-[11px] font-semibold text-white bg-purple-600 rounded-full inline-flex items-center justify-center shadow-xs capitalize">
          Merged
        </span>
      ) : isOpen ? (
        <span className="w-[68px] py-0.5 text-[11px] font-semibold text-white bg-emerald-600 rounded-full inline-flex items-center justify-center shadow-xs capitalize">
          Open
        </span>
      ) : (
        <span className="w-[68px] py-0.5 text-[11px] font-semibold text-white bg-gray-500 rounded-full inline-flex items-center justify-center shadow-xs capitalize">
          Closed
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
