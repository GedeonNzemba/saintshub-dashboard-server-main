/**
 * SaintsHub Admin — Auth Module
 * Manages JWT token, admin session, login / logout
 */
const Auth = (() => {
  const TOKEN_KEY  = 'sh_admin_token';
  const NAME_KEY   = 'sh_admin_name';

  function getToken()  { return localStorage.getItem(TOKEN_KEY); }
  function setToken(t) { localStorage.setItem(TOKEN_KEY, t); }
  function clearToken() { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(NAME_KEY); }

  function getName()  { return localStorage.getItem(NAME_KEY) || 'Admin'; }
  function setName(n) { localStorage.setItem(NAME_KEY, n); }

  function isLoggedIn() { return !!getToken(); }

  async function login(email, password) {
    const data = await API.signIn(email, password);

    // Ensure user is an admin
    if (!data.user?.admin) {
      throw new Error('Access denied. Admin privileges required.');
    }

    setToken(data.token);
    setName(data.user.name || data.user.email);
    return data.user;
  }

  function logout() {
    clearToken();
    location.reload();
  }

  return { getToken, setToken, clearToken, getName, setName, isLoggedIn, login, logout };
})();
