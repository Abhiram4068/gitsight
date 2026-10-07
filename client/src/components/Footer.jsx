import React from 'react';

export default function Footer() {
  return (
    <footer className="h-8 border-t border-gray-200 bg-gray-50 flex items-center justify-between px-6 text-xs text-gray-500 shrink-0">
      <div>
        <a href="https://docs.github.com/en/rest" target="_blank" rel="noreferrer" className="hover:underline text-blue-600">
          GitHub GraphQL & REST API
        </a>
      </div>
      <div>
        <span>GitSight Review Agent Engine v1.0.0</span>
      </div>
    </footer>
  );
}
