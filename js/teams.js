/* ScoutingManager - modulo Equipos: club > categoria/año (plantilla) > jugadores */

const Teams = (() => {
  let activeTeam = null;
  let activeSquad = null;

  function init() {
    const teams = DB.teams.all();
    if (!activeTeam || !teams.find(t => t.id === activeTeam)) activeTeam = teams[0]?.id || null;
    activeSquad = null;
    render();
  }

  function selectTeam(teamId) {
    activeTeam = teamId;
    activeSquad = null;
    App.switchView('teams');
  }

  function squadsOf(teamId) {
    return DB.squads.all().filter(s => s.teamId === teamId).filter(s => Auth.canSeeCategory(s.categoryId));
  }
  function playersOf(squadId) {
    return DB.players.all().filter(p => p.squadId === squadId);
  }

  function render() {
    const root = document.getElementById('view-teams');
    if (!root) return;
    const canEdit = Auth.can('canEditScouting');
    const teams = DB.teams.all();
    const squads = activeTeam ? squadsOf(activeTeam) : [];
    if (!activeSquad || !squads.find(s => s.id === activeSquad)) activeSquad = squads[0]?.id || null;
    const players = activeSquad ? playersOf(activeSquad) : [];
    const team = activeTeam ? DB.teams.getById(activeTeam) : null;

    root.innerHTML = `
      <div class="teams-layout">
        <aside class="teams-sidebar">
          <div class="teams-sidebar-header">
            <h3>Equipos</h3>
            ${canEdit ? `<button class="btn btn--primary btn--sm" id="team-add">+ Equipo</button>` : ''}
          </div>
          <div class="teams-list">
            ${teams.map(t => `
              <button class="team-list-item ${t.id === activeTeam ? 'team-list-item--active' : ''}" data-id="${t.id}">
                <span class="team-crest">${Utils.initials(t.name)}</span>
                <span>
                  <strong>${Utils.escapeHtml(t.name)}</strong>
                  <span class="text-muted-sm">${squadsOf(t.id).length} categoría(s)</span>
                </span>
              </button>
            `).join('') || '<p class="text-muted-sm">Sin equipos todavía.</p>'}
          </div>
        </aside>
        <section class="teams-main">
          ${!team ? '<p class="text-muted">Selecciona o crea un equipo para empezar.</p>' : `
            <div class="team-header">
              <div>
                <h2>${Utils.escapeHtml(team.name)}</h2>
                ${team.notes ? `<p class="text-muted-sm">${Utils.escapeHtml(team.notes)}</p>` : ''}
              </div>
              ${canEdit ? `<div class="btn-row"><button class="btn btn--ghost btn--sm" id="team-edit">Editar equipo</button><button class="btn btn--ghost btn--sm" id="team-delete">Eliminar equipo</button></div>` : ''}
            </div>

            <div class="squad-tabs">
              ${squads.map(s => `
                <button class="team-tab ${s.id === activeSquad ? 'team-tab--active' : ''}" data-id="${s.id}">${Utils.escapeHtml(s.name)}</button>
              `).join('')}
              ${canEdit ? `<button class="team-tab team-tab--add" id="squad-add">+ Categoría / año</button>` : ''}
              ${canEdit ? `<button class="btn btn--ghost btn--sm" id="cat-manage">Gestionar categorías</button>` : ''}
            </div>

            ${activeSquad ? `
            <div class="players-header">
              <h3>Plantilla</h3>
              ${canEdit ? `<button class="btn btn--primary" id="player-add">+ Jugador</button>` : ''}
              ${canEdit ? `<button class="btn btn--ghost" id="squad-delete">Eliminar categoría</button>` : ''}
            </div>
            <div class="player-grid">
              ${players.map(p => PlayerUI.cardHtml(p)).join('') || '<p class="text-muted">Sin jugadores en esta categoría todavía.</p>'}
            </div>
            ` : squads.length ? '' : '<p class="text-muted">Añade una categoría/año para empezar a registrar jugadores.</p>'}
          `}
        </section>
      </div>
    `;

    root.querySelectorAll('.team-list-item').forEach(btn => btn.onclick = () => { activeTeam = btn.dataset.id; activeSquad = null; render(); });
    const teamAddBtn = root.querySelector('#team-add');
    if (teamAddBtn) teamAddBtn.onclick = () => openTeamForm();
    const teamEditBtn = root.querySelector('#team-edit');
    if (teamEditBtn) teamEditBtn.onclick = () => openTeamForm(team);
    const teamDelBtn = root.querySelector('#team-delete');
    if (teamDelBtn) teamDelBtn.onclick = async () => {
      const ok = await Utils.confirmDialog(`¿Eliminar el equipo "${team.name}" con todas sus categorías y jugadores?`);
      if (ok) {
        const squadIds = new Set(squadsOf(team.id).map(s => s.id));
        DB.players.save(DB.players.all().filter(p => !squadIds.has(p.squadId)));
        DB.squads.save(DB.squads.all().filter(s => s.teamId !== team.id));
        DB.teams.remove(team.id);
        activeTeam = null;
        Utils.toast('Equipo eliminado.', 'success');
        init();
      }
    };
    root.querySelectorAll('.team-tab[data-id]').forEach(btn => btn.onclick = () => { activeSquad = btn.dataset.id; render(); });
    const squadAddBtn = root.querySelector('#squad-add');
    if (squadAddBtn) squadAddBtn.onclick = () => openSquadForm(activeTeam);
    const squadDelBtn = root.querySelector('#squad-delete');
    if (squadDelBtn) squadDelBtn.onclick = async () => {
      const squad = DB.squads.getById(activeSquad);
      const ok = await Utils.confirmDialog(`¿Eliminar "${squad.name}" y todos sus jugadores?`);
      if (ok) {
        DB.players.save(DB.players.all().filter(p => p.squadId !== activeSquad));
        DB.squads.remove(activeSquad);
        activeSquad = null;
        Utils.toast('Categoría eliminada.', 'success');
        render();
      }
    };
    const catManageBtn = root.querySelector('#cat-manage');
    if (catManageBtn) catManageBtn.onclick = () => openCategoryManager(() => render());
    const playerAddBtn = root.querySelector('#player-add');
    if (playerAddBtn) {
      const squad = DB.squads.getById(activeSquad);
      playerAddBtn.onclick = () => PlayerUI.openForm(activeSquad, activeTeam, squad.categoryId, null, () => render());
    }
    root.querySelectorAll('.player-card').forEach(card => card.onclick = () => PlayerUI.openDetail(card.dataset.id, { onChange: render }));
  }

  function openTeamForm(existing) {
    const isEdit = !!existing;
    const t = existing || { id: null, name: '', notes: '' };
    const node = Utils.el(`
      <div class="modal modal--sm">
        <div class="modal-header"><h3>${isEdit ? 'Editar equipo' : 'Nuevo equipo'}</h3><button class="modal-close" id="m-close">&times;</button></div>
        <div class="modal-body">
          <form id="team-form" class="form-grid">
            <label class="field field--full"><span>Nombre del equipo/club *</span><input required type="text" name="name" value="${Utils.escapeHtml(t.name)}" placeholder="Ej. Real Madrid CF"></label>
            <label class="field field--full"><span>Notas (opcional)</span><textarea name="notes" rows="2">${Utils.escapeHtml(t.notes || '')}</textarea></label>
          </form>
        </div>
        <div class="modal-footer"><span></span><div><button class="btn btn--ghost" id="cancel">Cancelar</button><button class="btn btn--primary" id="save">Guardar</button></div></div>
      </div>
    `);
    node.querySelector('#m-close').onclick = Utils.closeModal;
    node.querySelector('#cancel').onclick = Utils.closeModal;
    node.querySelector('#save').onclick = () => {
      const form = node.querySelector('#team-form');
      if (!form.reportValidity()) return;
      const fd = new FormData(form);
      const record = { id: t.id || DB.uid('team'), name: fd.get('name').trim(), notes: fd.get('notes').trim() };
      DB.teams.upsert(record);
      activeTeam = record.id;
      Utils.closeModal();
      Utils.toast(isEdit ? 'Equipo actualizado.' : 'Equipo creado.', 'success');
      init();
    };
    Utils.openModal(node);
  }

  function openSquadForm(teamId) {
    const categories = DB.categories.all().sort((a, b) => a.order - b.order);
    const node = Utils.el(`
      <div class="modal modal--sm">
        <div class="modal-header"><h3>Nueva categoría / año</h3><button class="modal-close" id="m-close">&times;</button></div>
        <div class="modal-body">
          <form id="squad-form" class="form-grid">
            <label class="field field--full"><span>Categoría *</span>
              <select name="categoryId" required>${categories.map(c => `<option value="${c.id}">${Utils.escapeHtml(c.name)}</option>`).join('')}</select>
            </label>
            <label class="field field--full"><span>Año / temporada *</span><input required type="text" name="year" placeholder="Ej. 2014 o 2025/26"></label>
          </form>
        </div>
        <div class="modal-footer"><span></span><div><button class="btn btn--ghost" id="cancel">Cancelar</button><button class="btn btn--primary" id="save">Guardar</button></div></div>
      </div>
    `);
    node.querySelector('#m-close').onclick = Utils.closeModal;
    node.querySelector('#cancel').onclick = Utils.closeModal;
    node.querySelector('#save').onclick = () => {
      const form = node.querySelector('#squad-form');
      if (!form.reportValidity()) return;
      const fd = new FormData(form);
      const categoryId = fd.get('categoryId');
      const cat = DB.categories.getById(categoryId);
      const year = fd.get('year').trim();
      const record = { id: DB.uid('squad'), teamId, categoryId, year, name: `${cat.name} ${year}` };
      DB.squads.upsert(record);
      activeSquad = record.id;
      Utils.closeModal();
      Utils.toast('Categoría añadida.', 'success');
      render();
    };
    Utils.openModal(node);
  }

  function openCategoryManager(onDone) {
    const cats = DB.categories.all().sort((a, b) => a.order - b.order);
    const node = Utils.el(`
      <div class="modal">
        <div class="modal-header"><h3>Gestionar categorías</h3><button class="modal-close" id="m-close">&times;</button></div>
        <div class="modal-body">
          <div class="cat-manage-list">
            ${cats.map(c => `
              <div class="cat-manage-row" data-id="${c.id}">
                <input type="text" class="input cat-name" value="${Utils.escapeHtml(c.name)}">
                <input type="text" class="input cat-years" value="${Utils.escapeHtml(c.years)}" placeholder="Años orientativos, ej. 2014-2015">
                <button class="btn btn--danger btn--sm cat-del">Eliminar</button>
              </div>
            `).join('')}
          </div>
          <form id="cat-add-form" class="form-inline">
            <input type="text" name="name" class="input" placeholder="Nueva categoría (ej. Chupetín)" required>
            <input type="text" name="years" class="input" placeholder="Años (ej. 2020-2021)">
            <button class="btn btn--primary" type="submit">Añadir</button>
          </form>
        </div>
        <div class="modal-footer"><span></span><button class="btn btn--primary" id="cat-save">Guardar cambios</button></div>
      </div>
    `);
    node.querySelector('#m-close').onclick = Utils.closeModal;
    node.querySelector('#cat-add-form').onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const maxOrder = Math.max(0, ...DB.categories.all().map(c => c.order));
      DB.categories.upsert({ id: DB.uid('cat'), name: fd.get('name').trim(), years: fd.get('years').trim(), order: maxOrder + 1 });
      openCategoryManager(onDone);
    };
    node.querySelectorAll('.cat-del').forEach(btn => btn.onclick = async () => {
      const row = btn.closest('.cat-manage-row');
      const ok = await Utils.confirmDialog('¿Eliminar esta categoría? Las plantillas asociadas no se eliminarán automáticamente.');
      if (ok) { DB.categories.remove(row.dataset.id); openCategoryManager(onDone); }
    });
    node.querySelector('#cat-save').onclick = () => {
      node.querySelectorAll('.cat-manage-row').forEach(row => {
        const cat = DB.categories.getById(row.dataset.id);
        if (!cat) return;
        cat.name = row.querySelector('.cat-name').value.trim();
        cat.years = row.querySelector('.cat-years').value.trim();
        DB.categories.upsert(cat);
      });
      Utils.toast('Categorías actualizadas.', 'success');
      Utils.closeModal();
      if (onDone) onDone();
    };
    Utils.openModal(node);
  }

  return { init, render, selectTeam };
})();
