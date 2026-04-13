/* ============================================================
   DDPStore — Persistent Storage (3-mode)
   ──────────────────────────────────────────────────────────
   ADMIN mode  (localhost / 127.0.0.1)
     Full CRUD via Python server API.
     Saves to data/user-questions.json on disk.
     FAB, Edit, Delete buttons are visible.

   PUBLIC mode  (GitHub Pages or any other remote host)
     READ-ONLY. Fetches the committed data/user-questions.json
     as a plain static file. No writes allowed.
     FAB / Edit / Delete controls are hidden automatically
     via the `public-mode` class added to <html>.

   FILE mode   (file:// — opened directly from disk)
     Falls back to localStorage. Useful for quick testing
     without starting the server.
   ============================================================ */

const DDPStore = (() => {
  'use strict';

  // ─── Mode detection ───────────────────────────────────────
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;

  const IS_ADMIN  = hostname === 'localhost' || hostname === '127.0.0.1';
  const IS_FILE   = protocol === 'file:';
  const IS_PUBLIC = !IS_ADMIN && !IS_FILE;

  // Backward-compat alias (used in other scripts)
  const IS_SERVER = IS_ADMIN;

  // Add class to <html> so CSS can globally hide admin-only controls
  if (IS_PUBLIC) {
    document.documentElement.classList.add('public-mode');
  }

  // ─── Constants ────────────────────────────────────────────
  const LOCAL_KEY = 'ddp_user_questions';
  const API_BASE  = '/api/questions';

  // ─── ID generator ─────────────────────────────────────────
  function makeId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
  }

  // ─── Resolve base path to data/ directory (public mode) ──────
  // Works on GitHub Pages (/repo-name/page.html) and custom
  // domains (/page.html) without any manual configuration.
  function publicDataBase() {
    const pathname = window.location.pathname;
    const dir      = pathname.replace(/\/[^\/]*$/, '');   // strip filename
    const parts    = dir.split('/').filter(Boolean);       // directory segments

    // On GitHub Pages the first segment is the repo name, not a real
    // subdirectory of the site.  Our pages sit at depth 0 (root) or
    // depth 1 (dsa/, lld/, hld/).  Subtract repo-name prefix.
    const isGitHubPages = hostname.endsWith('github.io');
    const depth = isGitHubPages ? Math.max(0, parts.length - 1) : parts.length;

    return '../'.repeat(depth) + 'data/';
  }

  // ════════════════════════════════════════════════════════════
  //  ADMIN — full REST API (Python server on localhost)
  // ════════════════════════════════════════════════════════════

  async function serverGetAll() {
    const r = await fetch(API_BASE);
    if (!r.ok) throw new Error('Server error: ' + r.status);
    return r.json();
  }

  async function serverGetById(id) {
    const r = await fetch(API_BASE + '/' + id);
    if (!r.ok) return null;
    return r.json();
  }

  async function serverSave(question) {
    const r = await fetch(API_BASE, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(question),
    });
    const res = await r.json();
    return { ...question, id: res.id };
  }

  async function serverUpdate(question) {
    await fetch(API_BASE + '/' + question.id, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(question),
    });
    return question;
  }

  async function serverRemove(id) {
    await fetch(API_BASE + '/' + id, { method: 'DELETE' });
  }

  // ════════════════════════════════════════════════════════════
  //  PUBLIC — read-only static JSON (GitHub Pages)
  // ════════════════════════════════════════════════════════════

  let _publicCache = null; // session-level cache (cleared on page load)

  async function publicGetAll() {
    if (_publicCache) return _publicCache;

    const base  = publicDataBase();
    const files = ['dsa.json', 'lld.json', 'hld.json'];

    // Fetch all 3 category files in parallel
    const results = await Promise.all(
      files.map(async file => {
        try {
          const r = await fetch(base + file, { cache: 'no-store' });
          return r.ok ? r.json() : [];
        } catch (_) { return []; }
      })
    );

    _publicCache = results.flat();
    return _publicCache;
  }

  async function publicGetById(id) {
    const all = await publicGetAll();
    return all.find(q => q.id === id) || null;
  }

  // ════════════════════════════════════════════════════════════
  //  FILE — localStorage fallback (file:// protocol)
  // ════════════════════════════════════════════════════════════

  function localGetAll() {
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]'); }
    catch { return []; }
  }

  function localGetById(id) {
    return localGetAll().find(q => q.id === id) || null;
  }

  function localSave(question) {
    const all = localGetAll();
    all.unshift(question);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(all));
    return question;
  }

  function localUpdate(question) {
    const all = localGetAll();
    const idx = all.findIndex(q => q.id === question.id);
    if (idx !== -1) {
      all[idx] = question;
      localStorage.setItem(LOCAL_KEY, JSON.stringify(all));
    }
    return question;
  }

  function localRemove(id) {
    const filtered = localGetAll().filter(q => q.id !== id);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(filtered));
  }

  // ════════════════════════════════════════════════════════════
  //  Public async API — same interface in every mode
  // ════════════════════════════════════════════════════════════

  async function getAll() {
    if (IS_ADMIN)  return serverGetAll();
    if (IS_PUBLIC) return publicGetAll();
    return localGetAll();
  }

  async function getById(id) {
    if (IS_ADMIN)  return serverGetById(id);
    if (IS_PUBLIC) return publicGetById(id);
    return localGetById(id);
  }

  async function save(question) {
    if (IS_PUBLIC) throw new Error('Read-only in public mode');
    if (!question.id) question.id = makeId();
    return IS_ADMIN ? serverSave(question) : localSave(question);
  }

  async function update(question) {
    if (IS_PUBLIC) throw new Error('Read-only in public mode');
    return IS_ADMIN ? serverUpdate(question) : localUpdate(question);
  }

  async function remove(id) {
    if (IS_PUBLIC) throw new Error('Read-only in public mode');
    return IS_ADMIN ? serverRemove(id) : localRemove(id);
  }

  async function getByPage(category, subcategory) {
    const all = await getAll();
    return all.filter(q => q.category === category && q.subcategory === subcategory);
  }

  async function getByCategory(category) {
    const all = await getAll();
    return all.filter(q => q.category === category);
  }

  return {
    getAll, getById, save, update, remove,
    getByPage, getByCategory,
    IS_ADMIN, IS_SERVER, IS_PUBLIC,
  };
})();

window.DDPStore = DDPStore;
