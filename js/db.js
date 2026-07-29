/* JRVScoutingManager - capa de datos, respaldada por Firestore (Firebase) en tiempo real.
   Mantiene la misma interfaz sincrona (.all/.getById/.upsert/.remove/.save) que antes usaba
   localStorage, gracias a una cache local que se mantiene al dia mediante onSnapshot.
   Esto evita tener que reescribir el resto de modulos (calendar.js, teams.js, etc.). */

const DB = (() => {
  const COLLECTIONS = ['users', 'tournaments', 'colors', 'categories', 'teams', 'squads', 'players', 'reports'];
  const cache = {};
  COLLECTIONS.forEach(c => { cache[c] = []; });

  let unsubscribers = [];
  const changeListeners = new Set();

  function uid(prefix) {
    return (prefix ? prefix + '_' : '') + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
  }

  function notify() {
    changeListeners.forEach(fn => { try { fn(); } catch (e) { console.error('DB change listener error', e); } });
  }

  function startListening() {
    stopListening();
    COLLECTIONS.forEach(name => {
      const unsub = window.FB.onSnapshot(
        window.FB.collection(window.FB.db, name),
        snap => { cache[name] = snap.docs.map(d => ({ id: d.id, ...d.data() })); notify(); },
        err => console.error('Error escuchando ' + name, err)
      );
      unsubscribers.push(unsub);
    });
  }

  function stopListening() {
    unsubscribers.forEach(u => { try { u(); } catch (e) {} });
    unsubscribers = [];
    COLLECTIONS.forEach(name => { cache[name] = []; });
  }

  function reportError(err) {
    console.error(err);
    if (typeof Utils !== 'undefined') Utils.toast('Error guardando datos: ' + (err.message || err), 'error');
  }

  function makeCollection(name) {
    return {
      all: () => cache[name],
      getById: (id) => cache[name].find(x => x.id === id) || null,
      upsert: (item) => {
        const id = item.id || uid(name.replace(/s$/, ''));
        const data = { ...item };
        delete data.id;
        window.FB.setDoc(window.FB.doc(window.FB.db, name, id), data).catch(reportError);
        return { id, ...data };
      },
      remove: (id) => {
        window.FB.deleteDoc(window.FB.doc(window.FB.db, name, id)).catch(reportError);
      },
      save: async (list) => {
        const batch = window.FB.writeBatch(window.FB.db);
        const keepIds = new Set(list.map(x => x.id));
        cache[name].forEach(existing => {
          if (!keepIds.has(existing.id)) batch.delete(window.FB.doc(window.FB.db, name, existing.id));
        });
        list.forEach(item => {
          const id = item.id || uid(name.replace(/s$/, ''));
          const data = { ...item };
          delete data.id;
          batch.set(window.FB.doc(window.FB.db, name, id), data);
        });
        await batch.commit().catch(reportError);
      }
    };
  }

  const collections = {};
  COLLECTIONS.forEach(name => { collections[name] = makeCollection(name); });
  collections.users.getByUsername = (username) =>
    cache.users.find(u => (u.username || '').toLowerCase() === (username || '').toLowerCase()) || null;

  const settings = {
    get: () => (typeof Auth !== 'undefined' && Auth.getCurrentUser()?.prefs) || {},
    set: (obj) => {
      const u = typeof Auth !== 'undefined' && Auth.getCurrentUser();
      if (!u) return;
      u.prefs = obj;
      collections.users.upsert(u);
    }
  };

  async function isSeeded() {
    const snap = await window.FB.getDoc(window.FB.doc(window.FB.db, 'meta', 'seed'));
    return snap.exists() && snap.data().done === true;
  }
  async function markSeeded() {
    await window.FB.setDoc(window.FB.doc(window.FB.db, 'meta', 'seed'), { done: true, at: new Date().toISOString() });
  }

  return {
    uid,
    ...collections,
    settings,
    startListening,
    stopListening,
    onChange: (fn) => { changeListeners.add(fn); return () => changeListeners.delete(fn); },
    isSeeded,
    markSeeded
  };
})();
