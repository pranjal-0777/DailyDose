/* ============================================
   Question Loader — renders user questions
   on all content sub-pages and practice pages.

   Each page must set before including this:
     window.PAGE_CATEGORY    = 'DSA'
     window.PAGE_SUBCATEGORY = 'Theory'
   ============================================ */
'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  // ─── Theme — only if app.js is NOT present ──
  if (typeof window.openModal === 'undefined') {
    const themeToggle = document.getElementById('theme-toggle');
    const savedTheme  = localStorage.getItem('ddp-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (themeToggle) {
      themeToggle.textContent = savedTheme === 'dark' ? '🌙' : '☀️';
      themeToggle.addEventListener('click', () => {
        const cur  = document.documentElement.getAttribute('data-theme');
        const next = cur === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        themeToggle.textContent = next === 'dark' ? '🌙' : '☀️';
        localStorage.setItem('ddp-theme', next);
      });
    }

    window.addEventListener('scroll', () => {
      document.getElementById('navbar')?.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
  }

  // ─── Load & render ───────────────────────────
  const cat       = window.PAGE_CATEGORY;
  const sub       = window.PAGE_SUBCATEGORY;
  const container = document.getElementById('user-questions');
  if (!container || !cat || !sub) return;

  await renderQuestions(container, cat, sub);
});

// ─── Render ───────────────────────────────────
async function renderQuestions(container, cat, sub) {
  // Show loading state
  container.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text-muted);font-size:0.85rem">Loading…</div>';

  let questions = [];
  try {
    questions = await DDPStore.getByPage(cat, sub);
  } catch (err) {
    container.innerHTML = `
      <div class="subpage-coming-soon">
        <div class="coming-soon-icon">⚠️</div>
        <h3>Could not load entries</h3>
        <p>Make sure the local server is running: <code>bash start.sh</code></p>
      </div>`;
    return;
  }

  if (!questions.length) {
    container.innerHTML = `
      <div class="subpage-coming-soon">
        <div class="coming-soon-icon">📭</div>
        <h3>No entries yet</h3>
        <p>Click the <strong>＋</strong> button on the home page to add your first entry here.</p>
      </div>`;
    return;
  }

  const count = questions.length;
  container.innerHTML =
    '<div class="entries-header">' +
      '<span class="entries-count">' + count + ' entr' + (count === 1 ? 'y' : 'ies') + '</span>' +
      (count > 3 ? '<span class="entries-scroll-hint">↕ Scroll to see all</span>' : '') +
    '</div>' +
    '<div class="entries-scroller">' +
      questions.map(q => buildUserCard(q)).join('') +
    '</div>';

  // Card navigation is handled by the native <a href target="_blank"> in the HTML.
  // Edit / Delete buttons are only rendered (and wired) in admin mode.

  if (DDPStore.IS_ADMIN) {
    // Edit
    container.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        e.preventDefault();
        openInNewTab('../new-question.html?edit=' + btn.dataset.id);
      });
    });

    // Delete
    container.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        e.preventDefault();
        showDeleteConfirm(btn.dataset.id, btn.dataset.title, async () => {
          btn.closest('.user-q-card').style.opacity = '0.4';
          await DDPStore.remove(btn.dataset.id);
          await renderQuestions(container, cat, sub);
        });
      });
    });
  }

  // ── Scroller effects ────────────────────────────────────────────────
  const scroller = container.querySelector('.entries-scroller');
  if (scroller) {
    const allCards = Array.from(scroller.querySelectorAll('.user-q-card'));

    // 1) Cap height to ~3 cards so the page never looks crowded.
    //    If there are >3 entries, measure actual card layout heights and
    //    set maxHeight so the 4th card peeks through as a scroll hint.
    if (allCards.length > 3) {
      requestAnimationFrame(() => {
        // offsetTop / offsetHeight are layout values — unaffected by CSS
        // transform so they're accurate even before card-visible fires.
        const third  = allCards[2];
        const peek   = 52; // px of the 4th card visible as scroll hint
        const capPx  = third.offsetTop + third.offsetHeight + peek;
        scroller.style.maxHeight = capPx + 'px';
        checkBottom(); // re-evaluate mask after height is set
      });
    }

    // 2) Fade-mask: remove gradient when scrolled to bottom
    const checkBottom = () => {
      const atBottom = scroller.scrollHeight - scroller.scrollTop <= scroller.clientHeight + 32;
      scroller.classList.toggle('at-bottom', atBottom);
    };
    scroller.addEventListener('scroll', checkBottom, { passive: true });
    checkBottom();

    // 3) Scroll-reveal: animate each card as it enters the scroller viewport.
    //    Uses IntersectionObserver with root = scroller so the overflow
    //    container (not the page viewport) is used as the clipping root.
    const revealObserver = new IntersectionObserver(
      (entries) => {
        // Stagger within each batch: first-load cascade feels great;
        // individual cards scrolling in appear immediately (batchIdx = 0).
        const visible = entries.filter(e => e.isIntersecting);
        visible.forEach((entry, batchIdx) => {
          const delay = Math.min(batchIdx * 60, 300);
          setTimeout(() => entry.target.classList.add('card-visible'), delay);
          revealObserver.unobserve(entry.target);
        });
      },
      { root: scroller, threshold: 0.06 }
    );

    allCards.forEach(card => revealObserver.observe(card));
  }
}

