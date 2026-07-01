/**
 * treeRenderer.js — Pure SVG Huffman Tree Visualizer
 * HUFFZIP – Greedy Compression Lab
 *
 * Renders the Huffman binary tree into an SVG element with:
 *   - Mint-colored root node
 *   - Pink internal nodes
 *   - Yellow leaf nodes
 *   - Thick black borders on all nodes
 *   - 0/1 edge labels on each branch
 *   - Character + frequency labels on nodes
 *   - Pan support via mouse drag
 *   - Zoom buttons (handled in app.js)
 */

'use strict';

/* ═══════════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════════ */

const TREE_CONFIG = {
  nodeRadius:       28,    // px — circle radius
  levelHeight:      90,    // px — vertical distance between levels
  minHorizontalGap: 70,    // px — minimum gap between sibling nodes
  fontSize:         12,    // px — node label font size
  edgeLabelOffset:  20,    // px — how far the 0/1 label sits from the edge midpoint
  svgPadding:       60,    // px — padding around the whole tree
  strokeWidth:      4,     // px — node border thickness
  edgeStrokeWidth:  3,     // px — edge line thickness

  // Colors (must match CSS design tokens)
  colorRoot:     '#98F5C0', // mint
  colorInternal: '#FF5CA8', // pink
  colorLeaf:     '#FFE600', // yellow
  colorBlack:    '#000000',
  colorWhite:    '#FFFFFF',
  fontFamily:    'Space Grotesk, system-ui, sans-serif',
};


/* ═══════════════════════════════════════════════════════════════════
   LAYOUT ENGINE — computes (x, y) for every node
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Calculates the size (number of leaf-level columns needed) for a subtree.
 * This drives the x-positioning so nodes don't overlap.
 *
 * @param   {HuffmanNode} node
 * @returns {number}
 */
function subtreeWidth(node) {
  if (node === null) return 0;
  if (node.isLeaf()) return 1;
  return subtreeWidth(node.left) + subtreeWidth(node.right);
}


/**
 * Recursively assigns (x, y) coordinates to every node.
 *
 * @param {HuffmanNode} node
 * @param {number}      depth       - Current depth (root = 0)
 * @param {number}      xOffset     - Left boundary in "column units"
 * @param {number}      colWidth    - Pixel width per column unit
 * @param {Object[]}    nodeList    - Output array of { node, x, y, depth }
 * @param {Object[]}    edgeList    - Output array of { x1,y1, x2,y2, label }
 * @param {Object}      parentInfo  - { x, y } of parent (null for root)
 * @param {string}      edgeLabel   - '0' or '1' (empty for root)
 */
function layoutTree(node, depth, xOffset, colWidth, nodeList, edgeList, parentInfo, edgeLabel) {
  if (node === null) return;

  const sw = subtreeWidth(node);

  // Centre this node horizontally within its allocated columns
  const x = (xOffset + sw / 2) * colWidth;
  const y = depth * TREE_CONFIG.levelHeight + TREE_CONFIG.svgPadding;

  nodeList.push({ node, x, y, depth });

  if (parentInfo) {
    edgeList.push({
      x1: parentInfo.x,
      y1: parentInfo.y,
      x2: x,
      y2: y,
      label: edgeLabel,
    });
  }

  // Recurse into children
  const leftWidth = subtreeWidth(node.left);
  layoutTree(node.left,  depth + 1, xOffset,             colWidth, nodeList, edgeList, { x, y }, '0');
  layoutTree(node.right, depth + 1, xOffset + leftWidth, colWidth, nodeList, edgeList, { x, y }, '1');
}


/* ═══════════════════════════════════════════════════════════════════
   SVG HELPERS
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Creates an SVG element with a given tag name and attribute map.
 * @param {string} tag
 * @param {Object} attrs
 * @returns {SVGElement}
 */
function svgEl(tag, attrs = {}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
  return el;
}


/**
 * Returns the display label for a Huffman node.
 * - Leaf: character (with special name for whitespace) + frequency
 * - Internal: frequency only
 *
 * @param   {HuffmanNode} node
 * @returns {{ line1: string, line2: string }}
 */
