/**
 * huffman.js — Core Huffman Coding Engine
 * HUFFZIP – Greedy Compression Lab
 *
 * Implements:
 *  - HuffmanNode       : Binary tree node
 *  - MinHeap           : Custom min-priority queue
 *  - buildFrequencyMap : Character frequency counter
 *  - buildHuffmanTree  : Greedy tree construction
 *  - generateCodes     : Recursive code assignment
 *  - encode            : Text → binary string
 *  - getCompressionStats: Bit metrics calculation
 */

'use strict';

/* ═══════════════════════════════════════════════════════════════════
   1. HUFFMAN NODE
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Represents a single node in the Huffman binary tree.
 *
 * @param {string|null} char      - The character (null for internal nodes).
 * @param {number}      freq      - The frequency / weight of the node.
 * @param {HuffmanNode} [left]    - Left child node (0 path).
 * @param {HuffmanNode} [right]   - Right child node (1 path).
 */
class HuffmanNode {
  constructor(char, freq, left = null, right = null) {
    this.char  = char;   // null for internal nodes
    this.freq  = freq;   // character frequency or combined frequency
    this.left  = left;   // 0-branch
    this.right = right;  // 1-branch
  }

  /** Returns true if this node is a leaf (holds an actual character). */
  isLeaf() {
    return this.left === null && this.right === null;
  }
}


/* ═══════════════════════════════════════════════════════════════════
   2. MIN HEAP (PRIORITY QUEUE)
   ═══════════════════════════════════════════════════════════════════ */

/**
 * A custom binary min-heap that stores HuffmanNode objects.
 * The heap property: parent.freq <= child.freq.
 *
 * Operations:
 *   insert(node)  — O(log n)
 *   extractMin()  — O(log n)
 *   peek()        — O(1)
 *   size          — O(1)
 */
class MinHeap {
  constructor() {
    /** @type {HuffmanNode[]} */
    this._heap = [];
  }

  /** Number of elements in the heap. */
  get size() {
    return this._heap.length;
  }

  /** Returns the minimum node without removing it. */
  peek() {
    return this._heap[0] || null;
  }

  /**
   * Inserts a new node and restores the heap property (sift up).
   * @param {HuffmanNode} node
   */
  insert(node) {
    this._heap.push(node);
    this._siftUp(this._heap.length - 1);
  }

  /**
   * Removes and returns the minimum-frequency node (sift down).
   * @returns {HuffmanNode|null}
   */
  extractMin() {
    if (this._heap.length === 0) return null;
    if (this._heap.length === 1) return this._heap.pop();

    const min = this._heap[0];
    // Move last element to root, then restore heap
    this._heap[0] = this._heap.pop();
    this._siftDown(0);
    return min;
  }

  // ── Private Helpers ──────────────────────────────────────────────

  /**
   * Returns the index of the parent of node at index i.
   * @param {number} i
   */
  _parent(i) { return Math.floor((i - 1) / 2); }

  /**
   * Returns the index of the left child of node at index i.
   * @param {number} i
   */
  _left(i) { return 2 * i + 1; }

  /**
   * Returns the index of the right child of node at index i.
   * @param {number} i
   */
  _right(i) { return 2 * i + 2; }

  /**
   * Swaps two elements in the heap array.
   * @param {number} i
   * @param {number} j
   */
  _swap(i, j) {
    [this._heap[i], this._heap[j]] = [this._heap[j], this._heap[i]];
  }

  /**
   * Moves element at index i upward until the heap property is restored.
   * @param {number} i
   */
  _siftUp(i) {
    while (i > 0) {
      const p = this._parent(i);
      if (this._heap[p].freq <= this._heap[i].freq) break;
      this._swap(i, p);
      i = p;
    }
  }

  /**
   * Moves element at index i downward until the heap property is restored.
   * @param {number} i
   */
  _siftDown(i) {
    const n = this._heap.length;
    while (true) {
      let smallest = i;
      const l = this._left(i);
      const r = this._right(i);

      if (l < n && this._heap[l].freq < this._heap[smallest].freq) {
        smallest = l;
      }
      if (r < n && this._heap[r].freq < this._heap[smallest].freq) {
        smallest = r;
      }

      if (smallest === i) break;
      this._swap(i, smallest);
      i = smallest;
    }
  }
}


/* ═══════════════════════════════════════════════════════════════════
   3. HUFFMAN ALGORITHM FUNCTIONS
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Builds a frequency map from a string of text.
 * Each entry maps a character to its occurrence count.
 *
 * Time Complexity: O(n)
 *
 * @param   {string} text
 * @returns {Map<string, number>} — Character → frequency
 */
function buildFrequencyMap(text) {
  const freqMap = new Map();
  for (const ch of text) {
    freqMap.set(ch, (freqMap.get(ch) || 0) + 1);
  }
  return freqMap;
}


