
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

// Fee recipient wallet address
export const FEE_RECIPIENT_ADDRESS = '2W3pa4Rn6xBrev2GDFSntzPd2nNMhJ17FHAZ5Gq2bWDW';

// Program Addresses (Solana Programs)
export const PROGRAM_ADDRESSES = {
  x1Testnet: {
    TokenProgram: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    DEXProgram: '11111111111111111111111111111111',
    PresaleProgram: '11111111111111111111111111111111'
  },
  x1Mainnet: {
    TokenProgram: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    DEXProgram: '11111111111111111111111111111111',
    PresaleProgram: '11111111111111111111111111111111'
  }
};

// Token Creation Fee (in XNT)
export const TOKEN_CREATION_FEE = 0.2; // XNT
export const PRESALE_CREATION_FEE = 0.2; // XNT
export const DIRECT_MINT_FEE = 0.2; // XNT
