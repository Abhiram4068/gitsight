import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import AiInsightsLayout from '../layouts/AiInsightsLayout';

// Lazy-loaded pages
const Dashboard = lazy(() => import('../pages/dashboard'));
const Repositories = lazy(() => import('../pages/repositories'));
const Login = lazy(() => import('../pages/login'));
const PullRequests = lazy(() => import('../pages/pull-requests'));
const PrDetail = lazy(() => import('../pages/pr-detail'));
const PrAiInsights = lazy(() => import('../pages/PrAiInsights'));
const Webhooks = lazy(() => import('../pages/Webhooks'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px] text-gray-500 text-sm space-x-2">
    <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin"></div>
    <span>Loading GitSight...</span>
  </div>
);

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Main Application Routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/repositories" element={<Repositories />} />
          <Route path="/pull-requests" element={<PullRequests />} />
          <Route path="/webhooks" element={<Webhooks />} />
        </Route>

        {/* AI Insights Routes */}
        <Route element={<AiInsightsLayout />}>
          <Route path="/pr-ai-insights" element={<PrAiInsights />} />
        </Route>

        {/* Standalone routes */}
        <Route path="/pr-detail" element={<PrDetail />} />
        <Route path="/login" element={<Login />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
