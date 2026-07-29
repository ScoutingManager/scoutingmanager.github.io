/* JRVScoutingManager - UI compartida de jugadores (tarjeta, formulario, ficha con campo de posicion y radar de atributos) */

const PlayerUI = (() => {
  const POSITIONS = ['Portero', 'Lateral derecho', 'Lateral izquierdo', 'Central derecho', 'Central izquierdo',
    'Mediocentro defensivo', 'Mediocentro', 'Interior derecho', 'Interior izquierdo', 'Mediapunta',
    'Extremo derecho', 'Extremo izquierdo', 'Delantero centro', 'Segundo delantero'];

  const POSITION_COORDS = {
    'Portero': [50, 138],
    'Lateral derecho': [85, 112],
    'Lateral izquierdo': [15, 112],
    'Central derecho': [65, 118],
    'Central izquierdo': [35, 118],
    'Mediocentro defensivo': [50, 92],
    'Mediocentro': [50, 78],
    'Interior derecho': [70, 75],
    'Interior izquierdo': [30, 75],
    'Mediapunta': [50, 55],
    'Extremo derecho': [82, 40],
    'Extremo izquierdo': [18, 40],
    'Segundo delantero': [50, 35],
    'Delantero centro': [50, 18]
  };

  const SKILLS = [
    { key: 'technique', label: 'Técnica', short: 'Técnica' },
    { key: 'defense', label: 'Defensa', short: 'Defensa' },
    { key: 'speed', label: 'Velocidad', short: 'Velocidad' },
    { key: 'stamina', label: 'Cap. aeróbica', short: 'Aeróbica' },
    { key: 'attack', label: 'Cap. ataque', short: 'Ataque' }
  ];

  const NATIONALITY_FLAGS = {
    'España': 'ES', 'Portugal': 'PT', 'Francia': 'FR', 'Marruecos': 'MA', 'Argentina': 'AR', 'Brasil': 'BR',
    'Colombia': 'CO', 'Italia': 'IT', 'Alemania': 'DE', 'Países Bajos': 'NL', 'Inglaterra': 'GB',
    'Reino Unido': 'GB', 'Estados Unidos': 'US', 'México': 'MX', 'Venezuela': 'VE', 'Ecuador': 'EC',
    'República Dominicana': 'DO', 'Rumanía': 'RO', 'Senegal': 'SN', 'Guinea Ecuatorial': 'GQ', 'Uruguay': 'UY',
    'Bélgica': 'BE', 'Croacia': 'HR', 'Polonia': 'PL', 'Suecia': 'SE', 'Noruega': 'NO', 'Japón': 'JP',
    'Ghana': 'GH', 'Nigeria': 'NG', 'Chile': 'CL', 'Perú': 'PE', 'Paraguay': 'PY', 'Bolivia': 'BO'
  };
  const NATIONALITIES = Object.keys(NATIONALITY_FLAGS);

  function flagEmoji(nationality) {
    const code = NATIONALITY_FLAGS[(nationality || '').trim()];
    if (!code) return '🌐';
    return code.toUpperCase().replace(/./g, ch => String.fromCodePoint(127397 + ch.charCodeAt(0)));
  }

  function scoreColorVar(v) {
    if (v >= 9) return 'var(--skill-purple)';
    if (v >= 7) return 'var(--skill-green)';
    if (v >= 5) return 'var(--skill-yellow)';
    return 'var(--skill-red)';
  }

  function getSkills(p) {
    const s = p.skills || {};
    const out = {};
    SKILLS.forEach(sk => { out[sk.key] = Number.isFinite(s[sk.key]) ? s[sk.key] : 5; });
    return out;
  }

  function overallScore(p) {
    const s = getSkills(p);
    const vals = SKILLS.map(sk => s[sk.key]);
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
  }

  function skillBadgesHtml(p) {
    const s = getSkills(p);
    return `
      <div class="skill-badges">
        ${SKILLS.map(sk => `<span class="skill-badge" style="background:${scoreColorVar(s[sk.key])}">${sk.label}: ${s[sk.key]}</span>`).join('')}
      </div>
    `;
  }

  function skillEditGridHtml(p) {
    const s = getSkills(p);
    return `
      <div class="skill-edit-grid" id="skill-edit-grid">
        ${SKILLS.map(sk => `
          <div class="skill-edit-item">
            <span class="skill-edit-label">${sk.label}</span>
            <input type="number" class="skill-input" data-skill="${sk.key}" min="1" max="10" value="${s[sk.key]}">
            <span class="skill-chip" data-skill-chip="${sk.key}" style="background:${scoreColorVar(s[sk.key])}">${s[sk.key]}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  function pitchSVG(mainPos, secondaryPos) {
    const main = POSITION_COORDS[mainPos] || [50, 78];
    const sec = secondaryPos ? POSITION_COORDS[secondaryPos] : null;
    return `
      <svg viewBox="0 0 100 150" class="pitch-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="pitchGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--pitch-green-light)"/>
            <stop offset="100%" stop-color="var(--pitch-green-dark)"/>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="100" height="150" rx="6" fill="url(#pitchGrad)"/>
        ${[0,1,2,3,4].map(i => `<rect x="0" y="${i*30}" width="100" height="30" fill="#ffffff" opacity="${i%2===0?0.05:0}"/>`).join('')}
        <rect x="4" y="4" width="92" height="142" rx="3" fill="none" stroke="#ffffff" stroke-opacity=".85" stroke-width="1"/>
        <line x1="4" y1="75" x2="96" y2="75" stroke="#ffffff" stroke-opacity=".85" stroke-width="1"/>
        <circle cx="50" cy="75" r="11" fill="none" stroke="#ffffff" stroke-opacity=".85" stroke-width="1"/>
        <circle cx="50" cy="75" r="1" fill="#ffffff" fill-opacity=".85"/>
        <rect x="25" y="4" width="50" height="20" fill="none" stroke="#ffffff" stroke-opacity=".85" stroke-width="1"/>
        <rect x="38" y="4" width="24" height="8" fill="none" stroke="#ffffff" stroke-opacity=".85" stroke-width="1"/>
        <rect x="25" y="126" width="50" height="20" fill="none" stroke="#ffffff" stroke-opacity=".85" stroke-width="1"/>
        <rect x="38" y="138" width="24" height="8" fill="none" stroke="#ffffff" stroke-opacity=".85" stroke-width="1"/>
        ${sec ? `<circle cx="${sec[0]}" cy="${sec[1]}" r="5.5" fill="var(--color-surface)" fill-opacity=".55" stroke="var(--color-accent)" stroke-width="1" stroke-dasharray="2,1.5"/>` : ''}
        <circle cx="${main[0]}" cy="${main[1]}" r="7" fill="var(--color-accent)" stroke="#ffffff" stroke-width="1.4"/>
        <circle cx="${main[0]}" cy="${main[1]}" r="3" fill="#ffffff"/>
      </svg>
    `;
  }

  function radarSVG(p) {
    const s = getSkills(p);
    const W = 210, H = 148;
    const cx = W / 2, cy = 68, maxR = 38, labelR = maxR + 22;
    const n = SKILLS.length;
    const angleFor = (i) => (-90 + i * (360 / n)) * Math.PI / 180;
    const pointAt = (i, r) => [cx + r * Math.cos(angleFor(i)), cy + r * Math.sin(angleFor(i))];

    const gridPolys = [0.25, 0.5, 0.75, 1].map(frac => {
      const pts = SKILLS.map((sk, i) => pointAt(i, maxR * frac).join(',')).join(' ');
      return `<polygon points="${pts}" fill="none" stroke="#ffffff" stroke-opacity=".22" stroke-width="1"/>`;
    }).join('');

    const axisLines = SKILLS.map((sk, i) => {
      const [x, y] = pointAt(i, maxR);
      return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#ffffff" stroke-opacity=".22" stroke-width="1"/>`;
    }).join('');

    const valuePts = SKILLS.map((sk, i) => pointAt(i, (s[sk.key] / 10) * maxR).join(',')).join(' ');
    const valueDots = SKILLS.map((sk, i) => {
      const [x, y] = pointAt(i, (s[sk.key] / 10) * maxR);
      return `<circle cx="${x}" cy="${y}" r="3.2" fill="${scoreColorVar(s[sk.key])}" stroke="#fff" stroke-width="1"/>`;
    }).join('');

    const labels = SKILLS.map((sk, i) => {
      const [x, y] = pointAt(i, labelR);
      const cosA = Math.cos(angleFor(i));
      const anchor = Math.abs(cosA) < 0.3 ? 'middle' : (cosA > 0 ? 'start' : 'end');
      return `<text x="${x}" y="${y}" text-anchor="${anchor}" dominant-baseline="middle" font-size="9.5" font-weight="700" fill="var(--color-text)">${sk.short}</text>`;
    }).join('');

    return `
      <svg viewBox="0 0 ${W} ${H}" class="radar-svg" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="${W}" height="${H}" rx="12" fill="var(--color-surface-2)"/>
        ${gridPolys}
        ${axisLines}
        <polygon points="${valuePts}" fill="var(--color-primary)" fill-opacity=".32" stroke="var(--color-primary)" stroke-width="2"/>
        ${valueDots}
        ${labels}
      </svg>
    `;
  }

  function footLabel(foot) {
    return foot === 'zurdo' ? 'Zurdo' : foot === 'diestro' ? 'Diestro' : 'Ambidiestro';
  }

  function nationalityHtml(p) {
    if (!p.nationality) return '';
    return `<span class="badge badge--outline nationality-badge"><span class="flag">${flagEmoji(p.nationality)}</span> ${Utils.escapeHtml(p.nationality)}</span>`;
  }

  function avatarHtml(p, size) {
    if (p.photo) return `<img src="${p.photo}" class="player-photo" style="width:${size}px;height:${size}px" alt="${Utils.escapeHtml(p.name)}">`;
    return `<div class="player-avatar" style="width:${size}px;height:${size}px">${Utils.initials(p.name)}</div>`;
  }

  function cardHtml(p) {
    const overall = overallScore(p);
    return `
      <div class="player-card" data-id="${p.id}">
        ${p.favorite ? '<span class="player-fav">&#9733;</span>' : ''}
        <span class="overall-badge" style="background:${scoreColorVar(overall)}">${overall}</span>
        ${avatarHtml(p, 56)}
        <div class="player-name">${Utils.escapeHtml(p.name)}</div>
        <div class="player-position">${Utils.escapeHtml(p.position)}</div>
        <div class="player-tags">
          <span class="badge badge--outline">${footLabel(p.foot)}</span>
          <span class="badge badge--outline">${p.birthYear || '-'}</span>
          ${nationalityHtml(p)}
        </div>
        <div class="player-rating">${'★'.repeat(p.rating || 0)}${'☆'.repeat(5 - (p.rating || 0))}</div>
      </div>
    `;
  }

  function historyRowsHtml(history) {
    return (history || []).map((h) => `
      <div class="history-row">
        <input type="text" class="input h-team" placeholder="Equipo" value="${Utils.escapeHtml(h.team)}">
        <input type="text" class="input h-cat" placeholder="Categoría" value="${Utils.escapeHtml(h.category)}">
        <input type="text" class="input h-season" placeholder="Temporada" value="${Utils.escapeHtml(h.season)}">
        <button type="button" class="btn btn--ghost btn--sm h-del">✕</button>
      </div>
    `).join('');
  }

  function skillInputsHtml(p) {
    const s = getSkills(p);
    return SKILLS.map(sk => `
      <label class="field skill-field">
        <span>${sk.label} (1-10)</span>
        <div class="skill-input-row">
          <input type="number" class="skill-input" data-skill="${sk.key}" name="skill_${sk.key}" min="1" max="10" value="${s[sk.key]}">
          <span class="skill-swatch" data-skill-swatch="${sk.key}" style="background:${scoreColorVar(s[sk.key])}">${s[sk.key]}</span>
        </div>
      </label>
    `).join('');
  }

  function openForm(squadId, teamId, categoryId, existing, onSaved) {
    const isEdit = !!existing;
    const p = existing || { id: null, name: '', position: POSITIONS[0], secondaryPosition: '', foot: 'diestro', nationality: 'España', birthYear: new Date().getFullYear() - 12, height: '', weight: '', rating: 3, favorite: false, notes: '', photo: '', skills: {}, history: [] };
    const node = Utils.el(`
      <div class="modal modal--lg">
        <div class="modal-header"><h3>${isEdit ? 'Editar jugador' : 'Nuevo jugador'}</h3><button class="modal-close" id="m-close">&times;</button></div>
        <div class="modal-body">
          <form id="player-form" class="form-grid">
            <div class="field field--full photo-field">
              <span>Foto</span>
              <div class="photo-upload">
                <div id="photo-preview" class="photo-preview">${p.photo ? `<img src="${p.photo}">` : Utils.initials(p.name || '?')}</div>
                <input type="file" id="photo-input" accept="image/*">
              </div>
            </div>
            <label class="field field--full"><span>Nombre completo *</span><input required type="text" name="name" value="${Utils.escapeHtml(p.name)}"></label>
            <label class="field"><span>Posición principal *</span>
              <select name="position">${POSITIONS.map(pos => `<option ${pos === p.position ? 'selected' : ''}>${pos}</option>`).join('')}</select>
            </label>
            <label class="field"><span>Posición secundaria</span>
              <select name="secondaryPosition"><option value="">-</option>${POSITIONS.map(pos => `<option ${pos === p.secondaryPosition ? 'selected' : ''}>${pos}</option>`).join('')}</select>
            </label>
            <label class="field"><span>Pie dominante</span>
              <select name="foot">
                <option value="diestro" ${p.foot === 'diestro' ? 'selected' : ''}>Diestro</option>
                <option value="zurdo" ${p.foot === 'zurdo' ? 'selected' : ''}>Zurdo</option>
                <option value="ambidiestro" ${p.foot === 'ambidiestro' ? 'selected' : ''}>Ambidiestro</option>
              </select>
            </label>
            <label class="field"><span>Nacionalidad</span>
              <input type="text" name="nationality" list="nat-list" value="${Utils.escapeHtml(p.nationality || '')}">
              <datalist id="nat-list">${NATIONALITIES.map(n => `<option value="${n}">`).join('')}</datalist>
            </label>
            <label class="field"><span>Año de nacimiento</span><input type="number" name="birthYear" value="${p.birthYear}" min="1995" max="2025"></label>
            <label class="field"><span>Altura (cm)</span><input type="number" name="height" value="${p.height}"></label>
            <label class="field"><span>Peso (kg)</span><input type="number" name="weight" value="${p.weight}"></label>
            <label class="field"><span>Valoración scouting (1-5)</span><input type="number" name="rating" min="1" max="5" value="${p.rating}"></label>
            <label class="field field--checkbox"><input type="checkbox" name="favorite" ${p.favorite ? 'checked' : ''}> <span>Marcar como favorito / seguimiento</span></label>

            <div class="field field--full">
              <span>Puntuaciones de scouting</span>
              <p class="text-muted-sm" style="margin:.1rem 0 .6rem;">1-4 rojo · 5-6 amarillo · 7-8 verde · 9-10 morado</p>
              <div class="skills-grid">${skillInputsHtml(p)}</div>
            </div>

            <label class="field field--full"><span>Notas de scouting</span><textarea name="notes" rows="3">${Utils.escapeHtml(p.notes || '')}</textarea></label>

            <div class="field field--full">
              <span>Historial de equipos</span>
              <div id="history-rows">${historyRowsHtml(p.history)}</div>
              <button type="button" class="btn btn--ghost btn--sm" id="history-add">+ Añadir línea de historial</button>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          ${isEdit ? `<button class="btn btn--danger" id="player-delete">Eliminar</button>` : '<span></span>'}
          <div><button class="btn btn--ghost" id="cancel">Cancelar</button><button class="btn btn--primary" id="save">Guardar</button></div>
        </div>
      </div>
    `);

    node.querySelectorAll('.skill-input').forEach(input => {
      input.oninput = () => {
        let v = Math.max(1, Math.min(10, Number(input.value) || 1));
        const swatch = node.querySelector(`[data-skill-swatch="${input.dataset.skill}"]`);
        swatch.textContent = v;
        swatch.style.background = scoreColorVar(v);
      };
    });

    let photoData = p.photo || '';
    node.querySelector('#photo-input').onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        photoData = reader.result;
        node.querySelector('#photo-preview').innerHTML = `<img src="${photoData}">`;
      };
      reader.readAsDataURL(file);
    };

    function bindHistoryDel() {
      node.querySelectorAll('.h-del').forEach(b => b.onclick = () => b.closest('.history-row').remove());
    }
    bindHistoryDel();
    node.querySelector('#history-add').onclick = () => {
      node.querySelector('#history-rows').insertAdjacentHTML('beforeend', historyRowsHtml([{ team: '', category: '', season: '' }]));
      bindHistoryDel();
    };

    node.querySelector('#m-close').onclick = Utils.closeModal;
    node.querySelector('#cancel').onclick = Utils.closeModal;
    node.querySelector('#save').onclick = () => {
      const form = node.querySelector('#player-form');
      if (!form.reportValidity()) return;
      const fd = new FormData(form);
      const history = Array.from(node.querySelectorAll('.history-row')).map(row => ({
        team: row.querySelector('.h-team').value.trim(),
        category: row.querySelector('.h-cat').value.trim(),
        season: row.querySelector('.h-season').value.trim()
      })).filter(h => h.team || h.category || h.season);

      const skills = {};
      SKILLS.forEach(sk => { skills[sk.key] = Math.max(1, Math.min(10, Number(fd.get('skill_' + sk.key)) || 5)); });

      const record = {
        id: p.id || DB.uid('player'),
        squadId, teamId, categoryId,
        name: fd.get('name').trim(),
        position: fd.get('position'),
        secondaryPosition: fd.get('secondaryPosition'),
        foot: fd.get('foot'),
        nationality: fd.get('nationality').trim(),
        birthYear: Number(fd.get('birthYear')) || '',
        height: Number(fd.get('height')) || '',
        weight: Number(fd.get('weight')) || '',
        rating: Number(fd.get('rating')) || 3,
        favorite: fd.get('favorite') === 'on',
        notes: fd.get('notes').trim(),
        photo: photoData,
        skills,
        history
      };
      DB.players.upsert(record);
      Utils.closeModal();
      Utils.toast(isEdit ? 'Jugador actualizado.' : 'Jugador creado.', 'success');
      if (onSaved) onSaved(record);
    };
    const delBtn = node.querySelector('#player-delete');
    if (delBtn) delBtn.onclick = async () => {
      const ok = await Utils.confirmDialog(`¿Eliminar a ${p.name}?`);
      if (ok) { DB.players.remove(p.id); Utils.closeModal(); Utils.toast('Jugador eliminado.', 'success'); if (onSaved) onSaved(null); }
    };
    Utils.openModal(node);
  }

  function openDetail(id, opts) {
    opts = opts || {};
    const p = DB.players.getById(id);
    if (!p) return;
    const canEdit = Auth.can('canEditScouting');
    const team = DB.teams.getById(p.teamId);
    const squad = DB.squads.getById(p.squadId);
    const cat = DB.categories.getById(p.categoryId);
    const overall = overallScore(p);
    const node = Utils.el(`
      <div class="modal modal--xl">
        <div class="modal-header"><h3>${Utils.escapeHtml(p.name)} ${p.favorite ? '&#9733;' : ''}</h3><button class="modal-close" id="m-close">&times;</button></div>
        <div class="modal-body">
          <div class="player-detail-grid">
            <div class="player-detail-info">
              <div class="player-detail-head">
                ${avatarHtml(p, 84)}
                <div>
                  <div class="detail-meta">
                    <span class="badge badge--outline">${Utils.escapeHtml(team?.name || 'Sin equipo')}</span>
                    <span class="badge badge--outline">${Utils.escapeHtml(squad?.name || cat?.name || '')}</span>
                    ${nationalityHtml(p) || '<span class="badge badge--outline">Sin nacionalidad</span>'}
                  </div>
                  <div class="player-rating">${'★'.repeat(p.rating || 0)}${'☆'.repeat(5 - (p.rating || 0))} <span class="overall-badge overall-badge--inline" style="background:${scoreColorVar(overall)}">Media ${overall}</span></div>
                </div>
              </div>
              <p><strong>Posición:</strong> ${Utils.escapeHtml(p.position)}${p.secondaryPosition ? ' / ' + Utils.escapeHtml(p.secondaryPosition) : ''}</p>
              <p><strong>Pie dominante:</strong> ${footLabel(p.foot)}</p>
              <p><strong>Año de nacimiento:</strong> ${p.birthYear || '-'}</p>
              <p><strong>Altura/Peso:</strong> ${p.height || '-'} cm / ${p.weight || '-'} kg</p>
              <p class="skill-edit-heading"><strong>Puntuaciones de scouting</strong> ${canEdit ? '<span class="text-muted-sm">(editable, se guarda al instante)</span>' : ''}</p>
              ${canEdit ? skillEditGridHtml(p) : skillBadgesHtml(p)}
              ${p.notes ? `<p><strong>Notas:</strong> ${Utils.escapeHtml(p.notes)}</p>` : ''}
              <hr>
              <h4>Historial de equipos</h4>
              <table class="table">
                <thead><tr><th>Equipo</th><th>Categoría</th><th>Temporada</th></tr></thead>
                <tbody>
                  ${(p.history || []).map(h => `<tr><td>${Utils.escapeHtml(h.team)}</td><td>${Utils.escapeHtml(h.category)}</td><td>${Utils.escapeHtml(h.season)}</td></tr>`).join('') || '<tr><td colspan="3" class="text-muted">Sin historial.</td></tr>'}
                </tbody>
              </table>
            </div>
            <div class="player-detail-pitch">
              ${pitchSVG(p.position, p.secondaryPosition)}
              <div class="pitch-legend"><span class="dot dot--main"></span> Posición principal ${p.secondaryPosition ? '<span class="dot dot--sec"></span> Secundaria' : ''}</div>
              <div id="radar-wrap">${radarSVG(p)}</div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <span></span>
          <div><button class="btn btn--ghost" id="m-close2">Cerrar</button>${canEdit ? `<button class="btn btn--primary" id="edit">Editar</button>` : ''}</div>
        </div>
      </div>
    `);
    node.querySelector('#m-close').onclick = Utils.closeModal;
    node.querySelector('#m-close2').onclick = Utils.closeModal;

    if (canEdit) {
      node.querySelectorAll('.skill-input').forEach(input => {
        input.oninput = () => {
          const v = Math.max(1, Math.min(10, Number(input.value) || 1));
          input.value = v;
          p.skills = getSkills(p);
          p.skills[input.dataset.skill] = v;
          DB.players.upsert(p);

          const chip = node.querySelector(`[data-skill-chip="${input.dataset.skill}"]`);
          chip.textContent = v;
          chip.style.background = scoreColorVar(v);

          const newOverall = overallScore(p);
          const overallBadge = node.querySelector('.overall-badge--inline');
          overallBadge.textContent = `Media ${newOverall}`;
          overallBadge.style.background = scoreColorVar(newOverall);

          node.querySelector('#radar-wrap').innerHTML = radarSVG(p);

          if (opts.onChange) opts.onChange();
        };
      });
    }

    const editBtn = node.querySelector('#edit');
    if (editBtn) editBtn.onclick = () => openForm(p.squadId, p.teamId, p.categoryId, p, () => { Utils.closeModal(); if (opts.onChange) opts.onChange(); });
    Utils.openModal(node);
  }

  return { POSITIONS, POSITION_COORDS, SKILLS, pitchSVG, radarSVG, cardHtml, openForm, openDetail, footLabel, avatarHtml, flagEmoji, scoreColorVar, getSkills, overallScore, nationalityHtml };
})();
