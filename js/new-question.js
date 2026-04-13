/* ============================================
   New Question Form — Logic
   Supports both Create and Edit modes.
   Edit mode is activated via ?edit=<id> in URL.
   ============================================ */
'use strict';

// ─── Sub-categories ───────────────────────────
const SUBCATEGORIES = {
  DSA: ['Practice', 'Problem of the Day', 'Theory', 'Contest'],
  LLD: ['Practice', 'Theory', 'Machine Coding'],
  HLD: ['Practice', 'Concepts', 'Word of the Day'],
};

const DSA_TYPES = [
  'Arrays','Strings','Linked List','Stack','Queue','Trees',
  'Binary Search Tree','Graphs','Dynamic Programming','Binary Search',
  'Sorting','Hashing','Heap / Priority Queue','Greedy','Backtracking',
  'Two Pointers','Sliding Window','Math','Bit Manipulation','Trie',
  'Segment Tree','Disjoint Set (Union Find)','Monotonic Stack',
  'Recursion','Divide & Conquer',
];

// ─── State ────────────────────────────────────
let selectedDiff    = 'Medium';
let selectedDSATypes = new Set();
let customTags      = [];
let diagramBase64   = '';
let diagramUrl      = '';
let editId          = null;   // non-null when editing an existing entry

// ─── DOM ──────────────────────────────────────
const $ = id => document.getElementById(id);
const catEl        = $('f-category');
const subCatEl     = $('f-subcategory');
const dsaSection   = $('dsa-types-section');
const dsaChipsEl   = $('dsa-type-chips');
const customInput  = $('f-custom-tag-input');
const customList   = $('custom-tags-list');
const uploadArea   = $('upload-area');
const fileInput    = $('f-diagram-file');
const diagramUrlIn = $('f-diagram-url');
const statusEl     = $('form-status');
const createBtn    = $('btn-create');

// ─── Theme ────────────────────────────────────
const themeToggle = $('theme-toggle');
const savedTheme  = localStorage.getItem('ddp-theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);
themeToggle.textContent = savedTheme === 'dark' ? '🌙' : '☀️';
themeToggle.addEventListener('click', () => {
  const cur  = document.documentElement.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  themeToggle.textContent = next === 'dark' ? '🌙' : '☀️';
  localStorage.setItem('ddp-theme', next);
});

// ─── Default date ─────────────────────────────
$('f-date').value = new Date().toISOString().split('T')[0];

// ─── Build DSA type chips ─────────────────────
function buildDSAChips() {
  dsaChipsEl.innerHTML = DSA_TYPES.map(item =>
    '<span class="chip" data-val="' + item + '">' + item + '</span>'
  ).join('');

  dsaChipsEl.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const val = chip.dataset.val;
      if (selectedDSATypes.has(val)) {
        selectedDSATypes.delete(val);
        chip.classList.remove('selected-dsa');
      } else {
        selectedDSATypes.add(val);
        chip.classList.add('selected-dsa');
      }
    });
  });
}

buildDSAChips();

// ─── Category change ──────────────────────────
catEl.addEventListener('change', () => {
  const cat = catEl.value;
  subCatEl.disabled   = !cat;
  subCatEl.innerHTML  = cat
    ? '<option value="">— Select sub-category —</option>' +
      SUBCATEGORIES[cat].map(s => '<option value="' + s + '">' + s + '</option>').join('')
    : '<option value="">— Select category first —</option>';
  dsaSection.style.display = cat === 'DSA' ? 'block' : 'none';
});

// ─── Difficulty ───────────────────────────────
function setDifficulty(diff) {
  selectedDiff = diff;
  document.querySelectorAll('.diff-btn').forEach(b => {
    b.className = 'diff-btn';
    if (b.dataset.diff === diff) b.classList.add('active-' + diff.toLowerCase());
  });
}

document.querySelectorAll('.diff-btn').forEach(btn => {
  btn.addEventListener('click', () => setDifficulty(btn.dataset.diff));
});

