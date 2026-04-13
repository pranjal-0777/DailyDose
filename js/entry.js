/* ============================================
   Entry Detail Page — entry.html
   Reads ?id=<id> from URL, loads from DDPStore,
   renders the full entry.
   ============================================ */
'use strict';

// ─── Theme ────────────────────────────────────
(function () {
  const t    = document.getElementById('theme-toggle');
  const saved = localStorage.getItem('ddp-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  if (t) {
    t.textContent = saved === 'dark' ? '🌙' : '☀️';
    t.addEventListener('click', () => {
      const cur  = document.documentElement.getAttribute('data-theme');
      const next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      t.textContent = next === 'dark' ? '🌙' : '☀️';
      localStorage.setItem('ddp-theme', next);
    });
  }
})();

// ─── Main ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const id     = params.get('id');
  const main   = document.getElementById('entry-main');
  const loading = document.getElementById('entry-loading');

  if (!id) {
    showError(main, 'No entry ID provided.');
    return;
  }

  let q;
  try {
    q = await DDPStore.getById(id);
  } catch (_) {
    showError(main, 'Could not load entry. Make sure the server is running: <code>bash start.sh</code>');
    return;
  }

  if (!q) {
    showError(main, 'Entry not found. It may have been deleted.');
    return;
  }

  // Update page title
  document.title = q.title + ' — Daily Dose of Practise';

  // Render content
  loading.remove();
  main.insertAdjacentHTML('beforeend', buildEntryHTML(q));

  // Wire action buttons — only visible in admin mode (localhost)
  const editBtn   = document.getElementById('edit-btn');
  const deleteBtn = document.getElementById('delete-btn');

  if (DDPStore.IS_ADMIN) {
    editBtn.style.display   = 'inline-flex';
    deleteBtn.style.display = 'inline-flex';

    editBtn.addEventListener('click', () => {
      const a = document.createElement('a');
      a.href   = 'new-question.html?edit=' + id;
      a.target = '_blank';
      a.rel    = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });

    deleteBtn.addEventListener('click', () => {
      showDeleteConfirm(id, q.title, async () => {
        await DDPStore.remove(id);
        window.close();
        window.location.href = 'index.html';
      });
    });
  }
});

// ─── Build full entry HTML ─────────────────────
function buildEntryHTML(q) {
  const diff      = q.difficulty || 'Medium';
  const diffClass = { Easy: 'diff-Easy', Medium: 'diff-Medium', Hard: 'diff-Hard' }[diff] || 'diff-Medium';

  const catColors = {
    DSA: { bg: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: 'rgba(99,102,241,0.3)' },
    LLD: { bg: 'rgba(16,185,129,0.12)', color: '#6ee7b7', border: 'rgba(16,185,129,0.3)' },
    HLD: { bg: 'rgba(245,158,11,0.12)', color: '#fcd34d', border: 'rgba(245,158,11,0.3)' },
  };
  const cc = catColors[q.category] || catColors.DSA;

  const dsaChips    = (q.dsaTags    || []).map(t => `<span class="entry-chip chip-dsa">${esc(t)}</span>`).join('');
  const customChips = (q.customTags || []).map(t => `<span class="entry-chip chip-custom">${esc(t)}</span>`).join('');
  const allChips    = dsaChips + customChips;

  const diagramBlock = q.diagram ? `
    <div class="entry-section">
      <div class="entry-section-label">🖼️ Diagram</div>
      <div class="entry-diagram">
        <img src="${q.diagram}" alt="Diagram" />
      </div>
    </div>` : '';

  const videoBlock = q.video ? `
    <div class="entry-section">
      <div class="entry-section-label">🎥 Video Reference</div>
      <a class="entry-video-link" href="${esc(q.video)}" target="_blank" rel="noopener">${esc(q.video)}</a>
    </div>` : '';

  const codeBlock = q.code ? `
    <div class="entry-section">
      <div class="entry-section-label">💻 Code
        <span class="entry-lang-badge">${esc(q.codeLanguage || 'code')}</span>
      </div>
      <div class="entry-code-wrap">
        <button class="entry-copy-btn" onclick="copyCode(this)">Copy</button>
        <pre class="entry-code"><code>${esc(q.code)}</code></pre>
      </div>
    </div>` : '';

  return `
    <div class="entry-card">

      <!-- ── Header ── -->
      <div class="entry-header">
        <div class="entry-badges">
          <span class="entry-cat-badge"
            style="background:${cc.bg};color:${cc.color};border-color:${cc.border}">
            ${esc(q.category)}
          </span>
          <span class="entry-subcat">${esc(q.subcategory)}</span>
          <span class="diff-badge ${diffClass}">${diff}</span>
        </div>
        <h1 class="entry-title">${esc(q.title)}</h1>
        <div class="entry-meta">
          <span>📌 ${esc(q.topic)}</span>
          <span>📅 ${formatDate(q.date)}</span>
          ${q.updatedAt ? `<span class="entry-updated">✏️ Updated ${formatRelative(q.updatedAt)}</span>` : ''}
        </div>
      </div>

      <!-- ── Tags ── -->
      ${allChips ? `<div class="entry-chips">${allChips}</div>` : ''}

      <!-- ── Problem Statement ── -->
      <div class="entry-section">
        <div class="entry-section-label">📝 Problem Statement</div>
        <div class="entry-description">${esc(q.description || '').replace(/\n/g, '<br>')}</div>
      </div>

      <!-- ── Diagram ── -->
      ${diagramBlock}

      <!-- ── Video ── -->
      ${videoBlock}

      <!-- ── Code ── -->
      ${codeBlock}

    </div>
  `;
}

// ─── Copy code ────────────────────────────────
window.copyCode = function (btn) {
  const code = btn.nextElementSibling.textContent;
  navigator.clipboard.writeText(code).then(() => {
    btn.textContent = '✓ Copied!';
    setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
  }).catch(() => {
    btn.textContent = 'Error';
    setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
  });
};

// ─── Delete confirm ───────────────────────────
function showDeleteConfirm(id, title, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  overlay.innerHTML = `
    <div class="confirm-box">
      <div class="confirm-icon">🗑️</div>
      <div class="confirm-title">Delete Entry?</div>
      <div class="confirm-msg">
        Are you sure you want to permanently delete<br>
        <strong>"${esc(title)}"</strong>?<br>
        <span style="color:#f87171;font-size:0.8rem">This cannot be undone.</span>
      </div>
      <div class="confirm-btns">
        <button class="btn-confirm-cancel" id="conf-cancel">Cancel</button>
        <button class="btn-confirm-delete" id="conf-delete">🗑️ Delete</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  document.getElementById('conf-cancel').onclick = () => overlay.remove();
  document.getElementById('conf-delete').onclick = () => { overlay.remove(); onConfirm(); };
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

// ─── Error state ──────────────────────────────
function showError(container, msg) {
  document.getElementById('entry-loading')?.remove();
  container.innerHTML = `
    <div class="entry-error">
      <div style="font-size:3rem;margin-bottom:16px">😕</div>
      <h2>Oops!</h2>
      <p>${msg}</p>
      <a href="index.html" class="btn-back-home">← Back to Home</a>
    </div>`;
}

// ─── Helpers ──────────────────────────────────
function esc(str) {
  return (str || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatDate(d) {
  if (!d) return '';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'long', day: 'numeric', year: 'numeric'
  });
}

function formatRelative(ts) {
  const diff = Date.now() - ts;
  const mins  = Math.floor(diff / 60000);
  const hrs   = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return mins + 'm ago';
  if (hrs  < 24) return hrs  + 'h ago';
  if (days < 30) return days + 'd ago';
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
