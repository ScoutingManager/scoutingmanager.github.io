/* ScoutingManager - utilidades compartidas */

const Utils = (() => {
  const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  function pad2(n) { return String(n).padStart(2, '0'); }

  function toISODate(date) {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
  }

  function fromISODate(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function formatDisplay(iso) {
    if (!iso) return '';
    const d = fromISODate(iso);
    return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
  }

  function formatDisplayLong(iso) {
    const d = fromISODate(iso);
    return `${d.getDate()} de ${MONTHS[d.getMonth()].toLowerCase()} de ${d.getFullYear()}`;
  }

  function addDaysISO(iso, days) {
    const d = fromISODate(iso);
    d.setDate(d.getDate() + days);
    return toISODate(d);
  }

  function diffDaysISO(isoA, isoB) {
    const a = fromISODate(isoA), b = fromISODate(isoB);
    return Math.round((b - a) / 86400000);
  }

  function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function el(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  let toastTimer = null;
  function toast(message, type = 'info') {
    let box = document.getElementById('toast');
    if (!box) {
      box = document.createElement('div');
      box.id = 'toast';
      box.className = 'toast';
      document.body.appendChild(box);
    }
    box.textContent = message;
    box.className = `toast toast--${type} toast--show`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { box.className = 'toast'; }, 3200);
  }

  function openModal(node) {
    const overlay = document.getElementById('modal-root');
    overlay.innerHTML = '';
    overlay.appendChild(node);
    overlay.classList.add('modal-root--open');
    document.body.classList.add('no-scroll');
  }

  function closeModal() {
    const overlay = document.getElementById('modal-root');
    overlay.classList.remove('modal-root--open');
    overlay.innerHTML = '';
    document.body.classList.remove('no-scroll');
  }

  function confirmDialog(message) {
    return new Promise(resolve => {
      const node = el(`
        <div class="modal modal--sm">
          <div class="modal-body">
            <p>${escapeHtml(message)}</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn--ghost" data-act="no">Cancelar</button>
            <button class="btn btn--danger" data-act="yes">Confirmar</button>
          </div>
        </div>
      `);
      node.querySelector('[data-act="no"]').onclick = () => { closeModal(); resolve(false); };
      node.querySelector('[data-act="yes"]').onclick = () => { closeModal(); resolve(true); };
      openModal(node);
    });
  }

  function initials(name) {
    return (name || '?').split(' ').filter(Boolean).slice(0, 2).map(s => s[0].toUpperCase()).join('');
  }

  function waitForGlobal(check, timeoutMs = 8000, intervalMs = 20) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      (function poll() {
        let result;
        try { result = check(); } catch (e) { result = undefined; }
        if (result) return resolve(result);
        if (Date.now() - start > timeoutMs) return reject(new Error('Tiempo de espera agotado.'));
        setTimeout(poll, intervalMs);
      })();
    });
  }

  return {
    WEEKDAYS, MONTHS, pad2, toISODate, fromISODate, formatDisplay, formatDisplayLong,
    addDaysISO, diffDaysISO, escapeHtml, el, toast, openModal, closeModal, confirmDialog, initials, waitForGlobal
  };
})();
