# HUFFZIP – Greedy Compression Lab

An **ADA (Analysis and Design of Algorithms) mini-project** that demonstrates **Huffman Coding** (Greedy Algorithm) for text file compression.  
This is a **frontend-only web application** built with pure HTML, CSS, and Vanilla JavaScript — no frameworks, no external APIs, no backend. Everything runs offline in the browser.

---

## 🚀 Features

- 📂 Upload `.txt` files using **FileReader API**
- 📝 Display original text content
- 📊 Build a **character frequency table**
- ⚙️ Implement Huffman Coding from scratch:
  - Custom `Node` class
  - Custom Min Heap / Priority Queue
  - Huffman Tree construction
  - Recursive binary code generation
  - Text encoding
  - Compression statistics:
    - Original size in bits
    - Compressed size in bits
    - Space saved
    - Compression ratio
- 🌳 Visualize the Huffman Tree using **pure SVG**
  - Root node: Mint
  - Internal nodes: Pink
  - Leaf nodes: Yellow
  - Thick black borders
- 💾 Download compressed binary output as `.HUFF` file
- 📖 Algorithm information section:
  - Algorithm: Huffman Coding
  - Category: Greedy Algorithm
  - Time Complexity: `O(n log n)`
  - Space Complexity: `O(n)`
  - Applications: ZIP, PNG, JPEG, Data Compression

---

## 🎨 UI & Design

Inspired by **Neobrutalism** (Brutal Pages, TypeUI).

- **Color Palette**
  - Background: `#F4F3EC`
  - Cream Cards: `#FFF4CC`
  - Yellow Accent: `#FFE600`
  - Pink Accent: `#FF5CA8`
  - Mint Accent: `#98F5C0`
  - Black: `#000000`

- **Design Rules**
  - Thick 5px black borders
  - Large border radius (28px–32px)
  - Hard black shadows (`box-shadow: 10px 10px 0 #000`)
  - Bold typography
  - Minimal animations
  - Responsive for desktop & mobile

- **Typography**
  - Headings: [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk)
  - Body: [DM Sans](https://fonts.google.com/specimen/DM+Sans)

---

## 📂 Folder Structure
HuffZIP
│   index.html
│   
├───css
│       style.css
│       
└───js
        app.js
        huffman.js
        treeRenderer.js
---

## 🛠️ Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript (ES6+)
- Pure SVG for visualization
- No frameworks, no npm packages, no backend

---

## 📱 Accessibility & Code Quality

- Semantic HTML
- Modular JavaScript
- Clean separation of concerns
- Responsive design
- Accessibility considerations
- Well-commented and structured code

---

## 📜 License

This project is created for educational purposes as part of ADA coursework.  
Feel free to fork, modify, and experiment with it.

