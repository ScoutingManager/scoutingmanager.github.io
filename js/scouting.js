/* ScoutingManager - directorio global de jugadores (buscador transversal a todos los equipos) */

const Scouting = (() => {
  let searchTerm = '';
  let filterCategory = '';
  let onlyFavorites = false;

  function init() {
    render();
  }

  function render() {
    const root = document.getElementById('view-scouting');
    if (!root) return;
    const categories = DB.categories.all().sort((a, b) => a.order - b.order).filter(c => Auth.canSeeCategory(c.id));
    const visibleCategoryIds = new Set(categories.map(c => c.id));

    let players = DB.players.all().filter(p => visibleCategoryIds.has(p.categoryId));
    if (filterCategory) players = players.filter(p => p.categoryId === filterCategory);
    if (onlyFavorites) players = players.filter(p => p.favorite);
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      players = players.filter(p => p.name.toLowerCase().includes(term) || (p.nationality || '').toLowerCase().includes(term));
    }
    players = players.slice().sort((a, b) => a.name.localeCompare(b.name));

    root.innerHTML = `
      <h2>Buscador de jugadores</h2>
      <p class="text-muted-sm">Explora a todos los jugadores registrados en Equipos, filtra por categoría o busca por nombre/nacionalidad.</p>
      <div class="scouting-toolbar">
        <input type="search" id="scout-search" class="input" placeholder="Buscar por nombre o nacionalidad..." value="${Utils.escapeHtml(searchTerm)}">
        <select id="scout-cat" class="select">
          <option value="">Todas las categorías</option>
          ${categories.map(c => `<option value="${c.id}" ${c.id === filterCategory ? 'selected' : ''}>${Utils.escapeHtml(c.name)}</option>`).join('')}
        </select>
        <label class="field field--checkbox" style="margin:0;"><input type="checkbox" id="scout-fav" ${onlyFavorites ? 'checked' : ''}> <span>Solo favoritos</span></label>
      </div>
      <p class="text-muted-sm">${players.length} jugador(es)</p>
      <div class="player-grid">${players.map(p => PlayerUI.cardHtml(p)).join('') || '<p class="text-muted">Sin resultados. Añade jugadores desde el apartado Equipos.</p>'}</div>
    `;

    root.querySelector('#scout-search').oninput = (e) => { searchTerm = e.target.value; render(); };
    root.querySelector('#scout-cat').onchange = (e) => { filterCategory = e.target.value; render(); };
    root.querySelector('#scout-fav').onchange = (e) => { onlyFavorites = e.target.checked; render(); };
    root.querySelectorAll('.player-card').forEach(card => card.onclick = () => PlayerUI.openDetail(card.dataset.id, { onChange: render }));
  }

  return { init, render };
})();
