import React, { lazy } from 'react';

// Lazy load heavy components
const LazyDashboard = lazy(() => import('./AppboardView'));
const LazySettings = lazy(() => import('./SettingsView'));
const LazyContentLibrary = lazy(() => import('./ContentLibraryView'));
const LazySiteDetail = lazy(() => import('./SiteDetailView'));
const LazyNewContent = lazy(() => import('./NewContentView'));
const LazyCalendar = lazy(() => import('./CalendarView'));
const LazyUserManagement = lazy(() => import('./admin/UserManagement'));
const LazySubscriptionPlans = lazy(() => import('./SubscriptionPlans'));

// Export lazy loaded components
export {
  LazyDashboard,
  LazySettings,
  LazyContentLibrary,
  LazySiteDetail,
  LazyNewContent,
  LazyCalendar,
  LazyUserManagement,
  LazySubscriptionPlans
};