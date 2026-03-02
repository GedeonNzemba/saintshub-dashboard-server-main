/**
 * SaintsHub Admin — Main Application
 * SPA router, page rendering, event wiring
 */
const App = (() => {
  /* ── DOM refs ─────────────────────────────────────────────── */
  const $  = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const dom = {
    loginScreen:    () => $('#login-screen'),
    appShell:       () => $('#app-shell'),
    loginForm:      () => $('#login-form'),
    loginEmail:     () => $('#login-email'),
    loginPassword:  () => $('#login-password'),
    loginError:     () => $('#login-error'),
    loginBtn:       () => $('#login-btn'),
    logoutBtn:      () => $('#logout-btn'),
    pageContainer:  () => $('#page-container'),
    pageTitle:      () => $('#page-title'),
    pageDesc:       () => $('#page-desc'),
    adminName:      () => $('#admin-name'),
    navBadge:       () => $('#nav-badge'),
    toast:          () => $('#toast'),
    toastMsg:       () => $('#toast-message'),
    // Email modal
    emailModal:     () => $('#email-modal'),
    emailSubject:   () => $('#email-subject'),
    emailMessage:   () => $('#email-message'),
    emailTo:        () => $('#email-modal-to'),
    emailSendBtn:   () => $('#email-send-btn'),
    emailError:     () => $('#email-modal-error'),
    // Confirm modal
    confirmModal:   () => $('#confirm-modal'),
    confirmTitle:   () => $('#confirm-title'),
    confirmMessage: () => $('#confirm-message'),
    confirmOkBtn:   () => $('#confirm-ok-btn'),
  };

  let currentPage = 'dashboard';
  let pendingRequests = [];
  let confirmCallback = null;
  let emailUserId = null;

  /* ── Bootstrap ────────────────────────────────────────────── */
  function init() {
    if (Auth.isLoggedIn()) {
      showApp();
    } else {
      showLogin();
    }
    bindGlobalEvents();
  }

  function showLogin() {
    dom.loginScreen().style.display = 'flex';
    dom.appShell().style.display = 'none';
  }

  function showApp() {
    dom.loginScreen().style.display = 'none';
    dom.appShell().style.display = 'flex';
    dom.adminName().textContent = Auth.getName();
    navigate('dashboard');
  }

  /* ── Navigation ───────────────────────────────────────────── */
  function navigate(page) {
    currentPage = page;

    // Update active nav
    $$('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
    });

    // Update header
    const titles = {
      'dashboard':        { title: 'DASHBOARD', desc: 'Platform overview' },
      'upgrade-requests': { title: 'UPGRADE REQUESTS', desc: 'Review and manage storage plan requests' },
    };
    const info = titles[page] || titles.dashboard;
    dom.pageTitle().textContent = info.title;
    dom.pageDesc().textContent = info.desc;

    // Render page
    renderPage(page);
  }

  async function renderPage(page) {
    const container = dom.pageContainer();
    container.innerHTML = loader();

    try {
      switch (page) {
        case 'dashboard':
          await renderDashboard(container);
          break;
        case 'upgrade-requests':
          await renderUpgradeRequests(container);
          break;
        default:
          container.innerHTML = '<p>Page not found.</p>';
      }
    } catch (err) {
      container.innerHTML = `<div class="empty-state"><p>Error loading page: ${esc(err.message)}</p></div>`;
    }
  }

  /* ── Dashboard Page ───────────────────────────────────────── */
  async function renderDashboard(container) {
    // Fetch data in parallel
    const [upgradeData, adminsData] = await Promise.all([
      API.getUpgradeRequests().catch(() => ({ count: 0, requests: [] })),
      API.getAllAdmins().catch(() => ({ users: [] })),
    ]);

    pendingRequests = upgradeData.requests || [];
    updateBadge(upgradeData.count);

    const totalAdmins = adminsData.users?.length || 0;
    const pendingCount = upgradeData.count || 0;

    container.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">TOTAL ADMINS</div>
          <div class="stat-value">${totalAdmins}</div>
          <div class="stat-sub">Platform administrators</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">PENDING UPGRADES</div>
          <div class="stat-value">${pendingCount}</div>
          <div class="stat-sub">${pendingCount === 0 ? 'All caught up' : 'Awaiting review'}</div>
        </div>
      </div>
      ${pendingCount > 0 ? `
        <div class="section-header">
          <h2 class="section-title">RECENT REQUESTS</h2>
        </div>
        <div class="requests-list">
          ${upgradeData.requests.slice(0, 3).map(requestCard).join('')}
        </div>
        <div style="margin-top:16px; text-align:center;">
          <button class="btn btn-ghost" onclick="App.navigate('upgrade-requests')">VIEW ALL REQUESTS</button>
        </div>
      ` : ''}
    `;

    bindRequestCardEvents(container);
  }

  /* ── Upgrade Requests Page ────────────────────────────────── */
  async function renderUpgradeRequests(container) {
    const data = await API.getUpgradeRequests();
    pendingRequests = data.requests || [];
    updateBadge(data.count);

    if (pendingRequests.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
            <path d="M9 12l2 2 4-4"/>
            <circle cx="12" cy="12" r="10"/>
          </svg>
          <h3>No Pending Requests</h3>
          <p>All storage upgrade requests have been handled.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="section-header">
        <h2 class="section-title">${data.count} PENDING REQUEST${data.count !== 1 ? 'S' : ''}</h2>
        <button class="btn btn-ghost btn-sm" id="refresh-requests-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path d="M1 4v6h6"/><path d="M23 20v-6h-6"/>
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
          </svg>
          REFRESH
        </button>
      </div>
      <div class="requests-list">
        ${pendingRequests.map(requestCard).join('')}
      </div>
    `;

    bindRequestCardEvents(container);

    const refreshBtn = container.querySelector('#refresh-requests-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => renderPage('upgrade-requests'));
    }
  }

  /* ── Request Card Template ────────────────────────────────── */
  function requestCard(req) {
    const avatarContent = req.avatar
      ? `<img src="${esc(req.avatar)}" alt="">`
      : initials(req.name);

    return `
      <div class="request-card" data-user-id="${esc(req.userId)}">
        <div class="request-header">
          <div class="request-user">
            <div class="request-avatar">${avatarContent}</div>
            <div>
              <div class="request-name">${esc(req.name || 'Unknown')}</div>
              <div class="request-email">${esc(req.email)}</div>
            </div>
          </div>
          <div class="request-time">${timeAgo(req.requestedAt)}</div>
        </div>
        <div class="request-body">
          <div class="plan-change">
            <span class="plan-badge ${esc(req.currentPlan)}">${esc(req.currentPlan)}</span>
            <span class="plan-arrow">→</span>
            <span class="plan-badge ${esc(req.requestedPlan)}">${esc(req.requestedPlan)}</span>
          </div>
          ${req.reason ? `<div class="request-reason">${esc(req.reason)}</div>` : ''}
        </div>
        <div class="request-actions">
          <button class="btn btn-primary btn-sm" data-action="approve" data-user-id="${esc(req.userId)}" data-plan="${esc(req.requestedPlan)}">
            APPROVE
          </button>
          <button class="btn btn-danger btn-sm" data-action="reject" data-user-id="${esc(req.userId)}">
            REJECT
          </button>
          <button class="btn btn-ghost btn-sm" data-action="email" data-user-id="${esc(req.userId)}" data-user-email="${esc(req.email)}" data-user-name="${esc(req.name)}">
            EMAIL
          </button>
        </div>
      </div>
    `;
  }

  /* ── Bind actions on request cards ────────────────────────── */
  function bindRequestCardEvents(container) {
    container.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', handleRequestAction);
    });
  }

  async function handleRequestAction(e) {
    const btn = e.currentTarget;
    const action = btn.dataset.action;
    const userId = btn.dataset.userId;

    switch (action) {
      case 'approve': {
        const plan = btn.dataset.plan;
        openConfirm(
          'APPROVE UPGRADE',
          `Upgrade this user to the <strong>${esc(plan)}</strong> plan?`,
          async () => {
            await API.approveUpgrade(userId, plan);
            toast(`Upgraded to ${plan}`, 'success');
            renderPage(currentPage);
          }
        );
        break;
      }
      case 'reject': {
        openConfirm(
          'REJECT REQUEST',
          'Reject this upgrade request? The user will stay on their current plan.',
          async () => {
            await API.rejectUpgrade(userId);
            toast('Request rejected', 'success');
            renderPage(currentPage);
          }
        );
        break;
      }
      case 'email': {
        openEmailModal(userId, btn.dataset.userName, btn.dataset.userEmail);
        break;
      }
    }
  }

  /* ── Confirm Modal ────────────────────────────────────────── */
  function openConfirm(title, message, callback) {
    dom.confirmTitle().textContent = title;
    dom.confirmMessage().innerHTML = message;
    dom.confirmModal().style.display = 'flex';
    confirmCallback = callback;
  }

  function closeConfirm() {
    dom.confirmModal().style.display = 'none';
    confirmCallback = null;
    resetBtn(dom.confirmOkBtn());
  }

  /* ── Email Modal ──────────────────────────────────────────── */
  function openEmailModal(userId, name, email) {
    emailUserId = userId;
    dom.emailTo().textContent = `To: ${name} (${email})`;
    dom.emailSubject().value = 'RE: Your Storage Upgrade Request';
    dom.emailMessage().value = '';
    dom.emailError().style.display = 'none';
    dom.emailModal().style.display = 'flex';
    dom.emailSubject().focus();
  }

  function closeEmailModal() {
    dom.emailModal().style.display = 'none';
    emailUserId = null;
    resetBtn(dom.emailSendBtn());
  }

  /* ── Toast ────────────────────────────────────────────────── */
  function toast(msg, type = 'success') {
    const el = dom.toast();
    const msgEl = dom.toastMsg();
    el.className = `toast ${type}`;
    msgEl.textContent = msg;
    el.style.display = 'block';
    clearTimeout(el._timer);
    el._timer = setTimeout(() => { el.style.display = 'none'; }, 3500);
  }

  /* ── Badge ────────────────────────────────────────────────── */
  function updateBadge(count) {
    const badge = dom.navBadge();
    if (count > 0) {
      badge.textContent = count;
      badge.style.display = 'inline-flex';
    } else {
      badge.style.display = 'none';
    }
  }

  /* ── Button helpers ───────────────────────────────────────── */
  function setLoading(btn, loading) {
    const text = btn.querySelector('.btn-text');
    const ldr  = btn.querySelector('.btn-loader');
    if (text) text.style.display = loading ? 'none' : '';
    if (ldr)  ldr.style.display  = loading ? 'inline-flex' : 'none';
    btn.disabled = loading;
  }

  function resetBtn(btn) {
    setLoading(btn, false);
  }

  /* ── Utility helpers ──────────────────────────────────────── */
  function esc(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = String(str);
    return d.innerHTML;
  }

  function initials(name) {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  function timeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins < 1)   return 'just now';
    if (mins < 60)  return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30)  return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  }

  function loader() {
    return '<div class="page-loader"><span class="spinner"></span></div>';
  }

  /* ── Global Event Binding ─────────────────────────────────── */
  function bindGlobalEvents() {
    // Login form
    dom.loginForm().addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = dom.loginEmail().value.trim();
      const pass  = dom.loginPassword().value;
      const errEl = dom.loginError();
      const btn   = dom.loginBtn();

      errEl.style.display = 'none';
      setLoading(btn, true);

      try {
        await Auth.login(email, pass);
        showApp();
      } catch (err) {
        errEl.textContent = err.message;
        errEl.style.display = 'block';
        setLoading(btn, false);
      }
    });

    // Logout
    dom.logoutBtn().addEventListener('click', Auth.logout);

    // Sidebar nav
    $$('.nav-item').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        navigate(el.dataset.page);
      });
    });

    // Email modal
    $('#email-modal-close').addEventListener('click', closeEmailModal);
    $('#email-cancel-btn').addEventListener('click', closeEmailModal);
    dom.emailSendBtn().addEventListener('click', async () => {
      const subject = dom.emailSubject().value.trim();
      const message = dom.emailMessage().value.trim();
      const errEl   = dom.emailError();

      if (!subject || !message) {
        errEl.textContent = 'Subject and message are required.';
        errEl.style.display = 'block';
        return;
      }

      setLoading(dom.emailSendBtn(), true);
      errEl.style.display = 'none';

      try {
        await API.sendEmail(emailUserId, subject, message);
        closeEmailModal();
        toast('Email sent successfully');
      } catch (err) {
        errEl.textContent = err.message;
        errEl.style.display = 'block';
        setLoading(dom.emailSendBtn(), false);
      }
    });

    // Confirm modal
    $('#confirm-modal-close').addEventListener('click', closeConfirm);
    $('#confirm-cancel-btn').addEventListener('click', closeConfirm);
    dom.confirmOkBtn().addEventListener('click', async () => {
      if (!confirmCallback) return;
      setLoading(dom.confirmOkBtn(), true);
      try {
        await confirmCallback();
        closeConfirm();
      } catch (err) {
        toast(err.message, 'error');
        setLoading(dom.confirmOkBtn(), false);
      }
    });

    // Close modals on overlay click
    [dom.emailModal(), dom.confirmModal()].forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.style.display = 'none';
        }
      });
    });
  }

  // Public API (for inline onclick handlers)
  return { init, navigate };
})();

/* ── Boot ───────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', App.init);
