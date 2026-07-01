/**
 * app.js — HUFFZIP Application Controller
 * HUFFZIP – Greedy Compression Lab
 *
 * Orchestrates:
 *  - File upload (FileReader API)
 *  - Compression trigger
 *  - UI updates (text display, stats, frequency table, tree, output)
 *  - Download .huff file
 *  - Copy to clipboard
 *  - Zoom controls for tree
 *  - Navigation menu toggle
 *  - Toast notifications
 */

'use strict';

/* ═══════════════════════════════════════════════════════════════════
   DOM REFERENCES
   ═══════════════════════════════════════════════════════════════════ */

// Navbar
const navMenuBtn     = document.getElementById('navMenuBtn');
const navDropdown    = document.getElementById('navDropdown');

// Hero / File Upload
const fileInput        = document.getElementById('fileInput');
const uploadBtn        = document.getElementById('uploadBtn');
const compressBtn      = document.getElementById('compressBtn');
const fileInfoStrip    = document.getElementById('fileInfoStrip');
const fileNameEl       = document.getElementById('fileName');
const fileSizeEl       = document.getElementById('fileSize');

// Text + Stats Section
const textSection      = document.getElementById('text-section');
const originalTextEl   = document.getElementById('originalTextDisplay');
const charCountBadge   = document.getElementById('charCountBadge');

const origBitsVal      = document.getElementById('origBitsVal');
const compBitsVal      = document.getElementById('compBitsVal');
const spaceSavedVal    = document.getElementById('spaceSavedVal');
const compRatioVal     = document.getElementById('compRatioVal');
const compBar          = document.getElementById('compBar');
const compBarPct       = document.getElementById('compBarPct');

// Frequency Table Section
const freqSection      = document.getElementById('freq-section');
const freqTableBody    = document.getElementById('freqTableBody');
const uniqueCharBadge  = document.getElementById('uniqueCharBadge');

// Tree Section
const treeSection      = document.getElementById('tree-section');
const treeSvgWrap      = document.getElementById('treeSvgWrap');
const zoomInBtn        = document.getElementById('zoomInBtn');
const zoomOutBtn       = document.getElementById('zoomOutBtn');
const resetZoomBtn     = document.getElementById('resetZoomBtn');

// Output Section
const outputSection    = document.getElementById('output-section');
const encodedOutput    = document.getElementById('encodedOutput');
const outputMeta       = document.getElementById('outputMeta');
const copyOutputBtn    = document.getElementById('copyOutputBtn');
const downloadBtn      = document.getElementById('downloadBtn');

// Toast
const toastEl          = document.getElementById('toast');


/* ═══════════════════════════════════════════════════════════════════
   APPLICATION STATE
   ═══════════════════════════════════════════════════════════════════ */

const state = {
  originalText:  '',         // raw file content
  fileName:      '',         // uploaded file name
  fileSize:      0,          // file size in bytes
  compressed:    null,       // result from compressText()
  zoomLevel:     1.0,        // current SVG zoom scale
};

const ZOOM_STEP = 0.2;
const ZOOM_MIN  = 0.3;
const ZOOM_MAX  = 3.0;


/* ═══════════════════════════════════════════════════════════════════
   TOAST NOTIFICATION
   ═══════════════════════════════════════════════════════════════════ */

let toastTimer = null;

/**
 * Shows a brief toast notification.
 * @param {string}  message
 * @param {number}  [duration=2500]  - Display time in ms
 */
function showToast(message, duration = 2500) {
  if (toastTimer) clearTimeout(toastTimer);
  toastEl.textContent = message;
  toastEl.classList.add('show');
  toastTimer = setTimeout(() => {
    toastEl.classList.remove('show');
  }, duration);
}


/* ═══════════════════════════════════════════════════════════════════
   FILE UPLOAD
   ═══════════════════════════════════════════════════════════════════ */

/** Proxy the upload button click to the hidden file input. */
uploadBtn.addEventListener('click', () => {
  fileInput.click();
});

/** Handle file selection. */
fileInput.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Validate file type
  if (!file.name.toLowerCase().endsWith('.txt') && file.type !== 'text/plain') {
    showToast('⚠️ Please upload a .txt file only.');
    return;
  }

  // Validate file is not empty
  if (file.size === 0) {
    showToast('⚠️ The file is empty. Please choose a non-empty .txt file.');
    return;
  }

  state.fileName = file.name;
  state.fileSize = file.size;

  // Read the file
  const reader = new FileReader();
  reader.onload  = (ev) => handleFileLoaded(ev.target.result);
  reader.onerror = ()   => showToast('❌ Failed to read the file.');
  reader.readAsText(file, 'UTF-8');
});

