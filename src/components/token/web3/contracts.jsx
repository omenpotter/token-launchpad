import { PublicKey, clusterApiUrl } from '@solana/web3.js';

// X1 Network Configuration (SVM)
export const NETWORK_CONFIG = {
  x1Testnet: {
    name: 'X1 Testnet',
    rpcUrl: 'https://rpc.testnet.x1.xyz',
    chainId: 'x1-testnet',
    nativeCurrency: {
      name: 'XNT',
      symbol: 'XNT',
      decimals: 9
    },
    explorer: 'https://explorer.testnet.x1.xyz'
  },
  x1Mainnet: {
    name: 'X1 Mainnet',
    rpcUrl: 'https://rpc.mainnet.x1.xyz',
    chainId: 'x1-mainnet',
    nativeCurrency: {
      name: 'XNT',
      symbol: 'XNT',
      decimals: 9
    },
    explorer: 'https://explorer.mainnet.x1.xyz'
  }
};

// Program Addresses (Solana Programs)
export const PROGRAM_ADDRESSES = {
  x1Testnet: {
    TokenProgram: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    TokenFactory: 'FACTORY_PROGRAM_ADDRESS_TESTNET', // Replace with actual program address
    DEXProgram: 'DEX_PROGRAM_ADDRESS_TESTNET', // Replace with actual program address
    PresaleProgram: 'PRESALE_PROGRAM_ADDRESS_TESTNET' // Replace with actual program address
  },
  x1Mainnet: {
    TokenProgram: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    TokenFactory: 'FACTORY_PROGRAM_ADDRESS_MAINNET',
    DEXProgram: 'DEX_PROGRAM_ADDRESS_MAINNET',
    PresaleProgram: 'PRESALE_PROGRAM_ADDRESS_MAINNET'
  }
};

// Token Creation Fee (in XNT)
export const TOKEN_CREATION_FEE = 0.2; // XNT
export const PRESALE_CREATION_FEE = 0.2; // XNT
export const DIRECT_MINT_FEE = 0.2; // XNT