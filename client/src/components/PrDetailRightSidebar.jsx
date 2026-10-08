import React from "react";

export default function PrDetailRightSidebar({ files, setFiles }) {
  return (
    <aside className="w-96 border-l border-gray-200 bg-gray-200 p-4 space-y-4 overflow-hidden flex flex-col shrink-0">
      {/* Files Changed List */}
      <div className="border border-gray-200 rounded-md bg-white shadow-sm flex flex-col flex-1 overflow-hidden min-h-0">
        <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 rounded-t-md font-bold text-xs text-gray-700 shrink-0">
          Files Changed ({files.length})
        </div>
        <div className="flex flex-col divide-y divide-gray-100 flex-1 overflow-y-auto min-h-0">
          {files.map((file) => (
            <button
              key={file.id}
              onClick={() => {
                // Ensure the file is expanded
                if (!file.isExpanded) {
                  setFiles((prev) =>
                    prev.map((f) =>
                      f.id === file.id ? { ...f, isExpanded: true } : f,
                    ),
                  );
                }
                // Smooth scroll to the element
                setTimeout(() => {
                  document
                    .getElementById(`diff-file-${file.id}`)
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 50);
              }}
              className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 text-left text-xs group cursor-pointer transition-colors"
            >
              <span className=" text-gray-700 truncate mr-2 group-hover:text-blue-600">
                {file.name}
              </span>
              <div className="flex items-center space-x-1.5 shrink-0 text-[10px]">
                <span className="text-green-600">+{file.additions || 0}</span>
                <span className="text-red-600">-{file.deletions || 0}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
