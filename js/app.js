/* ============================================
   DAILY DOSE OF PRACTISE — App Logic
   ============================================ */

'use strict';

// ─── State ───────────────────────────────────
const state = {
  allQuestions: [],
  filtered: [],
  activeTab: window.PAGE_CATEGORY || 'DSA',
  searchQuery: '',
  theme: localStorage.getItem('ddp-theme') || 'dark',
};

// ─── DOM Refs ─────────────────────────────────
const $ = id => document.getElementById(id);
const cardsGrid = $('cards-grid');
const loadingGrid = $('loading-grid');
const emptyState = $('empty-state');
const modalOverlay = $('modal-overlay');
const modalContent = $('modal-content');
const searchInput = $('search-input');
const themeToggle = $('theme-toggle');
const statDSA = $('stat-dsa');
const statLLD = $('stat-lld');
const statHLD = $('stat-hld');

// ─── INIT ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  applyTheme(state.theme);
  await loadAllData();
  renderCards();
  animateStats();
  setupEventListeners();
});

// ─── Data Loading ─────────────────────────────
async function loadAllData() {
  try {
    // Use embedded data (works without a server)
    const dsa = typeof DSA_DATA !== 'undefined' ? DSA_DATA : [];
    const lld = typeof LLD_DATA !== 'undefined' ? LLD_DATA : [];
    const hld = typeof HLD_DATA !== 'undefined' ? HLD_DATA : [];
    state.allQuestions = [...dsa, ...lld, ...hld].sort((a, b) =>
      new Date(b.date) - new Date(a.date)
    );
    state.filtered = [...state.allQuestions];
  } catch (err) {
    console.error('Failed to load data:', err);
    state.allQuestions = [];
    state.filtered = [];
  }
}

// ─── MAIN CARDS ───────────────────────────────
function renderCards() {
  applyFiltersAndSort();
  const qs = state.filtered;

  loadingGrid.style.display = 'none';

  if (!qs.length) {
    cardsGrid.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }

  cardsGrid.style.display = 'grid';
  emptyState.style.display = 'none';

  cardsGrid.innerHTML = qs.map(q => buildCard(q)).join('');
  observeElements('.q-card');
}

function buildCard(q) {
  const techTags = (q.tags || []).slice(0, 3).map(t =>
    `<span class="tech-tag">${t}</span>`
  ).join('');

  const descText = q.description?.replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') || '';

  return `
    <div class="q-card cat-${q.category}" onclick="openModal('${q.id}')">
      <div class="q-card-top">
        <div class="q-tags">
          <span class="tag-category">${q.category}</span>
        </div>
        <span class="diff-badge diff-${q.difficulty}">${q.difficulty}</span>
      </div>
      <div class="q-title">${q.title}</div>
      <div class="q-topic">📌 ${q.topic}</div>
      <div class="q-desc">${descText}</div>
      <div class="q-card-bottom">
        <span class="q-date">📅 ${formatDate(q.date)}</span>
        <div class="q-tech-tags">${techTags}</div>
      </div>
    </div>
  `;
}

// ─── FILTERING ────────────────────────────────
function applyFiltersAndSort() {
  let qs = [...state.allQuestions];

  qs = qs.filter(q => q.category === state.activeTab);

  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    qs = qs.filter(item =>
      item.title.toLowerCase().includes(q) ||
      item.topic?.toLowerCase().includes(q) ||
      item.tags?.some(t => t.toLowerCase().includes(q)) ||
      item.description?.toLowerCase().includes(q)
    );
  }

  // Always sort latest first
  qs.sort((a, b) => new Date(b.date) - new Date(a.date));

  state.filtered = qs;
}

