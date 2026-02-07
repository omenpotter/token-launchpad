// ✅ CORRECT Program IDs for X1 Blockchain (Solana Fork)
export const TOKEN_2022_PROGRAM_ID = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
export const ASSOCIATED_TOKEN_PROGRAM_ID = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
export const TOKEN_METADATA_PROGRAM_ID = 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s';

// We ONLY support Token-2022 with all extensions
export const SUPPORTED_TOKEN_TYPE = 'TOKEN2022';

// Token-2022 Extensions we support
export const SUPPORTED_EXTENSIONS = {
  TRANSFER_FEE: 'TransferFeeConfig',
  PERMANENT_DELEGATE: 'PermanentDelegate',
  TRANSFER_HOOK: 'TransferHook',
  METADATA_POINTER: 'MetadataPointer',
  CONFIDENTIAL_TRANSFERS: 'ConfidentialTransferMint',
  DEFAULT_ACCOUNT_STATE: 'DefaultAccountState',
  INTEREST_BEARING: 'InterestBearingConfig',
  NON_TRANSFERABLE: 'NonTransferable',
  IMMUTABLE_OWNER: 'ImmutableOwner',
  MEMO_TRANSFER: 'MemoTransfer'
};

// RPC Endpoints for X1
export const X1_RPC_ENDPOINTS = {
  mainnet: 'https://rpc.blockspeed.io/',
  testnet: 'https://xolana.xen.network'
};

// Explorer URLs
export const X1_EXPLORER = {
  mainnet: 'https://explorer.x1.xyz',
  testnet: 'https://explorer.mainnet.x1.xyz'
};

// XDEX API
export const XDEX_API_BASE = 'https://api.xdex.xyz';
export const XDEX_API_ENDPOINTS = {
  swap: '/api/xendex/swap/prepare',
  quote: '/api/xendex/swap/quote',
  pools: '/api/xendex/pool/list',
  deposit: '/api/xendex/pool/deposit',
  withdraw: '/api/xendex/pool/withdraw',
  walletTokens: '/api/xendex/wallet/tokens',
  tokenPrice: '/api/token-price/price'
};

// Network names (for XDEX API)
export const NETWORK_NAMES = {
  mainnet: 'X1 Mainnet',
  testnet: 'X1 Testnet'
};

// Incinerator address for token burning
export const INCINERATOR_ADDRESS = '1nc1nerator11111111111111111111111111111111';
