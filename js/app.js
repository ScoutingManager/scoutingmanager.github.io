/* JRVScoutingManager - shell principal de la aplicacion */

const App = (() => {
  let currentView = 'calendar';

  function renderAuthView() {
    const root = document.getElementById('view-auth');
    root.innerHTML = `
      <div class="auth-wrap">
        <div class="auth-hero">
          <div class="auth-hero-logo">JRV</div>
          <h1>JRVScoutingManager</h1>
          <p>Gestión integral de calendario de torneos y scouting de fútbol base.</p>
        </div>
        <div class="auth-card">
          <div class="auth-tabs">
            <button class="auth-tab auth-tab--active" data-tab="login">Iniciar sesión</button>
            <button class="auth-tab" data-tab="register">Crear cuenta</button>
          </div>

          <form id="login-form" class="form-grid auth-form">
            <label class="field field--full"><span>Usuario</span><input type="text" name="username" required autocomplete="username"></label>
            <label class="field field--full"><span>Contraseña</span><input type="password" name="password" required autocomplete="current-password"></label>
            <p id="login-error" class="form-error"></p>
            <button class="btn btn--primary btn--block" type="submit">Entrar</button>
          </form>

          <form id="register-form" class="form-grid auth-form" hidden>
            <label class="field field--full"><span>Usuario *</span><input type="text" name="username" required minlength="3"></label>
            <label class="field field--full"><span>Email *</span><input type="email" name="email" required></label>
            <label class="field field--full"><span>Contraseña *</span><input type="password" name="password" required></label>
            <p class="text-muted-sm field--full">Mínimo 8 caracteres, con mayúscula, minúscula, número y carácter especial.</p>
            <label class="field field--full"><span>Repetir contraseña *</span><input type="password" name="passwordConfirm" required></label>
            <label class="field field--full"><span>Nota para el administrador (opcional)</span><textarea name="note" rows="2" placeholder="Ej. Soy el ojeador del equipo Alevín B"></textarea></label>
            <p id="register-error" class="form-error"></p>
            <p id="register-success" class="form-success"></p>
            <button class="btn btn--primary btn--block" type="submit">Solicitar acceso</button>
            <p class="text-muted-sm field--full">Tu cuenta quedará pendiente hasta que un administrador la valide.</p>
          </form>
        </div>
      </div>
    `;

    root.querySelectorAll('.auth-tab').forEach(tab => {
      tab.onclick = () => {
        root.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('auth-tab--active'));
        tab.classList.add('auth-tab--active');
        root.querySelector('#login-form').hidden = tab.dataset.tab !== 'login';
        root.querySelector('#register-form').hidden = tab.dataset.tab !== 'register';
      };
    });

    root.querySelector('#login-form').onsubmit = async (e) => {
      e.preventDefault();
      const submitBtn = e.target.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      const fd = new FormData(e.target);
      const res = await Auth.login(fd.get('username'), fd.get('password'));
      submitBtn.disabled = false;
      const errEl = root.querySelector('#login-error');
      if (!res.ok) { errEl.textContent = res.error; return; }
      errEl.textContent = '';
      enterApp();
    };

    root.querySelector('#register-form').onsubmit = async (e) => {
      e.preventDefault();
      const submitBtn = e.target.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      const fd = new FormData(e.target);
      const res = await Auth.register({
        username: fd.get('username'), email: fd.get('email'),
        password: fd.get('password'), passwordConfirm: fd.get('passwordConfirm'),
        note: fd.get('note')
      });
      submitBtn.disabled = false;
      const errEl = root.querySelector('#register-error');
      const okEl = root.querySelector('#register-success');
      if (!res.ok) { errEl.textContent = res.error; okEl.textContent = ''; return; }
      errEl.textContent = '';
      okEl.textContent = 'Solicitud enviada. Espera la validación de un administrador para poder iniciar sesión.';
      e.target.reset();
    };
  }

  function renderFatalError(title, message) {
    const root = document.getElementById('view-auth');
    root.hidden = false;
    root.innerHTML = `
      <div class="auth-wrap">
        <div class="auth-card">
          <h2>⚠️ ${Utils.escapeHtml(title)}</h2>
          <p>${Utils.escapeHtml(message)}</p>
        </div>
      </div>
    `;
  }

  function renderShellChrome() {
    const user = Auth.getCurrentUser();
    if (!user) return;
    document.getElementById('header-username').textContent = user.username;
    const isAdmin = user.role === 'admin' || Auth.can('canManageUsers');
    document.getElementById('nav-admin').hidden = !isAdmin;
  }

  function switchView(view) {
    if (view === 'admin' && !(Auth.getCurrentUser().role === 'admin' || Auth.can('canManageUsers'))) view = 'calendar';
    currentView = view;
    document.querySelectorAll('.view').forEach(v => v.hidden = true);
    document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('nav-item--active', n.dataset.view === view));
    const target = document.getElementById('view-' + view);
    target.hidden = false;
    renderForView(view);
  }

  function renderForView(view) {
    if (view === 'calendar') Calendar.render();
    if (view === 'teams') Teams.render();
    if (view === 'scouting') Scouting.render();
    if (view === 'ranking') Rankings.render();
    if (view === 'informes') Reports.render();
    if (view === 'admin') Admin.render();
    if (view === 'settings') Settings.render();
  }

  function refreshCurrentView() {
    if (!Auth.getCurrentUser()) return;
    Auth.refreshCurrentUser();
    renderShellChrome();
    renderForView(currentView);
  }

  function enterApp() {
    Auth.refreshCurrentUser();
    document.getElementById('app-header').hidden = false;
    document.getElementById('app-nav').hidden = false;
    document.getElementById('view-auth').hidden = true;
    renderShellChrome();
    const settings = DB.settings.get();
    Settings.applyTheme(settings.theme || 'real-madrid');
    Calendar.init();
    switchView('calendar');
  }

  async function exitApp() {
    await Auth.logout();
    document.getElementById('app-header').hidden = true;
    document.getElementById('app-nav').hidden = true;
    document.querySelectorAll('.view').forEach(v => v.hidden = true);
    document.getElementById('view-auth').hidden = false;
    renderAuthView();
  }

  function registerServiceWorker() {
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  }

  async function init() {
    registerServiceWorker();

    try {
      await Utils.waitForGlobal(() => window.FB || window.FB_CONFIG_MISSING, 10000);
    } catch (e) {
      renderFatalError('No se pudo conectar', 'No se pudo cargar Firebase. Comprueba tu conexión a internet y recarga la página.');
      return;
    }
    if (window.FB_CONFIG_MISSING) {
      renderFatalError('Configuración pendiente', 'Falta añadir la configuración de Firebase en js/firebase-init.js antes de poder usar la aplicación.');
      return;
    }

    DB.onChange(refreshCurrentView);

    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => switchView(btn.dataset.view));
    });
    document.getElementById('btn-logout').addEventListener('click', () => exitApp());

    try {
      await Seed.run();
    } catch (e) {
      console.error('Error inicializando datos de ejemplo', e);
    }

    const user = await Auth.waitForRestoredSession();
    if (user) {
      enterApp();
    } else {
      renderAuthView();
    }
  }

  return { init, switchView };
})();

document.addEventListener('DOMContentLoaded', () => { App.init(); });
