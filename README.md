# eth-dapps wallet dashboard

This project is a read-only wallet dashboard. It connects to an injected EVM wallet, detects the active network, and reads native/USDT balances. It does not request transaction permissions.

## Requirements
- Node.js 18 or newer (Node.js 20+ recommended)
- npm

## Run locally
1. Extract this ZIP.
2. Open a terminal in the `eth-dapps-setup-project` folder.
3. Install dependencies: `npm install`
4. Start Vite: `npm run dev`
5. Open the local URL printed by Vite.

## Production build
Run `npm run build`. The generated site is written to `dist/`.

## Theme integration
The original `src/App.jsx` wallet connection and balance-reading logic was retained unchanged. The supplied theme CSS is applied through `src/index.css` and `src/App.css`.