// ─── MODAL ────────────────────────────────────
function openModal(id) {
  const q = state.allQuestions.find(x => x.id === id);
  if (!q) return;

  modalContent.innerHTML = q.category === 'DSA' ? buildDSAModal(q) : buildDesignModal(q);
  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

// ─── DSA Modal ────────────────────────────────
function buildDSAModal(q) {
  const examples = (q.examples || []).map(ex => `
    <div class="example-box">
      <div><strong>Input:</strong> <code>${ex.input}</code></div>
      <div><strong>Output:</strong> <code>${ex.output}</code></div>
      ${ex.explanation ? `<div class="example-explanation">${ex.explanation}</div>` : ''}
    </div>
  `).join('');

  const constraints = (q.constraints || []).map(c => `<li>${c}</li>`).join('');
  const hints = (q.hints || []).map(h => `<li>${h}</li>`).join('');
  const tags = (q.tags || []).map(t => `<span class="entity-chip">${t}</span>`).join('');
  const desc = q.description?.replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>') || '';

  return `
    <div class="modal-header">
      <div class="modal-cats">
        <span class="tag-category tag-${q.category}">${q.category}</span>
        <span class="diff-badge diff-${q.difficulty}">${q.difficulty}</span>
      </div>
      <h2 class="modal-title">${q.title}</h2>
      <div class="modal-meta">
        <span class="modal-meta-item">📌 ${q.topic}</span>
        <span class="modal-meta-item">📅 ${formatDate(q.date)}</span>
      </div>
    </div>

    <div class="modal-section">
      <h3>🗒️ Problem Description</h3>
      <p class="modal-desc">${desc}</p>
    </div>

    ${examples ? `
    <div class="modal-section">
      <h3>📋 Examples</h3>
      ${examples}
    </div>` : ''}

    ${constraints ? `
    <div class="modal-section">
      <h3>⚠️ Constraints</h3>
      <ul class="constraints-list">${constraints}</ul>
    </div>` : ''}

    ${hints ? `
    <div class="modal-section">
      <h3>💡 Hints</h3>
      <ul class="hints-list">${hints}</ul>
    </div>` : ''}

    ${q.solution ? `
    <div class="modal-section">
      <h3>✅ Solution</h3>
      <div class="solution-box">
        <div class="solution-header">
          <span>Python • ${q.solution.approach}</span>
          <div class="complexity-badges">
            <span class="complexity-badge time-badge">Time: ${q.solution.complexity?.time}</span>
            <span class="complexity-badge space-badge">Space: ${q.solution.complexity?.space}</span>
          </div>
        </div>
        <div class="solution-code">${escapeHtml(q.solution.code)}</div>
      </div>
    </div>` : ''}

    ${tags ? `
    <div class="modal-section">
      <h3>🏷️ Tags</h3>
      <div class="entities-grid">${tags}</div>
    </div>` : ''}

    <div class="modal-actions">
      ${q.leetcodeLink ? `<a href="${q.leetcodeLink}" target="_blank" class="btn btn-primary">🔗 Solve on LeetCode</a>` : ''}
      <button class="btn btn-secondary" onclick="closeModal()">✕ Close</button>
    </div>
  `;
}

// ─── Design Modal (LLD / HLD) ─────────────────
function buildDesignModal(q) {
  const isHLD = q.category === 'HLD';

  const functionalReqs = (q.requirements?.functional || []).map(r => `<li>${r}</li>`).join('');
  const nonFuncReqs = (q.requirements?.nonFunctional || []).map(r => `<li>${r}</li>`).join('');
  const entities = (q.entities || []).map(e => `<span class="entity-chip">${e}</span>`).join('');
  const patterns = (q.designPatterns || []).map(p => `<span class="pattern-chip">${p}</span>`).join('');
  const followups = (q.followUpQuestions || []).map(f => `<li>${f}</li>`).join('');
  const desc = q.description?.replace(/\n/g, '<br>') || '';

  // HLD specifics
  const components = (q.components || []).map(c => `
    <div class="example-box">
      <strong>${c.name}</strong>
      <div style="font-size:0.85rem;color:var(--text-secondary);margin-top:6px">${c.description}</div>
    </div>
  `).join('');

  const tradeoffs = (q.tradeoffs || []).map(t => `
    <tr>
      <td>${t.decision}</td>
      <td>${t.pros}</td>
      <td><span class="chosen-badge">${t.chosen}</span></td>
    </tr>
  `).join('');

  const bottlenecks = (q.bottlenecks || []).map(b => `<li>${b}</li>`).join('');

  const estimationBoxes = q.estimation ? Object.entries(q.estimation).map(([k, v]) => `
    <div class="est-box">
      <div class="est-value">${v}</div>
      <div class="est-label">${camelToLabel(k)}</div>
    </div>
  `).join('') : '';

  // LLD specifics
  const keyClasses = q.keyClasses ? Object.entries(q.keyClasses).map(([name, desc]) => `
    <div class="example-box">
      <strong style="color:#a78bfa;font-family:var(--font-mono)">${name}</strong>
      <div style="font-size:0.85rem;color:var(--text-secondary);margin-top:6px">${desc}</div>
    </div>
  `).join('') : '';

  return `
    <div class="modal-header">
      <div class="modal-cats">
        <span class="tag-category tag-${q.category}">${q.category}</span>
        <span class="diff-badge diff-${q.difficulty}">${q.difficulty}</span>
      </div>
      <h2 class="modal-title">${q.title}</h2>
      <div class="modal-meta">
        <span class="modal-meta-item">📌 ${q.topic}</span>
        <span class="modal-meta-item">📅 ${formatDate(q.date)}</span>
      </div>
    </div>

    <div class="modal-section">
      <h3>🗒️ Problem Description</h3>
      <p class="modal-desc">${desc}</p>
    </div>

    ${functionalReqs || nonFuncReqs ? `
    <div class="modal-section">
      <h3>📋 Requirements</h3>
      <div class="req-grid">
        ${functionalReqs ? `<div class="req-box functional"><h4>✅ Functional</h4><ul>${functionalReqs}</ul></div>` : ''}
        ${nonFuncReqs ? `<div class="req-box non-functional"><h4>⚡ Non-Functional</h4><ul>${nonFuncReqs}</ul></div>` : ''}
      </div>
    </div>` : ''}

    ${isHLD && estimationBoxes ? `
    <div class="modal-section">
      <h3>📊 Back-of-Envelope Estimation</h3>
      <div class="estimation-grid">${estimationBoxes}</div>
    </div>` : ''}

    ${entities ? `
    <div class="modal-section">
      <h3>🏗️ Core Entities / Classes</h3>
      <div class="entities-grid">${entities}</div>
    </div>` : ''}

    ${isHLD && components ? `
    <div class="modal-section">
      <h3>🔧 Components</h3>
      ${components}
    </div>` : ''}

    ${!isHLD && keyClasses ? `
    <div class="modal-section">
      <h3>🧩 Key Classes</h3>
      ${keyClasses}
    </div>` : ''}

    ${q.diagram ? `
    <div class="modal-section">
      <h3>${isHLD ? '🏛️' : '📐'} Architecture Diagram</h3>
      <div class="diagram-box">${q.diagram}</div>
    </div>` : ''}

    ${!isHLD && q.architecture ? `
    <div class="modal-section">
      <h3>🏛️ Architecture</h3>
      <div class="diagram-box">${q.architecture}</div>
    </div>` : ''}

    ${isHLD && q.architecture ? `
    <div class="modal-section">
      <h3>🏛️ Architecture</h3>
      <div class="diagram-box">${q.architecture}</div>
    </div>` : ''}

    ${patterns ? `
    <div class="modal-section">
      <h3>🎨 Design Patterns</h3>
      <div class="patterns-grid">${patterns}</div>
    </div>` : ''}

    ${tradeoffs ? `
    <div class="modal-section">
      <h3>⚖️ Key Trade-offs</h3>
      <table class="tradeoff-table">
        <thead><tr><th>Decision</th><th>Comparison</th><th>Chosen</th></tr></thead>
        <tbody>${tradeoffs}</tbody>
      </table>
    </div>` : ''}

    ${bottlenecks ? `
    <div class="modal-section">
      <h3>🚨 Bottlenecks & Mitigations</h3>
      <ul class="bottleneck-list">${bottlenecks}</ul>
    </div>` : ''}

    ${followups ? `
    <div class="modal-section">
      <h3>🎤 Follow-up Questions</h3>
      <ul class="followup-list">${followups}</ul>
    </div>` : ''}

    <div class="modal-actions">
      <button class="btn btn-secondary" onclick="closeModal()">✕ Close</button>
    </div>
  `;
}

// ─── STATS ANIMATION ─────────────────────────
function animateStats() {
  const count = state.allQuestions.filter(q => q.category === state.activeTab).length;
  const statEl = $(`stat-${state.activeTab.toLowerCase()}`);
  if (statEl) animateCount(statEl, count);
}

function animateCount(el, target) {
  let current = 0;
  const step = Math.max(1, Math.floor(target / 40));
  const interval = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current;
    if (current >= target) clearInterval(interval);
  }, 30);
}

// ─── INTERSECTION OBSERVER ─────────────────────
function observeElements(selector) {
  const els = document.querySelectorAll(selector);
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 60);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05 });
  els.forEach(el => obs.observe(el));
}

// ─── THEME ────────────────────────────────────
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeToggle.textContent = theme === 'dark' ? '🌙' : '☀️';
  localStorage.setItem('ddp-theme', theme);
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme(state.theme);
}

// ─── EVENT LISTENERS ──────────────────────────
function setupEventListeners() {
  // Theme toggle
  themeToggle.addEventListener('click', toggleTheme);

  // Search
  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      state.searchQuery = e.target.value.trim();
      renderCards();
    }, 300);
  });

  // Modal close
  $('modal-close').addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // Navbar scroll effect
  window.addEventListener('scroll', () => {
    const navbar = $('navbar');
    navbar?.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
}

// ─── HELPERS ─────────────────────────────────
function getTodayISO() {
  return new Date().toISOString().split('T')[0];
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function escapeHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function camelToLabel(str) {
  return str.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
}

// ─── Global fn for onclick in HTML ───────────
window.openModal = openModal;
window.closeModal = closeModal;
