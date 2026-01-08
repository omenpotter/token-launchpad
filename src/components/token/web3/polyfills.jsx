
import { Buffer } from 'buffer';

// Make Buffer available globally for Solana web3.js compatibility
if (typeof window !== 'undefined') {
  window.Buffer = window.Buffer || Buffer;
  window.global = window.global || window;
  window.process = window.process || { 
    env: {},
    version: '',
    nextTick: (fn, ...args) => setTimeout(() => fn(...args), 0)
  };
}

// Ensure Buffer is also available as a global
globalThis.Buffer = Buffer;
