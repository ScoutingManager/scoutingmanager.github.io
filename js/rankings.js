/* ScoutingManager - Ranking: Jugador TOP, mejor por pais, mejor por posicion */

const Rankings = (() => {
  let activeTab = 'top';

  function init() { render(); }

  function visiblePlayers() {
    const visibleCategoryIds = new Set(DB.categories.all().filter(c => Auth.canSeeCategory(c.id)).map(c => c.id));
    return DB.players.all().filter(p => visibleCategoryIds.has(p.categoryId));
  }

  function rankRowHtml(rank, p, extraLabel) {
    const overall = PlayerUI.overallScore(p);
    const team = DB.teams.getById(p.teamId);
    return `
      <button class="rank-row" data-id="${p.id}">
        <span class="rank-number">${rank}</span>
        ${PlayerUI.avatarHtml(p, 42)}
        <span class="rank-info">
          <strong>${Utils.escapeHtml(p.name)}</strong>
          <span class="text-muted-sm">${Utils.escapeHtml(p.position)} · ${Utils.escapeHtml(team?.name || '')} ${extraLabel ? '· ' + extraLabel : ''}</span>
        </span>
        <span class="rank-score" style="background:${PlayerUI.scoreColorVar(overall)}">${overall}</span>
      </button>
    `;
  }

  function render() {
    const root = document.getElementById('view-ranking');
    if (!root) return;
    const players = visiblePlayers();

    root.innerHTML = `
      <h2>Ranking</h2>
      <div class="cat-tabs">
        <button class="cat-tab ${activeTab === 'top' ? 'cat-tab--active' : ''}" data-tab="top">Jugador TOP</button>
        <button class="cat-tab ${activeTab === 'country' ? 'cat-tab--active' : ''}" data-tab="country">Mejor jugador por país</button>
        <button class="cat-tab ${activeTab === 'position' ? 'cat-tab--active' : ''}" data-tab="position">Mejor jugador por posición</button>
      </div>
      <div id="ranking-content"></div>
    `;

    const content = root.querySelector('#ranking-content');
    if (activeTab === 'top') content.innerHTML = renderTop(players);
    if (activeTab === 'country') content.innerHTML = renderByCountry(players);
    if (activeTab === 'position') content.innerHTML = renderByPosition(players);

    root.querySelectorAll('.cat-tab').forEach(btn => btn.onclick = () => { activeTab = btn.dataset.tab; render(); });
    root.querySelectorAll('.rank-row').forEach(row => row.onclick = () => PlayerUI.openDetail(row.dataset.id, { onChange: render }));
  }

  function renderTop(players) {
    const sorted = players.slice().sort((a, b) => PlayerUI.overallScore(b) - PlayerUI.overallScore(a)).slice(0, 20);
    return `
      <p class="text-muted-sm">Top 20 jugadores según la media de sus 5 puntuaciones de scouting.</p>
      <div class="rank-list">${sorted.map((p, i) => rankRowHtml(i + 1, p)).join('') || '<p class="text-muted">Sin jugadores todavía.</p>'}</div>
    `;
  }

  function renderByCountry(players) {
    const byCountry = {};
    players.forEach(p => {
      const nat = p.nationality || 'Sin nacionalidad';
      if (!byCountry[nat] || PlayerUI.overallScore(p) > PlayerUI.overallScore(byCountry[nat])) byCountry[nat] = p;
    });
    const rows = Object.entries(byCountry).sort((a, b) => PlayerUI.overallScore(b[1]) - PlayerUI.overallScore(a[1]));
    return `
      <p class="text-muted-sm">El jugador con mejor media de cada nacionalidad presente en la base de datos.</p>
      <div class="rank-list">
        ${rows.map(([nat, p], i) => rankRowHtml(i + 1, p, `${PlayerUI.flagEmoji(nat)} ${nat}`)).join('') || '<p class="text-muted">Sin jugadores todavía.</p>'}
      </div>
    `;
  }

  function renderByPosition(players) {
    const byPos = {};
    players.forEach(p => {
      if (!byPos[p.position] || PlayerUI.overallScore(p) > PlayerUI.overallScore(byPos[p.position])) byPos[p.position] = p;
    });
    const rows = PlayerUI.POSITIONS.filter(pos => byPos[pos]).map(pos => [pos, byPos[pos]]);
    return `
      <p class="text-muted-sm">El jugador con mejor media en cada posición del campo.</p>
      <div class="rank-list">
        ${rows.map(([pos, p], i) => rankRowHtml(i + 1, p, pos)).join('') || '<p class="text-muted">Sin jugadores todavía.</p>'}
      </div>
    `;
  }

  return { init, render };
})();
