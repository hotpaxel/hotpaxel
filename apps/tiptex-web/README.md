<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1XVgZiIa-u5blDlz1dX1N3dWyJ-VevoD0

## Run Locally

**Prerequisites:**  Node.js (LTS), Bun

1. Install dependencies:
   `bun install`
2. Build the WASM dependency (from project root):
   `cd crates/hot && npm run build`
3. Run the app:
   `bun dev`

### 🏗️ Architecture
Tiptex Web is a React SPA powered by **Vite**. It encapsulates the **HOT WASM SDK** to perform local TeX/HTML conversions without server roundtrips, ensuring a snappy editing experience.
