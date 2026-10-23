import React, { useState, useEffect, lazy, Suspense } from 'react';
import { fetchAppSetting, saveAppSetting } from './db/queries.js';

// Route-level code splitting with React.lazy
const ReplenishmentPage = lazy(() => import('./features/replenishment/ReplenishmentPage.jsx'));
const ManifestsPage = lazy(() => import('./features/manifests/ManifestsPage.jsx'));
const SuppliersPage = lazy(() => import('./features/suppliers/SuppliersPage.jsx'));

// Accessible, lightweight loading fallback
function PageFallback() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        background: 'var(--app-background, #f8fafc)',
        color: 'var(--text, #0f172a)',
        flexDirection: 'column',
        gap: 12,
        fontFamily: "'Inter', sans-serif",
      }}
      role="status"
      aria-live="polite"
    >
      <div
        style={{
          width: 36,
          height: 36,
          border: '3px solid var(--border, #e2e8f0)',
          borderTopColor: 'var(--brand, #2563eb)',
          borderRadius: '50%',
          animation: 'spin 0.75s linear infinite',
        }}
        aria-hidden="true"
      />
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2, #475569)' }}>
        Loading StockDesk workspace...
      </span>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function App() {
  const [targetSupplierFilter, setTargetSupplierFilter] = useState(null);

  const [currentPage, setCurrentPage] = useState(() => {
    if (typeof window === 'undefined') return 'replenishment';
    const params = new URLSearchParams(window.location.search);
    if (params.get('page') === 'manifests' || window.location.pathname.startsWith('/manifests')) {
      return 'manifests';
    }
    if (params.get('page') === 'suppliers' || window.location.pathname.startsWith('/suppliers')) {
      return 'suppliers';
    }
    return 'replenishment';
  });

  const [themePreference, setThemePreference] = useState(() => {
    if (typeof window === 'undefined') return 'system';
    return localStorage.getItem('stockdesk_theme') || 'system';
  });

  // Apply theme to documentElement
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const resolveAndApply = (theme) => {
      let resolved = theme;
      if (theme === 'system') {
        resolved = mediaQuery.matches ? 'dark' : 'light';
      }
      root.setAttribute('data-theme', resolved);
    };

    resolveAndApply(themePreference);

    const handleMediaChange = () => {
      if (themePreference === 'system') {
        resolveAndApply('system');
      }
    };

    mediaQuery.addEventListener('change', handleMediaChange);
    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, [themePreference]);

  // Initial load from SQLite if not set in localStorage
  useEffect(() => {
    (async () => {
      try {
        const local = localStorage.getItem('stockdesk_theme');
        if (!local) {
          const dbTheme = await fetchAppSetting('theme_preference', null);
          if (dbTheme) {
            setThemePreference(dbTheme);
            localStorage.setItem('stockdesk_theme', dbTheme);
          }
        }
      } catch {
        // safe fallback
      }
    })();
  }, []);

  const handleThemeChange = async (newTheme) => {
    setThemePreference(newTheme);
    localStorage.setItem('stockdesk_theme', newTheme);
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const resolved = newTheme === 'system' ? (mediaQuery.matches ? 'dark' : 'light') : newTheme;
    root.setAttribute('data-theme', resolved);
    try {
      await saveAppSetting('theme_preference', newTheme);
    } catch {
      // safe fallback
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('page') === 'manifests' || window.location.pathname.startsWith('/manifests')) {
        setCurrentPage('manifests');
      } else if (params.get('page') === 'suppliers' || window.location.pathname.startsWith('/suppliers')) {
        setCurrentPage('suppliers');
      } else {
        setCurrentPage('replenishment');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (page, options = {}) => {
    setCurrentPage(page);
    if (options.supplier) {
      setTargetSupplierFilter(options.supplier);
    }
    let targetUrl = '/';
    if (page === 'manifests') targetUrl = '/manifests';
    else if (page === 'suppliers') targetUrl = '/suppliers';
    window.history.pushState({ page, ...options }, '', targetUrl);
  };

  return (
    <Suspense fallback={<PageFallback />}>
      {currentPage === 'manifests' && (
        <ManifestsPage
          themePreference={themePreference}
          onThemeChange={handleThemeChange}
          onNavigateBack={() => navigateTo('replenishment')}
          onNavigateTo={(page, opts) => navigateTo(page, opts)}
        />
      )}
      {currentPage === 'suppliers' && (
        <SuppliersPage
          themePreference={themePreference}
          onThemeChange={handleThemeChange}
          onNavigateBack={() => navigateTo('replenishment')}
          onNavigateTo={(page, opts) => navigateTo(page, opts)}
        />
      )}
      {currentPage === 'replenishment' && (
        <ReplenishmentPage
          themePreference={themePreference}
          onThemeChange={handleThemeChange}
          onNavigateToManifests={() => navigateTo('manifests')}
          onNavigateToSuppliers={() => navigateTo('suppliers')}
          initialSupplierFilter={targetSupplierFilter}
        />
      )}
    </Suspense>
  );
}
