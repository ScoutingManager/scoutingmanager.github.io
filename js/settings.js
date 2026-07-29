/* JRVScoutingManager - configuracion de la app */

const Settings = (() => {

  const THEMES = [
    { id: 'real-madrid', name: 'Real Madrid', desc: 'Blanco, dorado, morado y azul', swatch: ['#ffffff', '#c9a227', '#4b2e83', '#00529f'] },
    { id: 'bottle-green', name: 'Verde Botella', desc: 'Sobrio, moderno y profesional', swatch: ['#0b3d2e', '#c9a227', '#123f30', '#e8ddc7'] }
  ];

  function applyTheme(themeId) {
    document.documentElement.setAttribute('data-theme', themeId);
  }

  function render() {
    const root = document.getElementById('view-settings');
    if (!root) return;
    const settings = DB.settings.get();
    const user = Auth.getCurrentUser();
    const colors = DB.colors.all();

    root.innerHTML = `
      <h2>Configuración</h2>

      <section class="settings-section">
        <h3>Apariencia</h3>
        <div class="theme-grid">
          ${THEMES.map(t => `
            <button class="theme-card ${settings.theme === t.id ? 'theme-card--active' : ''}" data-id="${t.id}">
              <div class="theme-swatch">${t.swatch.map(hex => `<span style="background:${hex}"></span>`).join('')}</div>
              <strong>${t.name}</strong>
              <span class="text-muted-sm">${t.desc}</span>
            </button>
          `).join('')}
        </div>
      </section>

      <section class="settings-section">
        <h3>Paleta de colores del calendario</h3>
        <div class="palette-list" id="palette-list">
          ${colors.map(c => `
            <div class="palette-row" data-id="${c.id}">
              <input type="color" class="pal-color" value="${c.hex}">
              <input type="text" class="input pal-name" value="${Utils.escapeHtml(c.name)}">
              <button class="btn btn--ghost btn--sm pal-del">✕</button>
            </div>
          `).join('')}
        </div>
        <form id="palette-add" class="form-inline">
          <input type="color" name="hex" value="#2D6CDF">
          <input type="text" name="name" class="input" placeholder="Nombre del color" required>
          <button class="btn btn--primary" type="submit">Añadir color</button>
        </form>
        <button class="btn btn--ghost" id="palette-save">Guardar paleta</button>
      </section>

      <section class="settings-section">
        <h3>Cuenta</h3>
        <p>Usuario: <strong>${Utils.escapeHtml(user.username)}</strong> (${user.role})</p>
        <form id="pw-form" class="form-grid">
          <label class="field field--full"><span>Nueva contraseña</span><input type="password" name="pw1" placeholder="Mínimo 8 caracteres, con mayúscula, minúscula, número y símbolo"></label>
          <label class="field field--full"><span>Repetir contraseña</span><input type="password" name="pw2"></label>
          <button class="btn btn--primary" type="submit">Cambiar contraseña</button>
        </form>
      </section>

      <section class="settings-section">
        <h3>Preferencias generales</h3>
        <label class="field field--checkbox"><input type="checkbox" id="pref-notifications" ${settings.notifications ? 'checked' : ''}> <span>Notificaciones de nuevos torneos y comentarios</span></label>
        <label class="field"><span>Idioma</span>
          <select id="pref-language">
            <option value="es" ${settings.language === 'es' ? 'selected' : ''}>Español</option>
            <option value="en" ${settings.language === 'en' ? 'selected' : ''}>English (próximamente)</option>
          </select>
        </label>
        <label class="field"><span>Formato de fecha</span>
          <select id="pref-dateformat">
            <option value="dd/mm/yyyy" ${settings.dateFormat === 'dd/mm/yyyy' ? 'selected' : ''}>DD/MM/AAAA</option>
            <option value="mm/dd/yyyy" ${settings.dateFormat === 'mm/dd/yyyy' ? 'selected' : ''}>MM/DD/AAAA</option>
          </select>
        </label>
        <label class="field"><span>Vista por defecto del calendario</span>
          <select id="pref-view">
            <option value="month" ${settings.defaultView === 'month' ? 'selected' : ''}>Mensual</option>
          </select>
        </label>
      </section>

      ${user.role === 'admin' ? `
      <section class="settings-section">
        <h3>Datos</h3>
        <p class="text-muted-sm">Los datos viven en la nube (Firebase) y se comparten entre todos los usuarios y dispositivos en tiempo real. Exporta una copia de seguridad periódicamente.</p>
        <div class="btn-row">
          <button class="btn btn--ghost" id="export-data">Exportar copia de seguridad (.json)</button>
          <label class="btn btn--ghost file-btn">Importar copia de seguridad
            <input type="file" id="import-data" accept=".json" hidden>
          </label>
        </div>
        <p class="text-muted-sm">⚠️ Importar sobrescribe los datos compartidos para todos los usuarios. Solo el administrador puede hacerlo.</p>
      </section>

      <section class="settings-section">
        <h3>Acerca de</h3>
        <p><strong>JRVScoutingManager</strong> — v0.2.0</p>
        <p class="text-muted-sm">Gestión de calendario de torneos y scouting de fútbol base. Backend en Firebase (Authentication + Firestore en tiempo real), accesible desde cualquier dispositivo.</p>
      </section>
      ` : ''}
    `;

    root.querySelectorAll('.theme-card').forEach(btn => btn.onclick = () => {
      const s = DB.settings.get();
      s.theme = btn.dataset.id;
      DB.settings.set(s);
      applyTheme(s.theme);
      render();
    });

    root.querySelector('#palette-add').onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      DB.colors.upsert({ id: DB.uid('color'), name: fd.get('name').trim(), hex: fd.get('hex') });
      Utils.toast('Color añadido.', 'success');
      render();
    };
    root.querySelectorAll('.pal-del').forEach(btn => btn.onclick = () => {
      DB.colors.remove(btn.closest('.palette-row').dataset.id);
      render();
    });
    root.querySelector('#palette-save').onclick = () => {
      root.querySelectorAll('.palette-row').forEach(row => {
        const c = DB.colors.all().find(c => c.id === row.dataset.id);
        if (!c) return;
        c.name = row.querySelector('.pal-name').value.trim();
        c.hex = row.querySelector('.pal-color').value;
        DB.colors.upsert(c);
      });
      Utils.toast('Paleta guardada.', 'success');
      render();
    };

    root.querySelector('#pw-form').onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const pw1 = fd.get('pw1'), pw2 = fd.get('pw2');
      if (pw1 !== pw2) return Utils.toast('Las contraseñas no coinciden.', 'error');
      const res = await Auth.changePassword(user.id, pw1);
      if (!res.ok) return Utils.toast(res.error, 'error');
      Utils.toast('Contraseña actualizada.', 'success');
      e.target.reset();
    };

    root.querySelector('#pref-notifications').onchange = (e) => { const s = DB.settings.get(); s.notifications = e.target.checked; DB.settings.set(s); };
    root.querySelector('#pref-language').onchange = (e) => { const s = DB.settings.get(); s.language = e.target.value; DB.settings.set(s); Utils.toast('El idioma inglés estará disponible próximamente.', 'info'); };
    root.querySelector('#pref-dateformat').onchange = (e) => { const s = DB.settings.get(); s.dateFormat = e.target.value; DB.settings.set(s); };
    root.querySelector('#pref-view').onchange = (e) => { const s = DB.settings.get(); s.defaultView = e.target.value; DB.settings.set(s); };

    const BACKUP_COLLECTIONS = ['users', 'tournaments', 'colors', 'categories', 'teams', 'squads', 'players', 'reports'];
    const exportBtn = root.querySelector('#export-data');
    if (exportBtn) exportBtn.onclick = () => {
      const backup = {};
      BACKUP_COLLECTIONS.forEach(name => { backup[name] = DB[name].all(); });
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `jrv-scouting-backup-${Utils.toISODate(new Date())}.json`;
      a.click();
    };
    const importInput = root.querySelector('#import-data');
    if (importInput) importInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const data = JSON.parse(reader.result);
          const ok = await Utils.confirmDialog('Esto sobrescribirá los datos compartidos para TODOS los usuarios. ¿Continuar?');
          if (!ok) { importInput.value = ''; return; }
          for (const name of BACKUP_COLLECTIONS) {
            if (Array.isArray(data[name])) await DB[name].save(data[name]);
          }
          Utils.toast('Copia de seguridad importada.', 'success');
        } catch (err) {
          Utils.toast('Archivo no válido.', 'error');
        }
        importInput.value = '';
      };
      reader.readAsText(file);
    };
  }

  return { render, applyTheme, THEMES };
})();
