// src/services/authService.js
// Token-based authentication and Role-Based Access Control (RBAC) service.

export const ROLES = {
  APPROVER: {
    id: 'approver',
    title: 'Procurement Approver (Director)',
    permissions: [
      'view_catalog',
      'edit_quantities',
      'bulk_edit',
      'approve_po',
      'dispatch_po',
      'manage_suppliers',
      'export_manifest',
      'delete_po',
    ],
  },
  BUYER: {
    id: 'buyer',
    title: 'Category Replenishment Buyer',
    permissions: [
      'view_catalog',
      'edit_quantities',
      'bulk_edit',
      'draft_po',
      'approve_po',
      'export_manifest',
    ],
  },
  CLERK: {
    id: 'clerk',
    title: 'Inventory Operations Clerk',
    permissions: [
      'view_catalog',
      'edit_quantities',
      'draft_po',
    ],
  },
};

const TOKEN_STORAGE_KEY = 'stockdesk_jwt_token';
const USER_STORAGE_KEY = 'stockdesk_auth_user';

function base64UrlEncode(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Creates a signed JWT token simulation containing user claims, role, and expiration.
 */
export function generateToken(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + (24 * 60 * 60), // 24 hours validity
    iss: 'stockdesk-auth-authority',
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  
  // Deterministic signature simulation
  let hash = 0;
  const rawData = `${encodedHeader}.${encodedPayload}`;
  for (let i = 0; i < rawData.length; i++) {
    hash = ((hash << 5) - hash) + rawData.charCodeAt(i);
    hash |= 0;
  }
  const signature = base64UrlEncode(`sig_${Math.abs(hash)}`);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verifies and decodes a JWT token. Returns null if expired or malformed.
 */
export function decodeAndVerifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const payloadJson = base64UrlDecode(parts[1]);
    const payload = JSON.parse(payloadJson);

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      console.warn('[authService] JWT token has expired.');
      return null;
    }
    return payload;
  } catch (err) {
    console.error('[authService] Failed to parse JWT token:', err);
    return null;
  }
}

/**
 * Performs authenticated sign-in and generates session token.
 */
export async function authenticateUser({ email, password, roleId = 'approver', rememberMe = true }) {
  if (!email || !email.includes('@')) {
    throw new Error('Please enter a valid business email address.');
  }
  if (!password || password.length < 4) {
    throw new Error('Password must be at least 4 characters.');
  }

  const selectedRole = Object.values(ROLES).find((r) => r.id === roleId) || ROLES.APPROVER;
  const displayName = email.split('@')[0]
    .replace(/[._]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const userClaim = {
    sub: `usr_${Date.now()}`,
    name: displayName || selectedRole.title,
    email: email.trim().toLowerCase(),
    role: selectedRole.id,
    roleTitle: selectedRole.title,
    permissions: selectedRole.permissions,
    avatar: (displayName || 'SD').substring(0, 2).toUpperCase(),
    loginTime: new Date().toISOString(),
  };

  const token = generateToken(userClaim);

  // Store according to rememberMe preference
  if (rememberMe) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userClaim));
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(USER_STORAGE_KEY);
  } else {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userClaim));
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  }

  return { token, user: userClaim };
}

/**
 * Retrieves the current verified authenticated session.
 */
export function getCurrentSession() {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY) || sessionStorage.getItem(TOKEN_STORAGE_KEY);
  if (!token) return null;

  const verifiedClaims = decodeAndVerifyToken(token);
  if (!verifiedClaims) {
    clearCurrentSession();
    return null;
  }
  return verifiedClaims;
}

/**
 * Checks if the current session has a required permission.
 */
export function hasPermission(requiredPermission) {
  const user = getCurrentSession();
  if (!user || !Array.isArray(user.permissions)) return false;
  return user.permissions.includes(requiredPermission);
}

/**
 * Logs out and clears tokens from all storage.
 */
export function clearCurrentSession() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(USER_STORAGE_KEY);
}
