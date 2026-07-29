/* ScoutingManager - Informes: ficha de observacion de partido (scouting report) */

const Reports = (() => {

  const GROUPS = [
    { key: 'technique', title: 'Con balón — Aspectos técnicos', emoji: '🟡', color: 'var(--color-accent)', items: [
      ['primerToque', 'Primer toque / Control'],
      ['paseCorto', 'Pase corto y preciso'],
      ['paseLargo', 'Pase largo / Cambio de orientación'],
      ['regate', 'Regate / 1 contra 1'],
      ['remate', 'Remate / Definición'],
      ['juegoAereo', 'Juego aéreo'],
      ['piernaNoDominante', 'Uso de pierna no dominante']
    ]},
    { key: 'tactics', title: 'Sin balón — Comprensión del juego', emoji: '🔵', color: 'var(--color-primary)', items: [
      ['posicionamientoAtaque', 'Posicionamiento (ataque)'],
      ['desmarques', 'Desmarques / Movimientos para recibir'],
      ['posicionamientoDefensa', 'Posicionamiento (defensa)'],
      ['pressing', 'Pressing y trabajo defensivo'],
      ['transiciones', 'Transiciones (reacción al cambio de fase)'],
      ['tomaDecisiones', 'Toma de decisiones bajo presión'],
      ['lecturaJuego', 'Lectura del juego / Visión']
    ]},
    { key: 'physical', title: 'Físico — Capacidades atléticas', emoji: '🔴', color: 'var(--skill-red)', items: [
      ['velocidadPunta', 'Velocidad punta'],
      ['aceleracion', 'Aceleración / Explosividad'],
      ['resistencia', 'Resistencia (mantiene nivel todo el partido)'],
      ['fuerza', 'Fuerza / Duelos físicos'],
      ['agilidad', 'Agilidad y coordinación']
    ]},
    { key: 'attitude', title: 'Actitud — Perfil mental y comportamiento', emoji: '🟢', color: 'var(--skill-green)', items: [
      ['actitud', 'Actitud / Ganas de implicarse'],
      ['respuestaError', 'Respuesta ante el error (resiliencia)'],
      ['comunicacion', 'Comunicación con compañeros'],
      ['liderazgo', 'Liderazgo en el campo'],
      ['concentracion', 'Concentración a lo largo del partido'],
      ['respeto', 'Respeto (árbitro, rivales, compañeros)']
    ]}
  ];
  const GROUP_LABELS = { technique: 'Con balón', tactics: 'Sin balón', physical: 'Físico', attitude: 'Actitud' };

  const CONDITIONS = ['Buenas', 'Césped malo', 'Lluvia', 'Viento fuerte'];

  const RECOMMENDATIONS = [
    { key: 'captar', emoji: '✅', label: 'Captar / invitar a prueba', desc: 'Perfil muy interesante, actuar pronto', color: 'var(--skill-green)' },
    { key: 'seguir', emoji: '👁️', label: 'Seguir observando', desc: 'Merece al menos 1-2 partidos más', color: 'var(--skill-yellow)' },
    { key: 'espera', emoji: '⏸️', label: 'En espera', desc: 'Tiene potencial pero no es el momento (edad, nivel...)', color: 'var(--color-warn)' },
    { key: 'descartar', emoji: '❌', label: 'Descartar', desc: 'No cumple el perfil del club actualmente', color: 'var(--skill-red)' }
  ];

  function scoreColor5(v) {
    if (v >= 5) return 'var(--skill-purple)';
    if (v >= 4) return 'var(--skill-green)';
    if (v >= 3) return 'var(--skill-yellow)';
    if (v >= 2) return 'var(--color-warn)';
    return 'var(--skill-red)';
  }

  function blankReport() {
    const ratings = {};
    GROUPS.forEach(g => { ratings[g.key] = {}; g.items.forEach(([key]) => { ratings[g.key][key] = 3; }); });
    return {
      id: null,
      linkedPlayerId: '',
      match: { date: Utils.toISODate(new Date()), competition: '', homeTeam: '', awayTeam: '', result: '', venue: '', conditions: [], scout: Auth.getCurrentUser()?.username || '' },
      player: { name: '', ageInfo: '', club: '', position: '', side: 'local', number: '', foot: 'derecha', height: '', minutes: '' },
      ratings,
      keyMoments: [],
      strengths: ['', '', ''],
      concerns: ['', ''],
      fitPhilosophy: '',
      alerts: '',
      recommendation: '',
      nextStep: '',
      createdBy: Auth.getCurrentUser()?.username || '',
      createdAt: new Date().toISOString()
    };
  }

  function groupAverage(report, groupKey) {
    const vals = Object.values(report.ratings[groupKey] || {});
    if (!vals.length) return 0;
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
  }

  function totalScore(report) {
    return Math.round(GROUPS.reduce((sum, g) => sum + groupAverage(report, g.key), 0) * 10) / 10;
  }

  function recommendationInfo(key) {
    return RECOMMENDATIONS.find(r => r.key === key) || null;
  }

  // ---------------------------------------------------------------- LIST
  function init() { render(); }

  function render() {
    const root = document.getElementById('view-informes');
    if (!root) return;
    const canEdit = Auth.can('canEditScouting');
    const reports = DB.reports.all().slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    root.innerHTML = `
      <div class="players-header">
        <div>
          <h2>Informes de scouting</h2>
          <p class="text-muted-sm">Fichas de observación de partido, con valoración técnica, táctica, física y de actitud.</p>
        </div>
        ${canEdit ? `<button class="btn btn--primary" id="report-add">+ Nuevo informe</button>` : ''}
      </div>
      <div class="report-grid">
        ${reports.map(r => reportCardHtml(r)).join('') || `
          <div class="placeholder-view" style="grid-column:1/-1;">
            <div class="placeholder-icon">📄</div>
            <h3>Todavía no hay informes</h3>
            <p class="text-muted-sm">Crea tu primera ficha de observación de partido.</p>
          </div>
        `}
      </div>
    `;

    const addBtn = root.querySelector('#report-add');
    if (addBtn) addBtn.onclick = () => openForm(null);
    root.querySelectorAll('.report-card').forEach(card => card.onclick = () => openDetail(card.dataset.id));
  }

  function reportCardHtml(r) {
    const total = totalScore(r);
    const rec = recommendationInfo(r.recommendation);
    const playerName = r.player.name || 'Jugador sin nombre';
    return `
      <button class="report-card" data-id="${r.id}">
        <div class="report-card-top">
          <span class="report-total" style="background:${scoreColor5(total / 4)}">${total}<small>/20</small></span>
          ${rec ? `<span class="badge report-rec" style="background:${rec.color}">${rec.emoji} ${rec.label}</span>` : '<span class="badge badge--outline">Sin recomendación</span>'}
        </div>
        <h3 class="report-card-name">${Utils.escapeHtml(playerName)}</h3>
        <p class="text-muted-sm">${Utils.escapeHtml(r.player.club || 'Club no indicado')} · ${Utils.escapeHtml(r.player.position || 'Posición no indicada')}</p>
        <p class="text-muted-sm">${Utils.escapeHtml(r.match.homeTeam || '?')} vs ${Utils.escapeHtml(r.match.awayTeam || '?')}${r.match.date ? ' · ' + Utils.formatDisplay(r.match.date) : ''}</p>
      </button>
    `;
  }

  // ---------------------------------------------------------------- DETAIL
  function openDetail(id) {
    const r = DB.reports.getById(id);
    if (!r) return;
    const canEdit = Auth.can('canEditScouting');
    const total = totalScore(r);
    const rec = recommendationInfo(r.recommendation);

    const node = Utils.el(`
      <div class="modal modal--xl">
        <div class="modal-header">
          <h3>📋 Informe — ${Utils.escapeHtml(r.player.name || 'Jugador sin nombre')}</h3>
          <button class="modal-close" id="m-close">&times;</button>
        </div>
        <div class="modal-body report-doc" id="report-doc">
          ${reportDocHtml(r, total, rec)}
        </div>
        <div class="modal-footer">
          ${canEdit ? `<button class="btn btn--danger" id="rep-delete">Eliminar</button>` : '<span></span>'}
          <div>
            <button class="btn btn--ghost" id="rep-print">🖨️ Imprimir</button>
            <button class="btn btn--ghost" id="m-close2">Cerrar</button>
            ${canEdit ? `<button class="btn btn--primary" id="rep-edit">Editar</button>` : ''}
          </div>
        </div>
      </div>
    `);
    node.querySelector('#m-close').onclick = Utils.closeModal;
    node.querySelector('#m-close2').onclick = Utils.closeModal;
    node.querySelector('#rep-print').onclick = () => window.print();
    const editBtn = node.querySelector('#rep-edit');
    if (editBtn) editBtn.onclick = () => openForm(r);
    const delBtn = node.querySelector('#rep-delete');
    if (delBtn) delBtn.onclick = async () => {
      const ok = await Utils.confirmDialog(`¿Eliminar el informe de "${r.player.name || 'este jugador'}"?`);
      if (ok) { DB.reports.remove(r.id); Utils.closeModal(); Utils.toast('Informe eliminado.', 'success'); render(); }
    };
    Utils.openModal(node);
  }

  function reportDocHtml(r, total, rec) {
    return `
      <section class="report-section">
        <h4>1. Datos del partido</h4>
        <div class="report-facts">
          <div><span>Fecha</span><strong>${r.match.date ? Utils.formatDisplay(r.match.date) : '—'}</strong></div>
          <div><span>Competición / Categoría</span><strong>${Utils.escapeHtml(r.match.competition) || '—'}</strong></div>
          <div><span>Equipo local</span><strong>${Utils.escapeHtml(r.match.homeTeam) || '—'}</strong></div>
          <div><span>Equipo visitante</span><strong>${Utils.escapeHtml(r.match.awayTeam) || '—'}</strong></div>
          <div><span>Resultado</span><strong>${Utils.escapeHtml(r.match.result) || '—'}</strong></div>
          <div><span>Estadio / Campo</span><strong>${Utils.escapeHtml(r.match.venue) || '—'}</strong></div>
          <div><span>Condiciones</span><strong>${(r.match.conditions || []).join(', ') || '—'}</strong></div>
          <div><span>Scout</span><strong>${Utils.escapeHtml(r.match.scout) || '—'}</strong></div>
        </div>
      </section>

      <section class="report-section">
        <h4>2. Jugador observado</h4>
        <div class="report-facts">
          <div><span>Nombre completo</span><strong>${Utils.escapeHtml(r.player.name) || '—'}</strong></div>
          <div><span>Fecha de nacimiento / Edad</span><strong>${Utils.escapeHtml(r.player.ageInfo) || '—'}</strong></div>
          <div><span>Club actual</span><strong>${Utils.escapeHtml(r.player.club) || '—'}</strong></div>
          <div><span>Posición jugada hoy</span><strong>${Utils.escapeHtml(r.player.position) || '—'}</strong></div>
          <div><span>Equipo</span><strong>${r.player.side === 'visitante' ? 'Visitante' : 'Local'}</strong></div>
          <div><span>Dorsal</span><strong>${Utils.escapeHtml(r.player.number) || '—'}</strong></div>
          <div><span>Pierna dominante</span><strong>${footSideLabel(r.player.foot)}</strong></div>
          <div><span>Altura aproximada</span><strong>${Utils.escapeHtml(r.player.height) || '—'}</strong></div>
          <div><span>Minutos jugados</span><strong>${Utils.escapeHtml(r.player.minutes) || '—'}</strong></div>
        </div>
      </section>

      <section class="report-section">
        <h4>3. Evaluación en el partido</h4>
        ${GROUPS.map(g => `
          <div class="report-group" style="border-left-color:${g.color}">
            <div class="report-group-head">
              <span>${g.emoji} ${g.title}</span>
              <span class="report-group-avg" style="background:${scoreColor5(groupAverage(r, g.key))}">${groupAverage(r, g.key)} / 5</span>
            </div>
            <div class="report-aspect-list">
              ${g.items.map(([key, label]) => `
                <div class="report-aspect">
                  <span>${label}</span>
                  <span class="rating-pip" style="background:${scoreColor5(r.ratings[g.key][key])}">${r.ratings[g.key][key]}</span>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </section>

      ${(r.keyMoments || []).length ? `
      <section class="report-section">
        <h4>4. Momentos clave del partido</h4>
        <table class="table">
          <thead><tr><th>Min.</th><th>Situación</th><th>Descripción</th><th>Valoración</th></tr></thead>
          <tbody>
            ${r.keyMoments.map(m => `
              <tr>
                <td>${Utils.escapeHtml(m.minute)}</td>
                <td>${Utils.escapeHtml(m.situation)}</td>
                <td>${Utils.escapeHtml(m.description)}</td>
                <td>${m.valoration === 'negative' ? '⚠️ Negativo' : '✅ Positivo'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </section>
      ` : ''}

      <section class="report-section">
        <h4>5. Resumen del scout</h4>
        <div class="report-summary-grid">
          <div>
            <h5>✅ Lo que más ha destacado</h5>
            <ul>${(r.strengths || []).filter(Boolean).map(s => `<li>${Utils.escapeHtml(s)}</li>`).join('') || '<li class="text-muted">—</li>'}</ul>
          </div>
          <div>
            <h5>⚠️ Necesita trabajar</h5>
            <ul>${(r.concerns || []).filter(Boolean).map(s => `<li>${Utils.escapeHtml(s)}</li>`).join('') || '<li class="text-muted">—</li>'}</ul>
          </div>
        </div>
        ${r.fitPhilosophy ? `<p><strong>🎯 ¿Encaja en nuestra filosofía?</strong><br>${Utils.escapeHtml(r.fitPhilosophy)}</p>` : ''}
        ${r.alerts ? `<p><strong>🚩 Alertas:</strong><br>${Utils.escapeHtml(r.alerts)}</p>` : ''}
      </section>

      <section class="report-section">
        <h4>6. Valoración global y recomendación</h4>
        <div class="report-scoreboard">
          ${GROUPS.map(g => `
            <div class="report-score-tile">
              <span>${GROUP_LABELS[g.key]}</span>
              <strong style="color:${scoreColor5(groupAverage(r, g.key))}">${groupAverage(r, g.key)}</strong>
              <small>/5</small>
            </div>
          `).join('')}
          <div class="report-score-tile report-score-tile--total">
            <span>TOTAL</span>
            <strong>${total}</strong>
            <small>/20</small>
          </div>
        </div>
        ${rec ? `
          <div class="report-recommendation" style="background:${rec.color}">
            <span class="report-recommendation-emoji">${rec.emoji}</span>
            <div><strong>${rec.label}</strong><br><span>${rec.desc}</span></div>
          </div>
        ` : '<p class="text-muted-sm">Sin recomendación definida.</p>'}
        ${r.nextStep ? `<p><strong>Siguiente paso:</strong> ${Utils.escapeHtml(r.nextStep)}</p>` : ''}
        <p class="text-muted-sm">Scout: ${Utils.escapeHtml(r.createdBy)} · Informe generado el ${new Date(r.createdAt).toLocaleDateString('es-ES')}</p>
      </section>
    `;
  }

  function footSideLabel(foot) {
    return foot === 'izquierda' ? 'Izquierda' : foot === 'ambas' ? 'Ambas' : 'Derecha';
  }

  // ---------------------------------------------------------------- FORM
  function openForm(existing) {
    const isEdit = !!existing;
    const r = existing ? JSON.parse(JSON.stringify(existing)) : blankReport();
    const players = DB.players.all().filter(p => Auth.canSeeCategory(p.categoryId));

    const node = Utils.el(`
      <div class="modal modal--xl">
        <div class="modal-header"><h3>${isEdit ? 'Editar informe' : 'Nuevo informe de scouting'}</h3><button class="modal-close" id="m-close">&times;</button></div>
        <div class="modal-body">
          <form id="report-form">

            <section class="report-form-section">
              <h4>1. Datos del partido</h4>
              <div class="form-grid">
                <label class="field"><span>Fecha</span><input type="date" name="m_date" value="${r.match.date}"></label>
                <label class="field"><span>Competición / Categoría</span><input type="text" name="m_competition" value="${Utils.escapeHtml(r.match.competition)}"></label>
                <label class="field"><span>Equipo local</span><input type="text" name="m_home" value="${Utils.escapeHtml(r.match.homeTeam)}"></label>
                <label class="field"><span>Equipo visitante</span><input type="text" name="m_away" value="${Utils.escapeHtml(r.match.awayTeam)}"></label>
                <label class="field"><span>Resultado</span><input type="text" name="m_result" placeholder="Ej. 2-1" value="${Utils.escapeHtml(r.match.result)}"></label>
                <label class="field"><span>Estadio / Campo</span><input type="text" name="m_venue" value="${Utils.escapeHtml(r.match.venue)}"></label>
                <label class="field"><span>Scout</span><input type="text" name="m_scout" value="${Utils.escapeHtml(r.match.scout)}"></label>
                <div class="field">
                  <span>Condiciones</span>
                  <div class="chip-select" id="conditions-select">
                    ${CONDITIONS.map(c => `<button type="button" class="chip-option ${r.match.conditions.includes(c) ? 'chip-option--active' : ''}" data-value="${c}">${c}</button>`).join('')}
                  </div>
                </div>
              </div>
            </section>

            <section class="report-form-section">
              <h4>2. Jugador observado</h4>
              ${players.length ? `
                <label class="field field--full">
                  <span>Vincular con un jugador ya registrado en Equipos (opcional)</span>
                  <select id="link-player">
                    <option value="">— Jugador externo / no registrado —</option>
                    ${players.map(p => `<option value="${p.id}" ${r.linkedPlayerId === p.id ? 'selected' : ''}>${Utils.escapeHtml(p.name)} — ${Utils.escapeHtml(DB.teams.getById(p.teamId)?.name || '')}</option>`).join('')}
                  </select>
                </label>
              ` : ''}
              <div class="form-grid">
                <label class="field field--full"><span>Nombre completo</span><input type="text" name="p_name" value="${Utils.escapeHtml(r.player.name)}"></label>
                <label class="field"><span>Fecha de nacimiento / Edad</span><input type="text" name="p_age" value="${Utils.escapeHtml(r.player.ageInfo)}"></label>
                <label class="field"><span>Club actual</span><input type="text" name="p_club" value="${Utils.escapeHtml(r.player.club)}"></label>
                <label class="field"><span>Posición jugada hoy</span><input type="text" name="p_position" value="${Utils.escapeHtml(r.player.position)}"></label>
                <label class="field"><span>Equipo</span>
                  <select name="p_side">
                    <option value="local" ${r.player.side === 'local' ? 'selected' : ''}>Local</option>
                    <option value="visitante" ${r.player.side === 'visitante' ? 'selected' : ''}>Visitante</option>
                  </select>
                </label>
                <label class="field"><span>Dorsal</span><input type="text" name="p_number" value="${Utils.escapeHtml(r.player.number)}"></label>
                <label class="field"><span>Pierna dominante</span>
                  <select name="p_foot">
                    <option value="derecha" ${r.player.foot === 'derecha' ? 'selected' : ''}>Derecha</option>
                    <option value="izquierda" ${r.player.foot === 'izquierda' ? 'selected' : ''}>Izquierda</option>
                    <option value="ambas" ${r.player.foot === 'ambas' ? 'selected' : ''}>Ambas</option>
                  </select>
                </label>
                <label class="field"><span>Altura aproximada</span><input type="text" name="p_height" placeholder="Ej. 1,68 m" value="${Utils.escapeHtml(r.player.height)}"></label>
                <label class="field"><span>Minutos jugados</span><input type="text" name="p_minutes" value="${Utils.escapeHtml(r.player.minutes)}"></label>
              </div>
            </section>

            <section class="report-form-section">
              <h4>3. Evaluación en el partido</h4>
              <p class="text-muted-sm">1 (muy por debajo del nivel) · 2 (por debajo) · 3 (en el nivel) · 4 (por encima) · 5 (destacado para su categoría)</p>
              <div id="scoreboard-live" class="report-scoreboard"></div>
              ${GROUPS.map(g => `
                <div class="report-group" style="border-left-color:${g.color}">
                  <div class="report-group-head"><span>${g.emoji} ${g.title}</span></div>
                  <div class="report-aspect-list">
                    ${g.items.map(([key, label]) => `
                      <div class="aspect-row" data-group="${g.key}" data-aspect="${key}">
                        <span class="aspect-label">${label}</span>
                        <div class="rating-picker">
                          ${[1,2,3,4,5].map(v => `<button type="button" class="rating-btn ${r.ratings[g.key][key] === v ? 'rating-btn--active' : ''}" data-value="${v}" style="${r.ratings[g.key][key] === v ? `background:${scoreColor5(v)};border-color:transparent;` : ''}">${v}</button>`).join('')}
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </section>

            <section class="report-form-section">
              <h4>4. Momentos clave del partido</h4>
              <div id="moments-rows">${momentRowsHtml(r.keyMoments)}</div>
              <button type="button" class="btn btn--ghost btn--sm" id="moment-add">+ Añadir momento clave</button>
            </section>

            <section class="report-form-section">
              <h4>5. Resumen del scout</h4>
              <div class="report-summary-grid">
                <div>
                  <h5>✅ Puntos fuertes</h5>
                  <div id="strengths-rows">${textListRowsHtml(r.strengths, 'strength')}</div>
                  <button type="button" class="btn btn--ghost btn--sm" data-addlist="strength">+ Añadir</button>
                </div>
                <div>
                  <h5>⚠️ A mejorar</h5>
                  <div id="concerns-rows">${textListRowsHtml(r.concerns, 'concern')}</div>
                  <button type="button" class="btn btn--ghost btn--sm" data-addlist="concern">+ Añadir</button>
                </div>
              </div>
              <label class="field field--full"><span>🎯 ¿Encaja en nuestra filosofía / sistema de juego?</span><textarea name="fitPhilosophy" rows="2">${Utils.escapeHtml(r.fitPhilosophy)}</textarea></label>
              <label class="field field--full"><span>🚩 Alertas a tener en cuenta</span><textarea name="alerts" rows="2">${Utils.escapeHtml(r.alerts)}</textarea></label>
            </section>

            <section class="report-form-section">
              <h4>6. Recomendación final</h4>
              <div class="recommendation-select" id="recommendation-select">
                ${RECOMMENDATIONS.map(rec => `
                  <button type="button" class="recommendation-option ${r.recommendation === rec.key ? 'recommendation-option--active' : ''}" data-value="${rec.key}" style="${r.recommendation === rec.key ? `border-color:${rec.color};` : ''}">
                    <span class="recommendation-emoji">${rec.emoji}</span>
                    <span><strong>${rec.label}</strong><br><span class="text-muted-sm">${rec.desc}</span></span>
                  </button>
                `).join('')}
              </div>
              <label class="field field--full"><span>Siguiente paso concreto</span><input type="text" name="nextStep" value="${Utils.escapeHtml(r.nextStep)}"></label>
            </section>
          </form>
        </div>
        <div class="modal-footer">
          ${isEdit ? `<button class="btn btn--danger" id="rep-delete">Eliminar</button>` : '<span></span>'}
          <div><button class="btn btn--ghost" id="cancel">Cancelar</button><button class="btn btn--primary" id="save">Guardar informe</button></div>
        </div>
      </div>
    `);

    let recommendation = r.recommendation;

    function updateScoreboard() {
      const box = node.querySelector('#scoreboard-live');
      box.innerHTML = GROUPS.map(g => `
        <div class="report-score-tile">
          <span>${GROUP_LABELS[g.key]}</span>
          <strong style="color:${scoreColor5(groupAverage(r, g.key))}">${groupAverage(r, g.key)}</strong>
          <small>/5</small>
        </div>
      `).join('') + `
        <div class="report-score-tile report-score-tile--total">
          <span>TOTAL</span><strong>${totalScore(r)}</strong><small>/20</small>
        </div>
      `;
    }
    updateScoreboard();

    node.querySelectorAll('.aspect-row').forEach(row => {
      const group = row.dataset.group, aspect = row.dataset.aspect;
      row.querySelectorAll('.rating-btn').forEach(btn => {
        btn.onclick = () => {
          const v = Number(btn.dataset.value);
          r.ratings[group][aspect] = v;
          row.querySelectorAll('.rating-btn').forEach(b => {
            const active = Number(b.dataset.value) === v;
            b.classList.toggle('rating-btn--active', active);
            b.style.background = active ? scoreColor5(v) : '';
            b.style.borderColor = active ? 'transparent' : '';
          });
          updateScoreboard();
        };
      });
    });

    node.querySelectorAll('.chip-option').forEach(chip => {
      chip.onclick = () => {
        const v = chip.dataset.value;
        const idx = r.match.conditions.indexOf(v);
        if (idx >= 0) r.match.conditions.splice(idx, 1); else r.match.conditions.push(v);
        chip.classList.toggle('chip-option--active');
      };
    });

    node.querySelectorAll('.recommendation-option').forEach(btn => {
      btn.onclick = () => {
        recommendation = btn.dataset.value;
        const info = recommendationInfo(recommendation);
        node.querySelectorAll('.recommendation-option').forEach(b => { b.classList.remove('recommendation-option--active'); b.style.borderColor = ''; });
        btn.classList.add('recommendation-option--active');
        btn.style.borderColor = info.color;
      };
    });

    const linkSelect = node.querySelector('#link-player');
    if (linkSelect) linkSelect.onchange = () => {
      const p = DB.players.getById(linkSelect.value);
      if (!p) return;
      const team = DB.teams.getById(p.teamId);
      node.querySelector('[name="p_name"]').value = p.name;
      node.querySelector('[name="p_club"]').value = team?.name || '';
      node.querySelector('[name="p_position"]').value = p.position;
      node.querySelector('[name="p_foot"]').value = p.foot === 'zurdo' ? 'izquierda' : p.foot === 'diestro' ? 'derecha' : 'ambas';
      if (p.birthYear) node.querySelector('[name="p_age"]').value = `Año ${p.birthYear}`;
      if (p.height) node.querySelector('[name="p_height"]').value = `${p.height} cm`;
    };

    function bindMomentDel() { node.querySelectorAll('.moment-del').forEach(b => b.onclick = () => b.closest('.moment-row').remove()); }
    bindMomentDel();
    node.querySelector('#moment-add').onclick = () => {
      node.querySelector('#moments-rows').insertAdjacentHTML('beforeend', momentRowsHtml([{ minute: '', situation: '', description: '', valoration: 'positive' }]));
      bindMomentDel();
    };

    function bindListDel(container) { container.querySelectorAll('.textlist-del').forEach(b => b.onclick = () => b.closest('.textlist-row').remove()); }
    bindListDel(node.querySelector('#strengths-rows'));
    bindListDel(node.querySelector('#concerns-rows'));
    node.querySelectorAll('[data-addlist]').forEach(btn => btn.onclick = () => {
      const containerId = btn.dataset.addlist === 'strength' ? '#strengths-rows' : '#concerns-rows';
      const container = node.querySelector(containerId);
      container.insertAdjacentHTML('beforeend', textListRowsHtml(['']));
      bindListDel(container);
    });

    node.querySelector('#m-close').onclick = Utils.closeModal;
    node.querySelector('#cancel').onclick = Utils.closeModal;
    node.querySelector('#save').onclick = () => {
      const fd = new FormData(node.querySelector('#report-form'));
      const record = {
        id: r.id || DB.uid('report'),
        linkedPlayerId: linkSelect ? linkSelect.value : '',
        match: {
          date: fd.get('m_date'), competition: fd.get('m_competition').trim(), homeTeam: fd.get('m_home').trim(),
          awayTeam: fd.get('m_away').trim(), result: fd.get('m_result').trim(), venue: fd.get('m_venue').trim(),
          conditions: Array.from(node.querySelectorAll('.chip-option--active')).map(c => c.dataset.value),
          scout: fd.get('m_scout').trim()
        },
        player: {
          name: fd.get('p_name').trim(), ageInfo: fd.get('p_age').trim(), club: fd.get('p_club').trim(),
          position: fd.get('p_position').trim(), side: fd.get('p_side'), number: fd.get('p_number').trim(),
          foot: fd.get('p_foot'), height: fd.get('p_height').trim(), minutes: fd.get('p_minutes').trim()
        },
        ratings: r.ratings,
        keyMoments: Array.from(node.querySelectorAll('.moment-row')).map(row => ({
          minute: row.querySelector('.mm-min').value.trim(),
          situation: row.querySelector('.mm-sit').value.trim(),
          description: row.querySelector('.mm-desc').value.trim(),
          valoration: row.querySelector('.mm-val').value
        })).filter(m => m.minute || m.situation || m.description),
        strengths: Array.from(node.querySelectorAll('#strengths-rows .textlist-input')).map(i => i.value.trim()).filter(Boolean),
        concerns: Array.from(node.querySelectorAll('#concerns-rows .textlist-input')).map(i => i.value.trim()).filter(Boolean),
        fitPhilosophy: fd.get('fitPhilosophy').trim(),
        alerts: fd.get('alerts').trim(),
        recommendation,
        nextStep: fd.get('nextStep').trim(),
        createdBy: r.createdBy || Auth.getCurrentUser().username,
        createdAt: r.createdAt || new Date().toISOString()
      };
      DB.reports.upsert(record);
      Utils.closeModal();
      Utils.toast(isEdit ? 'Informe actualizado.' : 'Informe creado.', 'success');
      render();
    };
    const delBtn = node.querySelector('#rep-delete');
    if (delBtn) delBtn.onclick = async () => {
      const ok = await Utils.confirmDialog('¿Eliminar este informe?');
      if (ok) { DB.reports.remove(r.id); Utils.closeModal(); Utils.toast('Informe eliminado.', 'success'); render(); }
    };

    Utils.openModal(node);
  }

  function momentRowsHtml(moments) {
    return (moments || []).map(m => `
      <div class="moment-row">
        <input type="text" class="input mm-min" placeholder="Min." value="${Utils.escapeHtml(m.minute)}">
        <input type="text" class="input mm-sit" placeholder="Situación" value="${Utils.escapeHtml(m.situation)}">
        <input type="text" class="input mm-desc" placeholder="Descripción de la acción" value="${Utils.escapeHtml(m.description)}">
        <select class="mm-val">
          <option value="positive" ${m.valoration !== 'negative' ? 'selected' : ''}>✅ Positivo</option>
          <option value="negative" ${m.valoration === 'negative' ? 'selected' : ''}>⚠️ Negativo</option>
        </select>
        <button type="button" class="btn btn--ghost btn--sm moment-del">✕</button>
      </div>
    `).join('');
  }

  function textListRowsHtml(items) {
    return (items || ['']).map(v => `
      <div class="textlist-row">
        <input type="text" class="input textlist-input" value="${Utils.escapeHtml(v)}">
        <button type="button" class="btn btn--ghost btn--sm textlist-del">✕</button>
      </div>
    `).join('');
  }

  return { init, render, openForm, openDetail };
})();