// ─── Card builder ─────────────────────────────
function buildUserCard(q) {
  const diff      = q.difficulty || 'Medium';
  const diffClass = { Easy:'diff-Easy', Medium:'diff-Medium', Hard:'diff-Hard' }[diff] || 'diff-Medium';

  const dsaChips    = (q.dsaTags   || []).map(t => `<span class="user-q-chip chip-dsa-type">${t}</span>`).join('');
  const customChips = (q.customTags || []).map(t => `<span class="user-q-chip chip-custom">${t}</span>`).join('');
  const allChips    = dsaChips + customChips;

  // Preview description — truncated to 160 chars
  const preview = (q.description || '').length > 160
    ? escapeHtml(q.description.slice(0, 160)) + '…'
    : escapeHtml(q.description || '');

  // Extra content indicators
  const indicators = [
    q.diagram ? '<span class="card-indicator">🖼️</span>' : '',
    q.video   ? '<span class="card-indicator">🎥</span>' : '',
    q.code    ? '<span class="card-indicator">💻</span>' : '',
  ].join('');

  return `
    <a class="user-q-card" id="card-${q.id}" data-id="${q.id}"
       href="../entry.html?id=${q.id}" target="_blank" rel="noopener noreferrer"
       title="Click to view full entry">
      <div class="user-q-card-header">
        <div class="user-q-title">${escapeHtml(q.title)}</div>
        <div class="user-q-meta">
          <span class="diff-badge ${diffClass}">${diff}</span>
          <span>📌 ${escapeHtml(q.topic)}</span>
          <span>📅 ${formatDate(q.date)}</span>
        </div>
      </div>

      ${allChips ? `<div class="user-q-chips">${allChips}</div>` : ''}

      ${preview ? `<div class="user-q-desc">${preview}</div>` : ''}

      <div class="user-q-footer">
        <div class="card-indicators">${indicators}<span class="card-open-hint">Open →</span></div>
        ${DDPStore.IS_ADMIN ? `
        <div class="user-q-actions">
          <button class="btn-edit"   data-id="${q.id}" title="Edit this entry">✏️ Edit</button>
          <button class="btn-delete" data-id="${q.id}" data-title="${escapeHtml(q.title)}" title="Delete this entry">🗑️ Delete</button>
        </div>` : ''}
      </div>
    </a>
  `;
}

// ─── Delete confirmation modal ────────────────
function showDeleteConfirm(id, title, onConfirm) {
  const existing = document.getElementById('confirm-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  overlay.id        = 'confirm-overlay';
  overlay.innerHTML = `
    <div class="confirm-box">
      <div class="confirm-icon">🗑️</div>
      <div class="confirm-title">Delete Entry?</div>
      <div class="confirm-msg">
        Are you sure you want to permanently delete<br>
        <strong>"${escapeHtml(title)}"</strong>?<br>
        <span style="color:#f87171;font-size:0.8rem">This cannot be undone.</span>
      </div>
      <div class="confirm-btns">
        <button class="btn-confirm-cancel" id="confirm-cancel">Cancel</button>
        <button class="btn-confirm-delete" id="confirm-delete">🗑️ Delete</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('confirm-cancel').onclick = () => overlay.remove();
  document.getElementById('confirm-delete').onclick = () => { overlay.remove(); onConfirm(); };
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

// ─── Open URL in new tab (reliable cross-browser) ─────────────────────────────
// window.open() can be blocked as a popup; un-attached a.click() fails in Safari.
// Appending to DOM before clicking is the safest approach in all browsers.
function openInNewTab(url) {
  const a = document.createElement('a');
  a.href   = url;
  a.target = '_blank';
  a.rel    = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ─── Helpers ──────────────────────────────────
function formatDate(d) {
  if (!d) return '';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

function escapeHtml(str) {
  return (str || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

window.showDeleteConfirm = showDeleteConfirm;