function nodeLabel(node) {
  if (node.isLeaf()) {
    let charDisplay;
    if (node.char === ' ')  charDisplay = '⎵';       // visible space symbol
    else if (node.char === '\n') charDisplay = '↵';   // newline symbol
    else if (node.char === '\t') charDisplay = '↹';   // tab symbol
    else charDisplay = node.char;

    return { line1: charDisplay, line2: String(node.freq) };
  }
  return { line1: String(node.freq), line2: '' };
}


/**
 * Chooses the fill color for a node.
 * @param {HuffmanNode} node
 * @param {boolean}     isRoot
 * @returns {string}
 */
function nodeColor(node, isRoot) {
  if (isRoot)        return TREE_CONFIG.colorRoot;
  if (node.isLeaf()) return TREE_CONFIG.colorLeaf;
  return TREE_CONFIG.colorInternal;
}


/* ═══════════════════════════════════════════════════════════════════
   MAIN RENDER FUNCTION
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Renders the Huffman tree as an SVG into the given container element.
 *
 * @param {HuffmanNode} root       - Root of the Huffman tree.
 * @param {HTMLElement} container  - DOM element to render into (#treeSvgWrap).
 */
function renderTree(root, container) {
  // Clear previous render
  container.innerHTML = '';

  if (!root) {
    container.innerHTML = '<p style="padding:24px;color:#888;font-weight:700;">No tree to display.</p>';
    return;
  }

  // ── Compute layout ─────────────────────────────────────────────
  const leafCount = subtreeWidth(root);

  // Column width = ensure minimum gap between siblings
  const colWidth = Math.max(
    TREE_CONFIG.minHorizontalGap,
    TREE_CONFIG.nodeRadius * 2 + 20
  );

  const nodeList = [];
  const edgeList = [];

  layoutTree(root, 0, 0, colWidth, nodeList, edgeList, null, '');

  // Compute bounding box
  let maxX = 0, maxY = 0;
  for (const { x, y } of nodeList) {
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }

  const svgWidth  = maxX + TREE_CONFIG.svgPadding + TREE_CONFIG.nodeRadius;
  const svgHeight = maxY + TREE_CONFIG.svgPadding + TREE_CONFIG.nodeRadius;

  // ── Build SVG ──────────────────────────────────────────────────
  const svg = svgEl('svg', {
    width:   svgWidth,
    height:  svgHeight,
    viewBox: `0 0 ${svgWidth} ${svgHeight}`,
    'aria-label': 'Huffman Tree Diagram',
    role: 'img',
    style: 'display:block; min-width:' + svgWidth + 'px;',
  });

  // Define an arrowhead marker (not strictly needed but adds polish)
  const defs = svgEl('defs');
  const marker = svgEl('marker', {
    id: 'arrowhead',
    markerWidth: '8',
    markerHeight: '8',
    refX: '4',
    refY: '4',
    orient: 'auto',
  });
  const arrowPath = svgEl('path', {
    d: 'M0,0 L0,8 L8,4 z',
    fill: TREE_CONFIG.colorBlack,
  });
  marker.appendChild(arrowPath);
  defs.appendChild(marker);
  svg.appendChild(defs);

  // ── Draw Edges ─────────────────────────────────────────────────
  const edgeGroup = svgEl('g', { 'aria-hidden': 'true' });

  for (const edge of edgeList) {
    // Line
    const line = svgEl('line', {
      x1: edge.x1,
      y1: edge.y1,
      x2: edge.x2,
      y2: edge.y2,
      stroke: TREE_CONFIG.colorBlack,
      'stroke-width': TREE_CONFIG.edgeStrokeWidth,
      'stroke-linecap': 'round',
    });
    edgeGroup.appendChild(line);

    // Edge label (0 or 1) — placed at 35% along the edge from parent
    const lx = edge.x1 + (edge.x2 - edge.x1) * 0.35;
    const ly = edge.y1 + (edge.y2 - edge.y1) * 0.35;

    // Small background pill for readability
    const labelBg = svgEl('circle', {
      cx:   lx,
      cy:   ly,
      r:    10,
      fill: edge.label === '0' ? '#E0E0E0' : '#FFFFFF',
      stroke: TREE_CONFIG.colorBlack,
      'stroke-width': 2,
    });

    const labelText = svgEl('text', {
      x:           lx,
      y:           ly + 4,
      'text-anchor': 'middle',
      fill:        TREE_CONFIG.colorBlack,
      'font-family': TREE_CONFIG.fontFamily,
      'font-weight': '800',
      'font-size':   11,
    });
    labelText.textContent = edge.label;

    edgeGroup.appendChild(labelBg);
    edgeGroup.appendChild(labelText);
  }

  svg.appendChild(edgeGroup);

  // ── Draw Nodes ─────────────────────────────────────────────────
  const nodeGroup = svgEl('g');

  for (const { node, x, y, depth } of nodeList) {
    const isRoot = (depth === 0);
    const fill   = nodeColor(node, isRoot);
    const r      = TREE_CONFIG.nodeRadius;

    const group = svgEl('g', {
      role: 'img',
      'aria-label': node.isLeaf()
        ? `Leaf: char="${node.char}" freq=${node.freq}`
        : `Internal node: freq=${node.freq}`,
    });

    // Drop shadow
    const shadow = svgEl('circle', {
      cx:   x + 4,
      cy:   y + 4,
      r:    r,
      fill: 'rgba(0,0,0,0.25)',
    });
    group.appendChild(shadow);

    // Main circle
    const circle = svgEl('circle', {
      cx:             x,
      cy:             y,
      r:              r,
      fill:           fill,
      stroke:         TREE_CONFIG.colorBlack,
      'stroke-width': TREE_CONFIG.strokeWidth,
    });
    group.appendChild(circle);

    // Root gets a ring
    if (isRoot) {
      const ring = svgEl('circle', {
        cx:             x,
        cy:             y,
        r:              r + 6,
        fill:           'none',
        stroke:         TREE_CONFIG.colorBlack,
        'stroke-width': 2.5,
        'stroke-dasharray': '6 4',
      });
      group.appendChild(ring);
    }

    // Node label
    const { line1, line2 } = nodeLabel(node);

    if (line2) {
      // Two lines: char on top, freq below
      const textChar = svgEl('text', {
        x:               x,
        y:               y - 4,
        'text-anchor':   'middle',
        fill:            TREE_CONFIG.colorBlack,
        'font-family':   TREE_CONFIG.fontFamily,
        'font-weight':   '800',
        'font-size':     TREE_CONFIG.fontSize + 2,
      });
      textChar.textContent = line1;
      group.appendChild(textChar);

      const textFreq = svgEl('text', {
        x:               x,
        y:               y + 10,
        'text-anchor':   'middle',
        fill:            TREE_CONFIG.colorBlack,
        'font-family':   TREE_CONFIG.fontFamily,
        'font-weight':   '600',
        'font-size':     TREE_CONFIG.fontSize - 1,
        opacity:         0.75,
      });
      textFreq.textContent = line1 === String(node.freq) ? '' : String(node.freq);
      group.appendChild(textFreq);
    } else {
      // Single line: just frequency for internal nodes
      const textFreq = svgEl('text', {
        x:               x,
        y:               y + 5,
        'text-anchor':   'middle',
        fill:            TREE_CONFIG.colorBlack,
        'font-family':   TREE_CONFIG.fontFamily,
        'font-weight':   '800',
        'font-size':     TREE_CONFIG.fontSize,
      });
      textFreq.textContent = line1;
      group.appendChild(textFreq);
    }

    nodeGroup.appendChild(group);
  }

  svg.appendChild(nodeGroup);

  // ── Append to container ────────────────────────────────────────
  container.appendChild(svg);

  // ── Enable pan on the container ────────────────────────────────
  _enablePan(container);
}


/* ═══════════════════════════════════════════════════════════════════
   PAN SUPPORT
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Adds mouse-drag panning to the SVG container.
 * @param {HTMLElement} container
 */
function _enablePan(container) {
  let isDragging = false;
  let startX = 0, startY = 0;
  let scrollLeft = 0, scrollTop = 0;

  container.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX     = e.pageX - container.offsetLeft;
    startY     = e.pageY - container.offsetTop;
    scrollLeft = container.scrollLeft;
    scrollTop  = container.scrollTop;
  });

  container.addEventListener('mouseleave', () => { isDragging = false; });
  container.addEventListener('mouseup',    () => { isDragging = false; });

  container.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const y = e.pageY - container.offsetTop;
    const walkX = (x - startX) * 1.2;
    const walkY = (y - startY) * 1.2;
    container.scrollLeft = scrollLeft - walkX;
    container.scrollTop  = scrollTop  - walkY;
  });
}


/* ── Exports ─────────────────────────────────────────────────────── */
window.renderTree = renderTree;
