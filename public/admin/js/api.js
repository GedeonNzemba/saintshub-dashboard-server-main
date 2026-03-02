/**
 * SaintsHub Admin — API Client
 * Thin wrapper around fetch for all backend calls
 */
const API = (() => {
  const BASE = '/api';

  async function request(method, path, body = null) {
    const token = Auth.getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${BASE}${path}`, opts);
    const data = await res.json().catch(() => ({}));

    if (res.status === 401) {
      Auth.logout();
      throw new Error('Session expired. Please sign in again.');
    }

    if (!res.ok) {
      throw new Error(data.error || data.message || `Request failed (${res.status})`);
    }

    return data;
  }

  return {
    get:  (path)       => request('GET',  path),
    post: (path, body) => request('POST', path, body),
    put:  (path, body) => request('PUT',  path, body),
    del:  (path)       => request('DELETE', path),

    // ── Auth ──
    signIn: (email, password) =>
      request('POST', '/signin', { email, password }),

    // ── Admin: Upgrade Requests ──
    getUpgradeRequests: () =>
      request('GET', '/admin/upgrade-requests'),

    approveUpgrade: (userId, plan) =>
      request('PUT', `/admin/users/${userId}/plan`, { plan }),

    rejectUpgrade: (userId) =>
      request('PUT', `/admin/users/${userId}/reject-upgrade`),

    // ── Admin: Email ──
    sendEmail: (userId, subject, message) =>
      request('POST', `/admin/users/${userId}/send-email`, { subject, message }),

    // ── Admin: Overview ──
    getAllAdmins: () =>
      request('GET', '/admin/all-admins'),

    getPendingAdminRequests: () =>
      request('GET', '/admin/pending-requests'),
  };
})();
