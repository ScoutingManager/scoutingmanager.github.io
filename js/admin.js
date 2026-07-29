/* ScoutingManager - panel de administracion: aprobacion de usuarios y permisos */

const Admin = (() => {

  function render() {
    const root = document.getElementById('view-admin');
    if (!root) return;
    const users = DB.users.all().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const pending = users.filter(u => u.status === 'pending');
    const approved = users.filter(u => u.status === 'approved');
    const rejected = users.filter(u => u.status === 'rejected');

    root.innerHTML = `
      <h2>Panel de administración</h2>

      <section class="admin-section">
        <h3>Solicitudes pendientes ${pending.length ? `<span class="badge badge--warn">${pending.length}</span>` : ''}</h3>
        ${pending.length ? `
          <div class="admin-table-wrap">
            <table class="table">
              <thead><tr><th>Usuario</th><th>Email</th><th>Nota</th><th>Fecha</th><th></th></tr></thead>
              <tbody>
                ${pending.map(u => `
                  <tr data-id="${u.id}">
                    <td>${Utils.escapeHtml(u.username)}</td>
                    <td>${Utils.escapeHtml(u.email)}</td>
                    <td>${Utils.escapeHtml(u.note || '-')}</td>
                    <td>${new Date(u.createdAt).toLocaleDateString('es-ES')}</td>
                    <td class="admin-actions">
                      <button class="btn btn--primary btn--sm act-approve">Aprobar</button>
                      <button class="btn btn--danger btn--sm act-reject">Rechazar</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : '<p class="text-muted">No hay solicitudes pendientes.</p>'}
      </section>

      <section class="admin-section">
        <h3>Usuarios aprobados</h3>
        <div class="admin-table-wrap">
          <table class="table">
            <thead><tr><th>Usuario</th><th>Rol</th><th>Permisos</th><th></th></tr></thead>
            <tbody>
              ${approved.map(u => `
                <tr data-id="${u.id}">
                  <td>${Utils.escapeHtml(u.username)} ${u.username === 'jrverde' ? '<span class="badge badge--outline">admin principal</span>' : ''}</td>
                  <td>${u.role}</td>
                  <td>${permissionSummary(u)}</td>
                  <td class="admin-actions">
                    ${u.username !== 'jrverde' ? `<button class="btn btn--ghost btn--sm act-perm">Permisos</button><button class="btn btn--danger btn--sm act-remove">Eliminar</button>` : ''}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </section>

      ${rejected.length ? `
      <section class="admin-section">
        <h3>Rechazados</h3>
        <div class="admin-table-wrap">
          <table class="table">
            <thead><tr><th>Usuario</th><th>Email</th><th></th></tr></thead>
            <tbody>
              ${rejected.map(u => `
                <tr data-id="${u.id}">
                  <td>${Utils.escapeHtml(u.username)}</td>
                  <td>${Utils.escapeHtml(u.email)}</td>
                  <td class="admin-actions"><button class="btn btn--ghost btn--sm act-approve">Reconsiderar y aprobar</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </section>
      ` : ''}
    `;

    root.querySelectorAll('.act-approve').forEach(btn => btn.onclick = () => {
      const id = btn.closest('tr').dataset.id;
      const u = DB.users.getById(id);
      u.status = 'approved';
      DB.users.upsert(u);
      Utils.toast(`Usuario ${u.username} aprobado.`, 'success');
      render();
    });
    root.querySelectorAll('.act-reject').forEach(btn => btn.onclick = async () => {
      const id = btn.closest('tr').dataset.id;
      const u = DB.users.getById(id);
      const ok = await Utils.confirmDialog(`¿Rechazar la solicitud de ${u.username}?`);
      if (ok) { u.status = 'rejected'; DB.users.upsert(u); Utils.toast('Solicitud rechazada.', 'success'); render(); }
    });
    root.querySelectorAll('.act-remove').forEach(btn => btn.onclick = async () => {
      const id = btn.closest('tr').dataset.id;
      const u = DB.users.getById(id);
      const ok = await Utils.confirmDialog(`¿Eliminar la cuenta de ${u.username}?`);
      if (ok) { DB.users.remove(id); Utils.toast('Usuario eliminado.', 'success'); render(); }
    });
    root.querySelectorAll('.act-perm').forEach(btn => btn.onclick = () => {
      const id = btn.closest('tr').dataset.id;
      openPermissionEditor(id);
    });
  }

  function permissionSummary(u) {
    if (u.role === 'admin') return '<span class="badge">Acceso total</span>';
    const p = u.permissions || {};
    const bits = [];
    if (p.allCategories) bits.push('Todas las categorías');
    else if ((p.categoryIds || []).length) bits.push(`${p.categoryIds.length} categoría(s)`);
    else bits.push('Sin categorías');
    if (p.canEditCalendar) bits.push('Editor calendario');
    if (p.canEditScouting) bits.push('Editor scouting');
    return bits.map(b => `<span class="badge badge--outline">${b}</span>`).join(' ');
  }

  function openPermissionEditor(userId) {
    const u = DB.users.getById(userId);
    const categories = DB.categories.all().sort((a, b) => a.order - b.order);
    const p = u.permissions || {};
    const node = Utils.el(`
      <div class="modal">
        <div class="modal-header"><h3>Permisos de ${Utils.escapeHtml(u.username)}</h3><button class="modal-close" id="m-close">&times;</button></div>
        <div class="modal-body">
          <label class="field"><span>Rol</span>
            <select id="perm-role">
              <option value="scout" ${u.role === 'scout' ? 'selected' : ''}>Scout / editor</option>
              <option value="viewer" ${u.role === 'viewer' ? 'selected' : ''}>Visor (solo lectura)</option>
              <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Administrador</option>
            </select>
          </label>
          <label class="field field--checkbox"><input type="checkbox" id="perm-all" ${p.allCategories ? 'checked' : ''}> <span>Ver todas las categorías</span></label>
          <div id="perm-cats" class="perm-cats">
            ${categories.map(c => `
              <label class="field field--checkbox">
                <input type="checkbox" class="perm-cat" value="${c.id}" ${(p.categoryIds || []).includes(c.id) ? 'checked' : ''}>
                <span>${Utils.escapeHtml(c.name)}</span>
              </label>
            `).join('')}
          </div>
          <label class="field field--checkbox"><input type="checkbox" id="perm-cal" ${p.canEditCalendar ? 'checked' : ''}> <span>Puede crear/editar torneos en el calendario</span></label>
          <label class="field field--checkbox"><input type="checkbox" id="perm-scout" ${p.canEditScouting ? 'checked' : ''}> <span>Puede crear/editar jugadores, equipos y categorías</span></label>
        </div>
        <div class="modal-footer"><span></span><div><button class="btn btn--ghost" id="cancel">Cancelar</button><button class="btn btn--primary" id="save">Guardar</button></div></div>
      </div>
    `);
    function syncCatsDisabled() {
      const all = node.querySelector('#perm-all').checked;
      node.querySelector('#perm-cats').style.opacity = all ? .4 : 1;
      node.querySelectorAll('.perm-cat').forEach(cb => cb.disabled = all);
    }
    node.querySelector('#perm-all').onchange = syncCatsDisabled;
    syncCatsDisabled();
    node.querySelector('#m-close').onclick = Utils.closeModal;
    node.querySelector('#cancel').onclick = Utils.closeModal;
    node.querySelector('#save').onclick = () => {
      u.role = node.querySelector('#perm-role').value;
      u.permissions = {
        allCategories: node.querySelector('#perm-all').checked,
        categoryIds: Array.from(node.querySelectorAll('.perm-cat:checked')).map(cb => cb.value),
        canEditCalendar: node.querySelector('#perm-cal').checked,
        canEditScouting: node.querySelector('#perm-scout').checked,
        canManageUsers: u.role === 'admin'
      };
      DB.users.upsert(u);
      Utils.toast('Permisos actualizados.', 'success');
      Utils.closeModal();
      render();
    };
    Utils.openModal(node);
  }

  return { render };
})();
