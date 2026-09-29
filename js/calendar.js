/* ScoutingManager - calendario dinamico con torneos multi-dia */

const Calendar = (() => {
  let viewYear, viewMonth; // viewMonth: 0-11
  let filterCategory = '';
  // Alto de cada fila de torneo y hueco superior para el numero del dia (igual que en base.css)
  const LANE_HEIGHT = 22, LANE_GAP = 3, DAY_HEADER = 26, MIN_WEEK_HEIGHT = 110;

  function init() {
    const today = new Date();
    viewYear = today.getFullYear();
    viewMonth = today.getMonth();
    render();
  }

  function goToday() {
    const today = new Date();
    viewYear = today.getFullYear();
    viewMonth = today.getMonth();
    render();
  }

  function shiftMonth(delta) {
    viewMonth += delta;
    while (viewMonth < 0) { viewMonth += 12; viewYear--; }
    while (viewMonth > 11) { viewMonth -= 12; viewYear++; }
    render();
  }

  function startOfWeekMonday(date) {
    const d = new Date(date);
    const day = (d.getDay() + 6) % 7; // 0 = Monday
    d.setDate(d.getDate() - day);
    return d;
  }

  function buildWeeks(year, month) {
    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth = new Date(year, month + 1, 0);
    const gridStart = startOfWeekMonday(firstOfMonth);
    const gridEndBase = new Date(lastOfMonth);
    const trailing = (7 - ((gridEndBase.getDay() + 6) % 7) - 1);
    const gridEnd = new Date(lastOfMonth);
    gridEnd.setDate(gridEnd.getDate() + trailing);

    const weeks = [];
    let cursor = new Date(gridStart);
    while (cursor <= gridEnd) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        week.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push(week);
    }
    return weeks;
  }

  function getVisibleTournaments() {
    let list = DB.tournaments.all();
    if (filterCategory) list = list.filter(t => t.categoryId === filterCategory);
    if (!Auth.getCurrentUser()) return [];
    return list.filter(t => !t.categoryId || Auth.canSeeCategory(t.categoryId));
  }

  function colorHex(colorId) {
    const c = DB.colors.all().find(c => c.id === colorId);
    return c ? c.hex : '#2D6CDF';
  }

  function assignLanesForWeek(weekStart, weekEnd, events) {
    const overlapping = events.filter(e => Utils.fromISODate(e.startDate) <= weekEnd && Utils.fromISODate(e.endDate) >= weekStart);
    overlapping.sort((a, b) => {
      if (a.startDate !== b.startDate) return a.startDate < b.startDate ? -1 : 1;
      return Utils.diffDaysISO(a.startDate, a.endDate) > Utils.diffDaysISO(b.startDate, b.endDate) ? -1 : 1;
    });
    const laneEndCol = []; // laneEndCol[lane] = last column index (0-6) occupied within week
    const placed = [];

    overlapping.forEach(ev => {
      const evStart = Utils.fromISODate(ev.startDate);
      const evEnd = Utils.fromISODate(ev.endDate);
      const startCol = Math.max(0, Math.round((evStart - weekStart) / 86400000));
      const endCol = Math.min(6, Math.round((evEnd - weekStart) / 86400000));
      if (endCol < 0 || startCol > 6) return;

      // Sin limite de filas: se muestran todos los torneos del dia
      let lane = laneEndCol.findIndex(end => end < startCol);
      if (lane === -1) lane = laneEndCol.length;
      laneEndCol[lane] = endCol;
      placed.push({ ev, lane, startCol, endCol, isStart: Utils.toISODate(evStart) === ev.startDate, continuesLeft: startCol === 0 && ev.startDate < Utils.toISODate(weekStart), continuesRight: endCol === 6 && ev.endDate > Utils.toISODate(weekEnd) });
    });

    return { placed, laneCount: laneEndCol.length };
  }

  function render() {
    const root = document.getElementById('view-calendar');
    if (!root) return;
    const user = Auth.getCurrentUser();
    const canEdit = Auth.can('canEditCalendar');
    const categories = DB.categories.all().slice().sort((a, b) => a.order - b.order).filter(c => Auth.canSeeCategory(c.id));
    const weeks = buildWeeks(viewYear, viewMonth);
    const events = getVisibleTournaments();
    const todayISO = Utils.toISODate(new Date());

    const yearOptions = [];
    for (let y = 2020; y <= 2036; y++) yearOptions.push(`<option value="${y}" ${y === viewYear ? 'selected' : ''}>${y}</option>`);

    root.innerHTML = `
      <div class="cal-toolbar">
        <div class="cal-toolbar-left">
          <button class="btn btn--icon" id="cal-prev" title="Mes anterior" aria-label="Mes anterior">&#8592;</button>
          <select id="cal-month-select" class="select">
            ${Utils.MONTHS.map((m, i) => `<option value="${i}" ${i === viewMonth ? 'selected' : ''}>${m}</option>`).join('')}
          </select>
          <select id="cal-year-select" class="select">${yearOptions.join('')}</select>
          <button class="btn btn--icon" id="cal-next" title="Mes siguiente" aria-label="Mes siguiente">&#8594;</button>
          <button class="btn btn--ghost" id="cal-today">Hoy</button>
        </div>
        <div class="cal-toolbar-right">
          <select id="cal-filter-category" class="select">
            <option value="">Todas las categorías</option>
            ${categories.map(c => `<option value="${c.id}" ${c.id === filterCategory ? 'selected' : ''}>${Utils.escapeHtml(c.name)}</option>`).join('')}
          </select>
          ${canEdit ? `<button class="btn btn--primary" id="cal-new-event">+ Nuevo torneo</button>` : ''}
        </div>
      </div>
      <div class="cal-weekdays">
        ${Utils.WEEKDAYS.map(w => `<div class="cal-weekday">${w}</div>`).join('')}
      </div>
      <div class="cal-grid" id="cal-grid"></div>
    `;

    const grid = root.querySelector('#cal-grid');
    weeks.forEach(week => {
      const weekStart = week[0], weekEnd = week[6];
      const { placed, laneCount } = assignLanesForWeek(weekStart, weekEnd, events);

      const weekEl = Utils.el(`<div class="cal-week"></div>`);
      const bg = Utils.el(`<div class="cal-week-bg"></div>`);
      // La semana crece para que quepan todos los torneos
      bg.style.minHeight = Math.max(MIN_WEEK_HEIGHT, DAY_HEADER + laneCount * (LANE_HEIGHT + LANE_GAP) + LANE_GAP) + 'px';
      week.forEach(day => {
        const iso = Utils.toISODate(day);
        const inMonth = day.getMonth() === viewMonth;
        const isToday = iso === todayISO;
        const dayEl = Utils.el(`
          <div class="cal-day ${inMonth ? '' : 'cal-day--muted'} ${isToday ? 'cal-day--today' : ''}" data-date="${iso}">
            <span class="cal-day-num">${day.getDate()}</span>
          </div>
        `);
        if (canEdit) dayEl.addEventListener('click', () => openTournamentForm({ startDate: iso, endDate: iso }));
        bg.appendChild(dayEl);
      });
      weekEl.appendChild(bg);

      const overlay = Utils.el(`<div class="cal-week-overlay"></div>`);
      placed.forEach(({ ev, lane, startCol, endCol, continuesLeft, continuesRight }) => {
        const bar = Utils.el(`
          <div class="cal-event ${continuesLeft ? 'cal-event--open-left' : ''} ${continuesRight ? 'cal-event--open-right' : ''}"
               style="grid-column:${startCol + 1} / ${endCol + 2}; grid-row:${lane + 1}; background:${colorHex(ev.colorId)};"
               title="${Utils.escapeHtml(ev.name)}">
            ${Utils.escapeHtml(ev.name)}
          </div>
        `);
        bar.addEventListener('click', (e) => { e.stopPropagation(); openTournamentDetail(ev.id); });
        overlay.appendChild(bar);
      });
      weekEl.appendChild(overlay);
      grid.appendChild(weekEl);
    });

    root.querySelector('#cal-prev').onclick = () => shiftMonth(-1);
    root.querySelector('#cal-next').onclick = () => shiftMonth(1);
    root.querySelector('#cal-today').onclick = () => goToday();
    root.querySelector('#cal-month-select').onchange = (e) => { viewMonth = Number(e.target.value); render(); };
    root.querySelector('#cal-year-select').onchange = (e) => { viewYear = Number(e.target.value); render(); };
    root.querySelector('#cal-filter-category').onchange = (e) => { filterCategory = e.target.value; render(); };
    const newBtn = root.querySelector('#cal-new-event');
    if (newBtn) newBtn.onclick = () => openTournamentForm({ startDate: todayISO, endDate: todayISO });
  }

  function openDayList(date) {
    const iso = Utils.toISODate(date);
    const dayEvents = getVisibleTournaments().filter(t => t.startDate <= iso && t.endDate >= iso);
    const node = Utils.el(`
      <div class="modal">
        <div class="modal-header">
          <h3>${Utils.escapeHtml(Utils.formatDisplayLong(iso))}</h3>
          <button class="modal-close" id="m-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="daylist">
            ${dayEvents.map(ev => `
              <button class="daylist-item" data-id="${ev.id}" style="border-left:4px solid ${colorHex(ev.colorId)}">
                ${Utils.escapeHtml(ev.name)}
              </button>
            `).join('') || '<p class="text-muted">Sin eventos.</p>'}
          </div>
        </div>
      </div>
    `);
    node.querySelector('#m-close').onclick = Utils.closeModal;
    node.querySelectorAll('.daylist-item').forEach(btn => {
      btn.onclick = () => openTournamentDetail(btn.dataset.id);
    });
    Utils.openModal(node);
  }

  function colorSwatchOptions(selected) {
    return DB.colors.all().map(c => `
      <option value="${c.id}" data-hex="${c.hex}" ${c.id === selected ? 'selected' : ''}>${Utils.escapeHtml(c.name)}</option>
    `).join('');
  }

  function categoryOptions(selected) {
    return `<option value="">Sin categoría</option>` + DB.categories.all().slice().sort((a, b) => a.order - b.order).map(c => `
      <option value="${c.id}" ${c.id === selected ? 'selected' : ''}>${Utils.escapeHtml(c.name)}</option>
    `).join('');
  }

  function openTournamentForm(prefill, existing) {
    const isEdit = !!existing;
    const t = existing || {
      id: null, name: '', startDate: prefill.startDate, endDate: prefill.endDate,
      colorId: DB.colors.all()[0]?.id, categoryId: '', type: 'torneo', location: '', description: '', comments: [], teamIds: []
    };
    const allTeams = DB.teams.all();
    const node = Utils.el(`
      <div class="modal">
        <div class="modal-header">
          <h3>${isEdit ? 'Editar torneo' : 'Nuevo torneo / evento'}</h3>
          <button class="modal-close" id="m-close">&times;</button>
        </div>
        <div class="modal-body">
          <form id="tour-form" class="form-grid">
            <label class="field field--full">
              <span>Nombre del torneo *</span>
              <input required type="text" name="name" value="${Utils.escapeHtml(t.name)}" placeholder="Ej. Torneo Ciudad de Madrid">
            </label>
            <label class="field">
              <span>Fecha inicio *</span>
              <input required type="date" name="startDate" value="${t.startDate}">
            </label>
            <label class="field">
              <span>Fecha fin *</span>
              <input required type="date" name="endDate" value="${t.endDate}">
            </label>
            <label class="field">
              <span>Tipo</span>
              <select name="type">
                <option value="torneo" ${t.type === 'torneo' ? 'selected' : ''}>Torneo</option>
                <option value="evento" ${t.type === 'evento' ? 'selected' : ''}>Evento / marca de calendario</option>
                <option value="concentracion" ${t.type === 'concentracion' ? 'selected' : ''}>Concentración</option>
                <option value="viaje" ${t.type === 'viaje' ? 'selected' : ''}>Viaje / desplazamiento</option>
              </select>
            </label>
            <label class="field">
              <span>Categoría</span>
              <select name="categoryId">${categoryOptions(t.categoryId)}</select>
            </label>
            <label class="field">
              <span>Color</span>
              <select name="colorId">${colorSwatchOptions(t.colorId)}</select>
            </label>
            <label class="field">
              <span>Sede / lugar</span>
              <input type="text" name="location" value="${Utils.escapeHtml(t.location || '')}" placeholder="Ciudad, instalación...">
            </label>
            <label class="field field--full">
              <span>Descripción y notas</span>
              <textarea name="description" rows="4" placeholder="Horarios, formato de competición, observaciones de scouting...">${Utils.escapeHtml(t.description || '')}</textarea>
            </label>
            <div class="field field--full">
              <span>Equipos participantes</span>
              ${allTeams.length ? `
                <div class="team-picker">
                  ${allTeams.map(team => `
                    <label class="field field--checkbox team-picker-item">
                      <input type="checkbox" class="tour-team" value="${team.id}" ${(t.teamIds || []).includes(team.id) ? 'checked' : ''}>
                      <span>${Utils.escapeHtml(team.name)}</span>
                    </label>
                  `).join('')}
                </div>
              ` : `<p class="text-muted-sm">Todavía no has creado ningún equipo en el apartado "Equipos". Crea equipos allí para poder asociarlos a los torneos.</p>`}
            </div>
          </form>
        </div>
        <div class="modal-footer">
          ${isEdit ? `<button class="btn btn--danger" id="tour-delete">Eliminar</button>` : '<span></span>'}
          <div>
            <button class="btn btn--ghost" id="tour-cancel">Cancelar</button>
            <button class="btn btn--primary" id="tour-save">Guardar</button>
          </div>
        </div>
      </div>
    `);

    node.querySelector('#m-close').onclick = Utils.closeModal;
    node.querySelector('#tour-cancel').onclick = Utils.closeModal;

    node.querySelector('#tour-save').onclick = () => {
      const form = node.querySelector('#tour-form');
      if (!form.reportValidity()) return;
      const fd = new FormData(form);
      const startDate = fd.get('startDate');
      const endDate = fd.get('endDate');
      if (endDate < startDate) { Utils.toast('La fecha fin no puede ser anterior a la de inicio.', 'error'); return; }
      const record = {
        id: t.id || DB.uid('tour'),
        name: fd.get('name').trim(),
        startDate, endDate,
        type: fd.get('type'),
        categoryId: fd.get('categoryId'),
        colorId: fd.get('colorId'),
        location: fd.get('location').trim(),
        description: fd.get('description').trim(),
        teamIds: Array.from(node.querySelectorAll('.tour-team:checked')).map(cb => cb.value),
        comments: t.comments || [],
        createdBy: t.createdBy || Auth.getCurrentUser().username,
        createdAt: t.createdAt || new Date().toISOString()
      };
      DB.tournaments.upsert(record);
      Utils.closeModal();
      Utils.toast(isEdit ? 'Torneo actualizado.' : 'Torneo creado.', 'success');
      render();
    };

    const delBtn = node.querySelector('#tour-delete');
    if (delBtn) {
      delBtn.onclick = async () => {
        const ok = await Utils.confirmDialog(`¿Eliminar "${t.name}"? Esta acción no se puede deshacer.`);
        if (ok) {
          DB.tournaments.remove(t.id);
          Utils.toast('Torneo eliminado.', 'success');
          render();
        }
      };
    }

    Utils.openModal(node);
  }

  function openTournamentDetail(id) {
    const t = DB.tournaments.getById(id);
    if (!t) return;
    const canEdit = Auth.can('canEditCalendar');
    const cat = DB.categories.getById(t.categoryId);
    const days = Utils.diffDaysISO(t.startDate, t.endDate) + 1;
    const user = Auth.getCurrentUser();

    const node = Utils.el(`
      <div class="modal">
        <div class="modal-header" style="border-left:6px solid ${colorHex(t.colorId)}">
          <h3>${Utils.escapeHtml(t.name)}</h3>
          <button class="modal-close" id="m-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="detail-meta">
            <span class="badge" style="background:${colorHex(t.colorId)}">${t.type}</span>
            ${cat ? `<span class="badge badge--outline">${Utils.escapeHtml(cat.name)}</span>` : ''}
            <span class="text-muted">${days} día${days > 1 ? 's' : ''}</span>
          </div>
          <p><strong>Fechas:</strong> ${Utils.formatDisplayLong(t.startDate)}${t.startDate !== t.endDate ? ' &rarr; ' + Utils.formatDisplayLong(t.endDate) : ''}</p>
          ${t.location ? `<p><strong>Sede:</strong> ${Utils.escapeHtml(t.location)}</p>` : ''}
          <p>${Utils.escapeHtml(t.description) || '<span class="text-muted">Sin descripción.</span>'}</p>

          ${(t.teamIds || []).length ? `
            <p><strong>Equipos participantes:</strong></p>
            <div class="team-chips">
              ${t.teamIds.map(id => {
                const team = DB.teams.getById(id);
                return team ? `<button type="button" class="team-chip" data-team="${team.id}">${Utils.escapeHtml(team.name)}</button>` : '';
              }).join('')}
            </div>
          ` : ''}

          <hr>
          <h4>Comentarios</h4>
          <div class="comments-list" id="comments-list">
            ${(t.comments || []).map(c => `
              <div class="comment">
                <div class="comment-avatar">${Utils.initials(c.author)}</div>
                <div>
                  <div class="comment-meta"><strong>${Utils.escapeHtml(c.author)}</strong> <span class="text-muted">${new Date(c.date).toLocaleString('es-ES')}</span></div>
                  <div>${Utils.escapeHtml(c.text)}</div>
                </div>
              </div>
            `).join('') || '<p class="text-muted">Aún no hay comentarios.</p>'}
          </div>
          <form id="comment-form" class="comment-form">
            <input type="text" name="text" placeholder="Añadir un comentario..." required>
            <button class="btn btn--primary" type="submit">Enviar</button>
          </form>
        </div>
        <div class="modal-footer">
          ${canEdit ? `<button class="btn btn--danger" id="det-delete">Eliminar</button>` : '<span></span>'}
          <div>
            <button class="btn btn--ghost" id="m-close2">Cerrar</button>
            ${canEdit ? `<button class="btn btn--primary" id="det-edit">Editar</button>` : ''}
          </div>
        </div>
      </div>
    `);

    node.querySelector('#m-close').onclick = Utils.closeModal;
    node.querySelector('#m-close2').onclick = Utils.closeModal;
    node.querySelectorAll('.team-chip').forEach(chip => chip.onclick = () => { Utils.closeModal(); Teams.selectTeam(chip.dataset.team); });
    const editBtn = node.querySelector('#det-edit');
    if (editBtn) editBtn.onclick = () => openTournamentForm(null, t);
    const delBtn = node.querySelector('#det-delete');
    if (delBtn) delBtn.onclick = async () => {
      const ok = await Utils.confirmDialog(`¿Eliminar "${t.name}"?`);
      if (ok) { DB.tournaments.remove(t.id); Utils.toast('Torneo eliminado.', 'success'); Utils.closeModal(); render(); }
    };
    node.querySelector('#comment-form').onsubmit = (e) => {
      e.preventDefault();
      const input = e.target.text;
      const text = input.value.trim();
      if (!text) return;
      t.comments = t.comments || [];
      t.comments.push({ id: DB.uid('cmt'), author: user.username, text, date: new Date().toISOString() });
      DB.tournaments.upsert(t);
      input.value = '';
      openTournamentDetail(id);
    };

    Utils.openModal(node);
  }

  return { init, render, openTournamentForm, openTournamentDetail };
})();
