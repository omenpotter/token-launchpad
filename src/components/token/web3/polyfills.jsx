
// Import buffer for Solana web3.js compatibility
if (typeof window !== 'undefined') {
  window.Buffer = window.Buffer || require('buffer').Buffer;
  window.global = window;
  window.process = window.process || { env: {} };
}
