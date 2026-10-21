// src/components/layout/PageContainer.jsx
// Wraps page content with consistent padding, max-width, and scroll behaviour.
export default function PageContainer({ children }) {
  return (
    <main className="layout-page-container">
      {children}
    </main>
  );
}
