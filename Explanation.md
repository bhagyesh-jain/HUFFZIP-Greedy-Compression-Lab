## 📖 Huffman Coding Algorithm

Huffman Coding is an algorithm developed by David A. Huffman in 1952.  
It is used to compress data by assigning **shorter codes to more frequent characters** and **longer codes to less frequent characters**, minimizing the total number of bits required.

### 🔑 Steps of the Algorithm

1. **Frequency Count**
   - Count the frequency of each character in the input text.

2. **Priority Queue (Min Heap)**
   - Insert all characters into a min heap, prioritized by frequency.

3. **Build Huffman Tree**
   - While more than one node remains:
     - Extract the two nodes with the lowest frequency.
     - Create a new internal node with these two as children.
     - The new node’s frequency = sum of the two nodes.
     - Insert the new node back into the heap.
   - The final node is the root of the Huffman Tree.

4. **Generate Codes**
   - Traverse the tree:
     - Assign `0` for left edges and `1` for right edges.
     - Each leaf node (character) gets a unique binary code.
   - The codes are **prefix-free** (no code is a prefix of another).

5. **Encoding**
   - Replace each character in the input with its Huffman code.
   - The result is a compressed binary string.

6. **Decoding**
   - Use the Huffman Tree to decode the binary string back into the original text.

---

### 📊 Example

Input: `ABRACADABRA`

- Frequencies:  
  - A: 5  
  - B: 2  
  - R: 2  
  - C: 1  
  - D: 1  

- Huffman Tree built from these frequencies.  
- Example codes (may vary depending on tree structure):  
  - A → `0`  
  - B → `110`  
  - R → `111`  
  - C → `100`  
  - D → `101`  

Encoded string: `0111010010110...` (shorter than fixed-length encoding).