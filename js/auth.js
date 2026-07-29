/* ScoutingManager - autenticacion real con Firebase Auth + perfiles/permisos en Firestore.
   Se sigue pudiendo iniciar sesion con "usuario" (no email): internamente se traduce a un
   email sintetico unico (usuario@jrvscouting.app) que solo usa Firebase para identificar la cuenta. */

const Auth = (() => {
  let currentUser = null;

  const PASSWORD_RULES = {
    minLength: 8,
    hasUpper: /[A-Z]/,
    hasLower: /[a-z]/,
    hasNumber: /[0-9]/,
    hasSpecial: /[^A-Za-z0-9]/
  };
  const USERNAME_RE = /^[a-zA-Z0-9._-]{3,20}$/;
  const EMAIL_DOMAIN = 'jrvscouting.app';

  function usernameToEmail(username) {
    return username.trim().toLowerCase() + '@' + EMAIL_DOMAIN;
  }

  function validatePassword(pw) {
    const errors = [];
    if (!pw || pw.length < PASSWORD_RULES.minLength) errors.push(`Minimo ${PASSWORD_RULES.minLength} caracteres`);
    if (!PASSWORD_RULES.hasUpper.test(pw)) errors.push('Al menos una mayuscula');
    if (!PASSWORD_RULES.hasLower.test(pw)) errors.push('Al menos una minuscula');
    if (!PASSWORD_RULES.hasNumber.test(pw)) errors.push('Al menos un numero');
    if (!PASSWORD_RULES.hasSpecial.test(pw)) errors.push('Al menos un caracter especial');
    return errors;
  }

  function firebaseErrorMessage(err) {
    const code = err && err.code;
    if (code === 'auth/email-already-in-use') return 'Ese nombre de usuario ya existe.';
    if (code === 'auth/invalid-email') return 'Nombre de usuario no válido.';
    if (code === 'auth/weak-password') return 'La contraseña es demasiado débil para Firebase.';
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      return 'Usuario o contraseña incorrectos.';
    }
    if (code === 'auth/too-many-requests') return 'Demasiados intentos. Inténtalo de nuevo en unos minutos.';
    if (code === 'auth/requires-recent-login') return 'Por seguridad, cierra sesión y vuelve a entrar antes de cambiar la contraseña.';
    return 'Ha ocurrido un error inesperado (' + (code || err?.message || 'desconocido') + ').';
  }

  async function fetchProfile(uid) {
    const snap = await window.FB.getDoc(window.FB.doc(window.FB.db, 'users', uid));
    if (!snap.exists()) return null;
    return { id: uid, ...snap.data() };
  }

  async function login(username, password) {
    let cred;
    try {
      cred = await window.FB.signInWithEmailAndPassword(window.FB.auth, usernameToEmail(username), password);
    } catch (err) {
      return { ok: false, error: firebaseErrorMessage(err) };
    }
    const profile = await fetchProfile(cred.user.uid);
    if (!profile) {
      await window.FB.signOut(window.FB.auth);
      return { ok: false, error: 'No se encontró el perfil de este usuario. Contacta con el administrador.' };
    }
    if (profile.status === 'pending') {
      await window.FB.signOut(window.FB.auth);
      return { ok: false, error: 'Tu cuenta está pendiente de validación por un administrador.' };
    }
    if (profile.status === 'rejected') {
      await window.FB.signOut(window.FB.auth);
      return { ok: false, error: 'Tu solicitud de acceso fue rechazada. Contacta con el administrador.' };
    }
    currentUser = profile;
    DB.startListening();
    return { ok: true, user: profile };
  }

  async function logout() {
    DB.stopListening();
    currentUser = null;
    try { await window.FB.signOut(window.FB.auth); } catch (e) {}
  }

  function waitForRestoredSession() {
    return new Promise((resolve) => {
      const unsub = window.FB.onAuthStateChanged(window.FB.auth, async (fbUser) => {
        unsub();
        if (!fbUser) return resolve(null);
        try {
          const profile = await fetchProfile(fbUser.uid);
          if (!profile || profile.status !== 'approved') {
            if (profile && profile.status !== 'approved') await window.FB.signOut(window.FB.auth);
            return resolve(null);
          }
          currentUser = profile;
          DB.startListening();
          resolve(profile);
        } catch (e) {
          console.error(e);
          resolve(null);
        }
      });
    });
  }

  function getCurrentUser() { return currentUser; }

  function refreshCurrentUser() {
    if (currentUser) {
      const fresh = DB.users.getById(currentUser.id);
      if (fresh) currentUser = fresh;
    }
    return currentUser;
  }

  async function register({ username, email, password, passwordConfirm, note }) {
    username = (username || '').trim();
    email = (email || '').trim();
    if (!USERNAME_RE.test(username)) return { ok: false, error: 'El usuario debe tener 3-20 caracteres (letras, números, puntos, guiones).' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'Introduce un email válido.' };
    const pwErrors = validatePassword(password);
    if (pwErrors.length) return { ok: false, error: 'La contraseña no cumple los requisitos: ' + pwErrors.join(', ') };
    if (password !== passwordConfirm) return { ok: false, error: 'Las contraseñas no coinciden.' };

    let cred;
    try {
      cred = await window.FB.createUserWithEmailAndPassword(window.FB.auth, usernameToEmail(username), password);
    } catch (err) {
      return { ok: false, error: firebaseErrorMessage(err) };
    }

    const profile = {
      username, email,
      role: 'scout',
      status: 'pending',
      note: note || '',
      permissions: { allCategories: false, categoryIds: [], canEditCalendar: false, canEditScouting: false, canManageUsers: false },
      createdAt: new Date().toISOString()
    };
    await window.FB.setDoc(window.FB.doc(window.FB.db, 'users', cred.user.uid), profile);
    await window.FB.signOut(window.FB.auth);
    return { ok: true, user: { id: cred.user.uid, ...profile } };
  }

  function can(action) {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    const p = currentUser.permissions || {};
    return !!p[action];
  }

  function canSeeCategory(categoryId) {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    const p = currentUser.permissions || {};
    if (p.allCategories) return true;
    return (p.categoryIds || []).includes(categoryId);
  }

  async function changePassword(userId, newPassword) {
    const pwErrors = validatePassword(newPassword);
    if (pwErrors.length) return { ok: false, error: 'La contraseña no cumple los requisitos: ' + pwErrors.join(', ') };
    try {
      await window.FB.updatePassword(window.FB.auth.currentUser, newPassword);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: firebaseErrorMessage(err) };
    }
  }

  return {
    validatePassword, usernameToEmail, login, logout, waitForRestoredSession,
    getCurrentUser, refreshCurrentUser, register, can, canSeeCategory, changePassword
  };
})();