/**
 * Called once FileReader successfully loads the file content.
 * @param {string} text
 */
function handleFileLoaded(text) {
  if (!text || text.length === 0) {
    showToast('⚠️ The file appears to be empty.');
    return;
  }

  state.originalText = text;
  state.compressed   = null; // reset previous compression

  // Update file info strip
  fileInfoStrip.hidden = false;
  fileNameEl.textContent = state.fileName;
  fileSizeEl.textContent = formatBytes(state.fileSize);

  // Enable compress button
  compressBtn.disabled     = false;
  compressBtn.removeAttribute('aria-disabled');

  showToast('✅ File loaded! Click "Compress File" to proceed.');
}


/* ═══════════════════════════════════════════════════════════════════
   COMPRESSION
   ═══════════════════════════════════════════════════════════════════ */

/** Trigger Huffman compression and update all UI sections. */
compressBtn.addEventListener('click', () => {
  if (!state.originalText) {
    showToast('⚠️ Please upload a .txt file first.');
    return;
  }

  // Show loading state
  compressBtn.disabled = true;
  compressBtn.innerHTML = `<span class="spinner"></span> Compressing…`;

  // Defer to next tick so the UI can repaint before heavy computation
  setTimeout(() => {
    try {
      const result = compressText(state.originalText);
      state.compressed = result;

      updateTextSection();
      updateStats(result.stats);
      updateFrequencyTable(result.freqMap, result.codeMap);
      updateTree(result.root);
      updateOutput(result.encodedText, result.stats);

      revealSections();
      scrollToSection('text-section');
      showToast('🎉 Compression complete!');

    } catch (err) {
      showToast('❌ Error: ' + err.message, 4000);
      console.error('[HUFFZIP] Compression error:', err);
    } finally {
      compressBtn.disabled = false;
      compressBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        Compress File`;
    }
  }, 60);
});


/* ═══════════════════════════════════════════════════════════════════
   UI UPDATERS
   ═══════════════════════════════════════════════════════════════════ */

/** Updates the original text display and character count badge. */
function updateTextSection() {
  const text = state.originalText;

  // Render text content (escape HTML entities for safety)
  originalTextEl.textContent = text;

  // Character count badge
  charCountBadge.textContent = `${text.length.toLocaleString()} chars`;

  textSection.hidden = false;
  textSection.classList.add('fade-up');
}


/** Updates the compression statistics section. */
function updateStats(stats) {
  origBitsVal.textContent   = stats.originalBits.toLocaleString();
  compBitsVal.textContent   = stats.compressedBits.toLocaleString();
  spaceSavedVal.textContent = stats.spaceSaved.toLocaleString();
  compRatioVal.textContent  = stats.ratio;

  // Compression bar
  const pct = parseFloat(stats.savedPct);
  compBar.style.width = Math.max(5, (100 - pct)) + '%';
  compBarPct.textContent = `${pct}% space saved`;
}


/**
 * Builds and inserts the character frequency table rows.
 * @param {Map<string,number>} freqMap
 * @param {Map<string,string>} codeMap
 */
function updateFrequencyTable(freqMap, codeMap) {
  freqTableBody.innerHTML = '';

  // Sort by frequency descending
  const entries = Array.from(freqMap.entries())
    .sort((a, b) => b[1] - a[1]);

  // Find max frequency for the visual bar
  const maxFreq = entries.length > 0 ? entries[0][1] : 1;

  uniqueCharBadge.textContent = `${entries.length} unique chars`;

  const fragment = document.createDocumentFragment();

  for (const [char, freq] of entries) {
    const code      = codeMap.get(char) || '';
    const barWidth  = Math.max(4, Math.round((freq / maxFreq) * 120));
    const charLabel = formatCharDisplay(char);

    const tr = document.createElement('tr');
    tr.setAttribute('role', 'row');

    // Character column
    const tdChar = document.createElement('td');
    const charSpan = document.createElement('span');
    charSpan.className   = 'char-cell';
    charSpan.textContent = charLabel;
    charSpan.setAttribute('aria-label', `Character: ${charLabel}`);
    tdChar.appendChild(charSpan);

    // Frequency column
    const tdFreq = document.createElement('td');
    const freqWrap = document.createElement('div');
    freqWrap.className   = 'freq-bar-wrap';
    const freqBar = document.createElement('div');
    freqBar.className    = 'freq-bar';
    freqBar.style.width  = barWidth + 'px';
    freqBar.setAttribute('aria-hidden', 'true');
    const freqNum = document.createElement('span');
    freqNum.textContent = freq.toLocaleString();
    freqWrap.appendChild(freqBar);
    freqWrap.appendChild(freqNum);
    tdFreq.appendChild(freqWrap);

    // Code column
    const tdCode = document.createElement('td');
    const codeSpan = document.createElement('code');
    codeSpan.className   = 'code-cell';
    codeSpan.textContent = code;
    tdCode.appendChild(codeSpan);

    // Code length column
    const tdLen = document.createElement('td');
    tdLen.textContent = code.length + ' bits';

    tr.appendChild(tdChar);
    tr.appendChild(tdFreq);
    tr.appendChild(tdCode);
    tr.appendChild(tdLen);
    fragment.appendChild(tr);
  }

  freqTableBody.appendChild(fragment);
  freqSection.hidden = false;
  freqSection.classList.add('fade-up');
}


/**
 * Renders the Huffman tree SVG.
 * @param {HuffmanNode} root
 */
function updateTree(root) {
  state.zoomLevel = 1.0;
  renderTree(root, treeSvgWrap);
  treeSection.hidden = false;
  treeSection.classList.add('fade-up');
}


/**
 * Populates the encoded output textarea and meta info.
 * @param {string} encodedText
 * @param {Object} stats
 */
function updateOutput(encodedText, stats) {
  encodedOutput.value = encodedText;

  const totalChars = encodedText.length;
  const totalBytes = Math.ceil(totalChars / 8);
  outputMeta.textContent =
    `${totalChars.toLocaleString()} bits · ≈${totalBytes.toLocaleString()} bytes · ` +
    `${stats.savedPct}% smaller than original`;

  outputSection.hidden = false;
  outputSection.classList.add('fade-up');
}


/** Shows all result sections with a smooth fade. */
function revealSections() {
  // Sections are shown individually in their respective updaters
  // This is kept in case of future batch reveal
}


/* ═══════════════════════════════════════════════════════════════════
   ZOOM CONTROLS
   ═══════════════════════════════════════════════════════════════════ */

zoomInBtn.addEventListener('click', () => {
  state.zoomLevel = Math.min(ZOOM_MAX, state.zoomLevel + ZOOM_STEP);
  applyZoom();
});

zoomOutBtn.addEventListener('click', () => {
  state.zoomLevel = Math.max(ZOOM_MIN, state.zoomLevel - ZOOM_STEP);
  applyZoom();
});

resetZoomBtn.addEventListener('click', () => {
  state.zoomLevel = 1.0;
  applyZoom();
});

/** Applies the current zoom level to the SVG inside the tree wrapper. */
function applyZoom() {
  const svg = treeSvgWrap.querySelector('svg');
  if (!svg) return;
  svg.style.transform       = `scale(${state.zoomLevel})`;
  svg.style.transformOrigin = 'top left';
}


/* ═══════════════════════════════════════════════════════════════════
   DOWNLOAD & COPY
   ═══════════════════════════════════════════════════════════════════ */

/** Downloads the encoded binary string as a .huff text file. */
downloadBtn.addEventListener('click', () => {
  const encoded = encodedOutput.value;
  if (!encoded) {
    showToast('⚠️ Nothing to download yet.');
    return;
  }

  // Build file header with compression metadata
  const meta = state.compressed?.stats;
  const baseName = state.fileName.replace(/\.txt$/i, '');
  const header = [
    '=== HUFFZIP Encoded File ===',
    `Source File  : ${state.fileName}`,
    `Original     : ${meta?.originalBits.toLocaleString()} bits (${state.fileSize.toLocaleString()} bytes)`,
    `Compressed   : ${meta?.compressedBits.toLocaleString()} bits`,
    `Space Saved  : ${meta?.savedPct}%`,
    `Ratio        : ${meta?.ratio}:1`,
    `Algorithm    : Huffman Coding (Greedy)`,
    `Generated By : HUFFZIP – Greedy Compression Lab`,
    '===========================',
    '',
    'ENCODED BINARY:',
    encoded,
  ].join('\n');

  const blob = new Blob([header], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = baseName + '.huff';
  a.click();
  URL.revokeObjectURL(url);

  showToast('⬇️ Downloaded: ' + baseName + '.huff');
});


/** Copies the encoded binary string to the clipboard. */
copyOutputBtn.addEventListener('click', async () => {
  const encoded = encodedOutput.value;
  if (!encoded) {
    showToast('⚠️ Nothing to copy yet.');
    return;
  }

  try {
    await navigator.clipboard.writeText(encoded);
    showToast('📋 Copied to clipboard!');
  } catch {
    // Fallback for older browsers
    encodedOutput.select();
    document.execCommand('copy');
    showToast('📋 Copied!');
  }
});


/* ═══════════════════════════════════════════════════════════════════
   NAVIGATION MENU
   ═══════════════════════════════════════════════════════════════════ */

navMenuBtn.addEventListener('click', () => {
  const isOpen = navDropdown.classList.toggle('open');
  navMenuBtn.setAttribute('aria-expanded', String(isOpen));
  navDropdown.setAttribute('aria-hidden', String(!isOpen));
});

// Close menu on outside click
document.addEventListener('click', (e) => {
  if (!navMenuBtn.contains(e.target) && !navDropdown.contains(e.target)) {
    navDropdown.classList.remove('open');
    navMenuBtn.setAttribute('aria-expanded', 'false');
    navDropdown.setAttribute('aria-hidden', 'true');
  }
});

// Close menu on link click
navDropdown.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navDropdown.classList.remove('open');
    navMenuBtn.setAttribute('aria-expanded', 'false');
    navDropdown.setAttribute('aria-hidden', 'true');
  });
});


/* ═══════════════════════════════════════════════════════════════════
   DRAG AND DROP SUPPORT
   ═══════════════════════════════════════════════════════════════════ */

const heroCard = document.querySelector('.hero-card');

heroCard.addEventListener('dragover', (e) => {
  e.preventDefault();
  heroCard.style.transform = 'scale(1.01)';
});

heroCard.addEventListener('dragleave', () => {
  heroCard.style.transform = '';
});

heroCard.addEventListener('drop', (e) => {
  e.preventDefault();
  heroCard.style.transform = '';

  const file = e.dataTransfer?.files?.[0];
  if (!file) return;

  if (!file.name.toLowerCase().endsWith('.txt')) {
    showToast('⚠️ Please drop a .txt file.');
    return;
  }

  state.fileName = file.name;
  state.fileSize = file.size;

  const reader = new FileReader();
  reader.onload  = (ev) => handleFileLoaded(ev.target.result);
  reader.onerror = ()   => showToast('❌ Failed to read the file.');
  reader.readAsText(file, 'UTF-8');

  showToast('📂 File dropped: ' + file.name);
});


/* ═══════════════════════════════════════════════════════════════════
   KEYBOARD SHORTCUT
   ═══════════════════════════════════════════════════════════════════ */

document.addEventListener('keydown', (e) => {
  // Ctrl+O → open file picker
  if (e.ctrlKey && e.key === 'o') {
    e.preventDefault();
    fileInput.click();
  }
  // Ctrl+Enter → trigger compression
  if (e.ctrlKey && e.key === 'Enter') {
    if (!compressBtn.disabled) compressBtn.click();
  }
});


/* ═══════════════════════════════════════════════════════════════════
   UTILITY FUNCTIONS
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Formats bytes into a human-readable string.
 * @param   {number} bytes
 * @returns {string}
 */
function formatBytes(bytes) {
  if (bytes < 1024)        return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}


/**
 * Returns a human-readable display label for special characters.
 * @param   {string} char
 * @returns {string}
 */
function formatCharDisplay(char) {
  if (char === ' ')    return '[SPACE]';
  if (char === '\n')   return '[NEWLINE]';
  if (char === '\t')   return '[TAB]';
  if (char === '\r')   return '[CR]';
  if (char === '\0')   return '[NULL]';
  return char;
}


/**
 * Smooth-scrolls the viewport to a section by ID.
 * @param {string} sectionId
 */
function scrollToSection(sectionId) {
  const el = document.getElementById(sectionId);
  if (el) {
    setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  }
}


/* ═══════════════════════════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════════════════════════ */

(function init() {
  // Show keyboard hint toast after 2s
  setTimeout(() => {
    showToast('💡 Tip: Ctrl+O to open file • Ctrl+Enter to compress', 4000);
  }, 2000);
})();