// Default: highlight Medium
setDifficulty('Medium');

// ─── Custom Tags ──────────────────────────────
function addCustomTag(tag) {
  tag = tag.trim();
  if (!tag || customTags.includes(tag)) return;
  customTags.push(tag);
  renderCustomTags();
  customInput.value = '';
}

function removeCustomTag(tag) {
  customTags = customTags.filter(t => t !== tag);
  renderCustomTags();
}

function renderCustomTags() {
  customList.innerHTML = customTags.map(t =>
    '<span class="custom-tag-chip">' + t +
    ' <span class="custom-tag-remove" onclick="removeCustomTag(\'' + t + '\')">✕</span>' +
    '</span>'
  ).join('');
}

$('btn-add-tag').addEventListener('click', () => addCustomTag(customInput.value));
customInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); addCustomTag(customInput.value); }
});
window.removeCustomTag = removeCustomTag;

// ─── Image Upload ─────────────────────────────
fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    showFormToast('Image too large (max 2MB). Please use a URL instead.', 'error');
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    diagramBase64 = e.target.result;
    diagramUrl    = '';
    diagramUrlIn.value = '';
    uploadArea.classList.add('has-image');
    $('upload-preview-wrap').innerHTML =
      '<img src="' + diagramBase64 + '" class="upload-preview" />' +
      '<div class="upload-text" style="font-size:0.75rem;margin-top:4px">✓ ' + file.name + '</div>';
  };
  reader.readAsDataURL(file);
});

diagramUrlIn.addEventListener('input', () => {
  diagramUrl    = diagramUrlIn.value.trim();
  diagramBase64 = '';
  if (diagramUrl) {
    uploadArea.classList.add('has-image');
    $('upload-preview-wrap').innerHTML =
      '<img src="' + diagramUrl + '" class="upload-preview" onerror="this.style.display=\'none\'" />' +
      '<div class="upload-text" style="margin-top:4px">✓ URL set</div>';
  }
});

// ─── Validation ───────────────────────────────
function validate() {
  const required = [
    { id: 'f-date',        label: 'Date' },
    { id: 'f-category',    label: 'Category' },
    { id: 'f-subcategory', label: 'Sub-category' },
    { id: 'f-title',       label: 'Title' },
    { id: 'f-topic',       label: 'Topic' },
    { id: 'f-description', label: 'Problem Statement' },
  ];
  for (const { id, label } of required) {
    const el = $(id);
    if (!el.value.trim()) {
      el.focus();
      el.style.borderColor = '#ef4444';
      setTimeout(() => { el.style.borderColor = ''; }, 2000);
      statusEl.textContent  = '⚠️ ' + label + ' is required';
      statusEl.style.color  = '#f87171';
      return false;
    }
  }
  statusEl.textContent = '';
  return true;
}

