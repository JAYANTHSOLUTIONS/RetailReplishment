import React, { useState, useEffect } from 'react';
import ReplenishmentPage from './features/replenishment/ReplenishmentPage.jsx';
import ManifestsPage from './features/manifests/ManifestsPage.jsx';
import SuppliersPage from './features/suppliers/SuppliersPage.jsx';
import { fetchAppSetting, saveAppSetting } from './db/queries.js';

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

  if (currentPage === 'manifests') {
    return (
      <ManifestsPage
        themePreference={themePreference}
        onThemeChange={handleThemeChange}
        onNavigateBack={() => navigateTo('replenishment')}
        onNavigateTo={(page, opts) => navigateTo(page, opts)}
      />
    );
  }

  if (currentPage === 'suppliers') {
    return (
      <SuppliersPage
        themePreference={themePreference}
        onThemeChange={handleThemeChange}
        onNavigateBack={() => navigateTo('replenishment')}
        onNavigateTo={(page, opts) => navigateTo(page, opts)}
      />
    );
  }

  return (
    <ReplenishmentPage
      themePreference={themePreference}
      onThemeChange={handleThemeChange}
      onNavigateToManifests={() => navigateTo('manifests')}
      onNavigateToSuppliers={() => navigateTo('suppliers')}
      initialSupplierFilter={targetSupplierFilter}
    />
  );
}
