import { useState } from 'react';
import PropTypes from 'prop-types';
import '../../styles/replenishment.css';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LoginIcon from '@mui/icons-material/Login';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ThemeSwitcher from '../../components/ui/ThemeSwitcher.jsx';
import { authenticateUser, ROLES } from '../../services/authService.js';

export default function LoginPage({
  onLoginSuccess,
  themePreference,
  onThemeChange,
}) {
  const [email, setEmail] = useState('admin@stockdesk.com');
  const [password, setPassword] = useState('admin123');
  const [roleId, setRoleId] = useState('approver');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async (credentials) => {
    setError('');
    setIsLoading(true);
    try {
      const { user } = await authenticateUser(credentials);
      setIsLoading(false);
      onLoginSuccess(user);
    } catch (err) {
      setIsLoading(false);
      setError(err?.message || 'Authentication failed. Please verify your credentials.');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleAuth({ email, password, roleId, rememberMe });
  };

  const handleRoleQuickLogin = (selectedRole, defaultEmail = null) => {
    const credEmail = defaultEmail || (selectedRole === 'approver' ? 'director@stockdesk.com' : 'clerk@stockdesk.com');
    setRoleId(selectedRole);
    setEmail(credEmail);
    handleAuth({
      email: credEmail,
      password: 'authSecurePassword123',
      roleId: selectedRole,
      rememberMe,
    });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        background: 'var(--bg, #f8fafc)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        position: 'relative',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Top right theme switcher */}
      <div style={{ position: 'absolute', top: 20, right: 24 }}>
        <ThemeSwitcher value={themePreference} onChange={onThemeChange} />
      </div>

      {/* Main card */}
      <div
        style={{
          width: '100%',
          maxWidth: 460,
          background: 'var(--surface, #ffffff)',
          border: '1px solid var(--border, #e2e8f0)',
          borderRadius: 14,
          padding: '36px 32px',
          boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
        }}
      >
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
              boxShadow: '0 6px 16px rgba(37, 99, 235, 0.3)',
            }}
          >
            <ShieldOutlinedIcon style={{ fontSize: 28 }} />
          </div>
          <h1
            style={{
              margin: '0 0 6px 0',
              fontSize: 22,
              fontWeight: 800,
              color: 'var(--text, #0f172a)',
              letterSpacing: '-0.02em',
            }}
          >
            StockDesk Secure Portal
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: 'var(--text3, #64748b)',
            }}
          >
            Token-Based Session Authentication &amp; RBAC Access
          </p>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 12,
              color: '#dc2626',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
            role="alert"
          >
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Email Input */}
          <div style={{ marginBottom: 16 }}>
            <label
              htmlFor="auth-email"
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text, #1e293b)',
                marginBottom: 6,
              }}
            >
              Enterprise Work Email
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '0 12px',
                height: 42,
                background: 'var(--bg, #f8fafc)',
                border: '1px solid var(--border, #cbd5e1)',
                borderRadius: 8,
              }}
            >
              <EmailOutlinedIcon style={{ fontSize: 18, color: 'var(--text3, #94a3b8)' }} />
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@stockdesk.com"
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  width: '100%',
                  fontSize: 13,
                  color: 'var(--text, #0f172a)',
                }}
              />
            </div>
          </div>

          {/* Password Input */}
          <div style={{ marginBottom: 16 }}>
            <label
              htmlFor="auth-password"
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text, #1e293b)',
                marginBottom: 6,
              }}
            >
              Password
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '0 12px',
                height: 42,
                background: 'var(--bg, #f8fafc)',
                border: '1px solid var(--border, #cbd5e1)',
                borderRadius: 8,
              }}
            >
              <LockOutlinedIcon style={{ fontSize: 18, color: 'var(--text3, #94a3b8)' }} />
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  width: '100%',
                  fontSize: 13,
                  color: 'var(--text, #0f172a)',
                }}
              />
            </div>
          </div>

          {/* Role-Based Permissions Selection */}
          <div style={{ marginBottom: 18 }}>
            <label
              htmlFor="auth-role"
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text, #1e293b)',
                marginBottom: 6,
              }}
            >
              Operational Role &amp; Permissions
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '0 12px',
                height: 42,
                background: 'var(--bg, #f8fafc)',
                border: '1px solid var(--border, #cbd5e1)',
                borderRadius: 8,
              }}
            >
              <BadgeOutlinedIcon style={{ fontSize: 18, color: 'var(--text3, #94a3b8)' }} />
              <select
                id="auth-role"
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  width: '100%',
                  fontSize: 13,
                  color: 'var(--text, #0f172a)',
                  cursor: 'pointer',
                }}
              >
                {Object.values(ROLES).map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3, #64748b)', marginTop: 4 }}>
              {roleId === 'approver' && '✓ Full PO Dispatch, Supplier Management & Financial Approval'}
              {roleId === 'buyer' && '✓ Quantity Planning, Bulk Target Adjustments & PO Drafting'}
              {roleId === 'clerk' && '✓ Catalog Read & Inline Drafts (Approval by Supervisor Required)'}
            </div>
          </div>

          {/* Remember me */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
              fontSize: 12,
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--text2, #475569)' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: 'var(--brand, #2563eb)' }}
              />
              <span>Remember session token</span>
            </label>
            <span style={{ color: 'var(--brand, #2563eb)', cursor: 'pointer', fontWeight: 500 }}>
              Single Sign-On (SSO)
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              height: 42,
              borderRadius: 8,
              background: 'var(--brand, #2563eb)',
              color: '#ffffff',
              border: 'none',
              fontSize: 13,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)',
              transition: 'all 0.15s ease',
            }}
          >
            <LoginIcon style={{ fontSize: 18 }} />
            <span>{isLoading ? 'Generating Session Token...' : 'Authorize Session'}</span>
          </button>
        </form>

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            margin: '20px 0',
            color: 'var(--text3, #94a3b8)',
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          <div style={{ flex: 1, height: 1, background: 'var(--border, #e2e8f0)' }} />
          <span style={{ padding: '0 12px' }}>Role Presets</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border, #e2e8f0)' }} />
        </div>

        {/* Quick RBAC Role Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button
            type="button"
            onClick={() => handleRoleQuickLogin('approver')}
            disabled={isLoading}
            style={{
              height: 38,
              borderRadius: 8,
              background: 'var(--surface-hover, rgba(37, 99, 235, 0.06))',
              color: 'var(--brand, #2563eb)',
              border: '1px solid var(--border, #cbd5e1)',
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            <span>⚡ Approver</span>
            <ArrowForwardIcon style={{ fontSize: 14 }} />
          </button>

          <button
            type="button"
            onClick={() => handleRoleQuickLogin('clerk')}
            disabled={isLoading}
            style={{
              height: 38,
              borderRadius: 8,
              background: 'var(--surface-hover, rgba(37, 99, 235, 0.06))',
              color: 'var(--text2, #475569)',
              border: '1px solid var(--border, #cbd5e1)',
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            <span>📋 Clerk</span>
            <ArrowForwardIcon style={{ fontSize: 14 }} />
          </button>
        </div>
      </div>
    </div>
  );
}

LoginPage.propTypes = {
  onLoginSuccess: PropTypes.func.isRequired,
  themePreference: PropTypes.string,
  onThemeChange: PropTypes.func,
};