// ─── Build question object from form ─────────
function buildQuestionFromForm(existingId) {
  return {
    id:          existingId || ('user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)),
    date:        $('f-date').value,
    category:    catEl.value,
    subcategory: subCatEl.value,
    title:       $('f-title').value.trim(),
    topic:       $('f-topic').value.trim(),
    difficulty:  selectedDiff || 'Medium',
    dsaTags:     [...selectedDSATypes],
    customTags:  [...customTags],
    description: $('f-description').value.trim(),
    diagram:     diagramBase64 || diagramUrl,
    video:       $('f-video').value.trim(),
    code:        $('f-code').value.trim(),
    codeLanguage:$('f-lang').value,
    source:      'user',
    createdAt:   existingId ? undefined : Date.now(),
    updatedAt:   Date.now(),
  };
}

// ─── Save / Update ────────────────────────────
createBtn.addEventListener('click', async () => {
  if (!validate()) return;

  createBtn.disabled    = true;
  createBtn.textContent = '⏳ Saving…';

  const question = buildQuestionFromForm(editId);

  try {
    if (editId) {
      await DDPStore.update(question);
      showFormToast('✅ Entry updated!', 'success');
      createBtn.textContent = '✓ Updated!';
    } else {
      await DDPStore.save(question);
      showFormToast('✨ Entry saved permanently!', 'success');
      createBtn.textContent = '✓ Saved!';
    }

    statusEl.textContent = DDPStore.IS_SERVER
      ? '💾 Saved to data/user-questions.json'
      : '📦 Saved to browser storage';
    statusEl.style.color = '#34d399';

    setTimeout(() => {
      window.close();
      window.location.href = 'index.html';
    }, 1500);
  } catch (err) {
    createBtn.disabled    = false;
    createBtn.textContent = editId ? '💾 Update Entry' : '✨ Create Entry';
    showFormToast('❌ Save failed. Is the server running? (bash start.sh)', 'error');
    statusEl.textContent = '⚠️ Could not save';
    statusEl.style.color = '#f87171';
  }
});

// ─── Toast ────────────────────────────────────
function showFormToast(msg, type) {
  type = type || 'success';
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.borderColor = type === 'error' ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.4)';
  toast.style.color       = type === 'error' ? '#f87171' : '#34d399';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ─── EDIT MODE — Pre-fill form ─────────────────
(async function initEditMode() {
  const params = new URLSearchParams(window.location.search);
  editId = params.get('edit');
  if (!editId) return;

  const q = await DDPStore.getById(editId);
  if (!q) {
    showFormToast('⚠️ Entry not found. Creating a new one instead.', 'error');
    editId = null;
    return;
  }

  // Update page chrome
  document.title                        = 'Edit Entry — Daily Dose of Practise';
  $('form-hero-title').textContent      = '✏️ Edit Entry';
  $('form-hero-sub').textContent        = 'Update the details below. Changes are saved permanently in this browser.';
  createBtn.textContent                 = '💾 Update Entry';

  // Basic fields
  $('f-date').value  = q.date || '';
  $('f-title').value = q.title || '';
  $('f-topic').value = q.topic || '';

  // Category + subcategory
  if (q.category) {
    catEl.value = q.category;
    catEl.dispatchEvent(new Event('change'));   // triggers subcategory population
    if (q.subcategory) {
      // Use timeout to ensure subcategory options are rendered
      setTimeout(() => {
        subCatEl.value = q.subcategory;
      }, 0);
    }
  }

  // Difficulty
  if (q.difficulty) setDifficulty(q.difficulty);

  // DSA type chips
  if (q.dsaTags && q.dsaTags.length) {
    q.dsaTags.forEach(t => {
      selectedDSATypes.add(t);
      const chip = dsaChipsEl.querySelector('[data-val="' + t + '"]');
      if (chip) chip.classList.add('selected-dsa');
    });
  }

  // Custom tags
  if (q.customTags && q.customTags.length) {
    customTags = [...q.customTags];
    renderCustomTags();
  }

  // Description
  $('f-description').value = q.description || '';

  // Diagram
  if (q.diagram) {
    if (q.diagram.startsWith('data:')) {
      diagramBase64 = q.diagram;
      uploadArea.classList.add('has-image');
      $('upload-preview-wrap').innerHTML =
        '<img src="' + diagramBase64 + '" class="upload-preview" />' +
        '<div class="upload-text" style="font-size:0.75rem;margin-top:4px">✓ Existing image loaded</div>';
    } else {
      diagramUrl = q.diagram;
      diagramUrlIn.value = q.diagram;
      uploadArea.classList.add('has-image');
      $('upload-preview-wrap').innerHTML =
        '<img src="' + diagramUrl + '" class="upload-preview" onerror="this.style.display=\'none\'" />' +
        '<div class="upload-text" style="margin-top:4px">✓ URL set</div>';
    }
  }

  // Video
  $('f-video').value = q.video || '';

  // Code
  $('f-code').value  = q.code || '';
  if (q.codeLanguage) $('f-lang').value = q.codeLanguage;
})();