/**
 * Constructs the Huffman tree using a greedy approach:
 *   1. Create a leaf node for every character.
 *   2. Insert all nodes into a min-heap.
 *   3. Repeat until 1 node remains:
 *        a. Extract two minimum-frequency nodes (left, right).
 *        b. Create an internal node whose freq = left.freq + right.freq.
 *        c. Insert the new node back.
 *   4. The surviving node is the root.
 *
 * Time Complexity: O(n log n)
 *
 * @param   {Map<string, number>} freqMap
 * @returns {HuffmanNode} root of the Huffman tree
 * @throws  {Error} if the input text is empty
 */
function buildHuffmanTree(freqMap) {
  if (freqMap.size === 0) {
    throw new Error('Cannot build Huffman tree from empty input.');
  }

  const heap = new MinHeap();

  // Step 1 & 2: Leaf nodes → heap
  for (const [char, freq] of freqMap) {
    heap.insert(new HuffmanNode(char, freq));
  }

  // Edge case: single unique character
  if (heap.size === 1) {
    const only = heap.extractMin();
    // Wrap it in a dummy internal node so the tree still has a root
    return new HuffmanNode(null, only.freq, only, null);
  }

  // Step 3: Greedy merge
  while (heap.size > 1) {
    const left  = heap.extractMin(); // lower frequency
    const right = heap.extractMin(); // next lowest

    const merged = new HuffmanNode(
      null,             // internal node has no character
      left.freq + right.freq,
      left,
      right
    );
    heap.insert(merged);
  }

  // Step 4: Return the root
  return heap.extractMin();
}


/**
 * Recursively traverses the Huffman tree and assigns binary codes to
 * each leaf node.
 *   - Going LEFT  adds '0' to the current code.
 *   - Going RIGHT adds '1' to the current code.
 *
 * @param   {HuffmanNode}         node     - Current tree node.
 * @param   {string}              code     - Accumulated binary string so far.
 * @param   {Map<string, string>} codeMap  - Output map (char → binary code).
 */
function generateCodes(node, code, codeMap) {
  if (node === null) return;

  if (node.isLeaf()) {
    // Assign at least '0' if the tree has only one unique character
    codeMap.set(node.char, code.length > 0 ? code : '0');
    return;
  }

  generateCodes(node.left,  code + '0', codeMap);
  generateCodes(node.right, code + '1', codeMap);
}


/**
 * Encodes a string using the provided Huffman code map.
 *
 * @param   {string}              text    - Original text.
 * @param   {Map<string, string>} codeMap - Character → binary code.
 * @returns {string} — Encoded binary string.
 */
function encode(text, codeMap) {
  let encoded = '';
  for (const ch of text) {
    encoded += codeMap.get(ch) || '';
  }
  return encoded;
}


/**
 * Calculates compression metrics.
 *
 * @param   {string} text         - Original text.
 * @param   {string} encodedText  - Huffman-encoded binary string.
 * @returns {{ originalBits, compressedBits, spaceSaved, ratio, savedPct }}
 */
function getCompressionStats(text, encodedText) {
  // Standard encoding: 8 bits per character (ASCII/UTF-8 approximation)
  const originalBits    = text.length * 8;
  const compressedBits  = encodedText.length;
  const spaceSaved      = originalBits - compressedBits;
  const ratio           = originalBits > 0
    ? (originalBits / compressedBits).toFixed(2)
    : '0';
  const savedPct        = originalBits > 0
    ? ((spaceSaved / originalBits) * 100).toFixed(1)
    : '0';

  return {
    originalBits,
    compressedBits,
    spaceSaved,
    ratio,
    savedPct,
  };
}


/**
 * Full Huffman compression pipeline.
 * Returns everything needed for the UI in a single call.
 *
 * @param   {string} text
 * @returns {{
 *   freqMap:       Map<string, number>,
 *   root:          HuffmanNode,
 *   codeMap:       Map<string, string>,
 *   encodedText:   string,
 *   stats:         object,
 * }}
 */
function compressText(text) {
  if (!text || text.length === 0) {
    throw new Error('Input text is empty. Please upload a non-empty .txt file.');
  }

  const freqMap     = buildFrequencyMap(text);
  const root        = buildHuffmanTree(freqMap);
  const codeMap     = new Map();
  generateCodes(root, '', codeMap);
  const encodedText = encode(text, codeMap);
  const stats       = getCompressionStats(text, encodedText);

  return { freqMap, root, codeMap, encodedText, stats };
}


/* ── Exports (accessible globally since no module bundler) ─────────── */
window.HuffmanNode    = HuffmanNode;
window.MinHeap        = MinHeap;
window.compressText   = compressText;
window.buildFrequencyMap = buildFrequencyMap;
window.generateCodes  = generateCodes;
