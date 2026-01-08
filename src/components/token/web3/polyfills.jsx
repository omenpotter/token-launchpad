
import { Buffer } from 'buffer';

// Make Buffer available globally for Solana web3.js compatibility
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
  window.global = window;
  window.process = window.process || { env: {} };
}
