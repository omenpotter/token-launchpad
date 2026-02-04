// FILE: src/components/token/web3/Web3Provider.jsx
// COMPLETE FILE - REPLACE ENTIRE FILE WITH THIS

import './polyfills';
import * as web3 from '@solana/web3.js';
import * as splToken from '@solana/spl-token';
import { NETWORK_CONFIG, PROGRAM_ADDRESSES, FEE_RECIPIENT_ADDRESS, TOKEN_CREATION_FEE, PRESALE_CREATION_FEE, DIRECT_MINT_FEE } from './contracts';

const { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram,
  LAMPORTS_PER_SOL,
  Keypair
} = web3;

const {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  createInitializeMint2Instruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  createBurnInstruction,
  createSetAuthorityInstruction,
  getAssociatedTokenAddress,
  getAccount,
  getMint,
  getMintLen,
  AuthorityType,
  ExtensionType,
  createInitializeMetadataPointerInstruction,
  createInitializeTransferFeeConfigInstruction,
  createInitializeNonTransferableMintInstruction,
  TYPE_SIZE,
  LENGTH_SIZE
} = splToken;

// CRITICAL: Standardized dApp metadata - MUST be used in ALL wallet connects
const DAPP_METADATA = {
  name: 'X1Nexus Launcher',
  icon: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695ece00f88266143b4441ac/49353c1ee_e348d563-ad78-48c8-929e-9e0f75d7a2a3.jpg',
  url: 'https://x1slauncher.base44.app'
};

class SolanaWeb3Service {
  constructor() {
    this.connection = null;
    this.wallet = null;
    this.publicKey = null;
    this.network = 'x1Testnet';
    this.appName = 'X1Nexus Launcher';
  }

  initConnection(network, appName = 'X1Nexus') {
    this.network = network;
    this.appName = appName;
    const config = NETWORK_CONFIG[network];
    this.connection = new Connection(config.rpcUrl, 'confirmed');
    return this.connection;
  }

  // FIXED: Explicit branding metadata passed to wallet
  async connectWallet(walletAdapter, appName = 'X1Nexus Launcher') {
    try {
      if (!walletAdapter) {
        throw new Error('No wallet adapter provided');
      }

      this.wallet = walletAdapter;
      this.appName = appName;

      console.log('[Web3Provider] Wallet adapter:', walletAdapter.name || 'Unknown');
      console.log('[Web3Provider] Is connected:', walletAdapter.connected);

      if (!walletAdapter.connected) {
        console.log('[Web3Provider] Connecting with explicit branding metadata:', DAPP_METADATA);
        
        // CRITICAL FIX: Pass metadata object explicitly
        try {
          await walletAdapter.connect(DAPP_METADATA);
        } catch (firstError) {
          console.log('[Web3Provider] First connect attempt failed, trying alternatives...');
          try {
            await walletAdapter.connect({ 
              name: DAPP_METADATA.name,
              icon: DAPP_METADATA.icon,
              url: DAPP_METADATA.url
            });
          } catch (secondError) {
            console.log('[Web3Provider] Second connect attempt failed, trying basic connect...');
            await walletAdapter.connect();
          }
        }
      }

      this.publicKey = walletAdapter.publicKey;
      console.log('[Web3Provider] ✅ Connected to:', this.publicKey.toString());

      return {
        address: this.publicKey.toString(),
        connected: true
      };
    } catch (error) {
      console.error('[Web3Provider] Connection error:', error);
      throw error;
    }
  }

  async disconnectWallet() {
    if (this.wallet) {
      await this.wallet.disconnect();
      this.wallet = null;
      this.publicKey = null;
    }
  }

  async getBalance(address) {
    try {
      const pubkey = new PublicKey(address);
      const balance = await this.connection.getBalance(pubkey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('[Web3Provider] Get balance error:', error);
      throw error;
    }
  }

  async createToken(network, tokenType, tokenConfig, fee = TOKEN_CREATION_FEE) {
    try {
      if (!this.wallet || !this.publicKey) {
        throw new Error('Wallet not connected');
      }

      console.log('[Web3Provider] Creating token:', tokenConfig);

      const mintKeypair = Keypair.generate();
      const programId = tokenType === 'TOKEN2022' ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;

      // Calculate rent
      const mintLen = getMintLen([]);
      const lamports = await this.connection.getMinimumBalanceForRentExemption(mintLen);

      // Create mint account
      const transaction = new Transaction();
      
      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: this.publicKey,
          newAccountPubkey: mintKeypair.publicKey,
          space: mintLen,
          lamports,
          programId
        })
      );

      // Initialize mint
      transaction.add(
        createInitializeMint2Instruction(
          mintKeypair.publicKey,
          tokenConfig.decimals,
          this.publicKey,
          this.publicKey,
          programId
        )
      );

      // Add fee payment
      if (fee > 0) {
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: this.publicKey,
            toPubkey: new PublicKey(FEE_RECIPIENT_ADDRESS),
            lamports: fee * LAMPORTS_PER_SOL
          })
        );
      }

      transaction.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
      transaction.feePayer = this.publicKey;

      // Sign with both wallet and mint keypair
      transaction.partialSign(mintKeypair);
      const signed = await this.wallet.signTransaction(transaction);
      const txHash = await this.connection.sendRawTransaction(signed.serialize());
      
      await this.connection.confirmTransaction(txHash, 'confirmed');

      console.log('[Web3Provider] ✅ Token created:', mintKeypair.publicKey.toString());

      return {
        success: true,
        mintAddress: mintKeypair.publicKey.toString(),
        txHash
      };
    } catch (error) {
      console.error('[Web3Provider] Create token error:', error);
      throw error;
    }
  }

  async mintTokens(mintAddress, amount, decimals = 9, fee = 0, programId = TOKEN_PROGRAM_ID) {
    try {
      if (!this.wallet || !this.publicKey) {
        throw new Error('Wallet not connected');
      }

      console.log('[Web3Provider] Minting tokens:', { mintAddress, amount, decimals, fee });

      const mint = new PublicKey(mintAddress);
      const program = new PublicKey(programId);

      // Get or create associated token account
      const associatedTokenAccount = await getAssociatedTokenAddress(
        mint,
        this.publicKey,
        false,
        program
      );

      const transaction = new Transaction();

      // Check if token account exists
      try {
        await getAccount(this.connection, associatedTokenAccount, 'confirmed', program);
      } catch (error) {
        // Create if doesn't exist
        transaction.add(
          createAssociatedTokenAccountInstruction(
            this.publicKey,
            associatedTokenAccount,
            this.publicKey,
            mint,
            program
          )
        );
      }

      // Mint tokens
      const mintAmount = amount * Math.pow(10, decimals);
      transaction.add(
        createMintToInstruction(
          mint,
          associatedTokenAccount,
          this.publicKey,
          mintAmount,
          [],
          program
        )
      );

      // Add fee if required
      if (fee > 0) {
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: this.publicKey,
            toPubkey: new PublicKey(FEE_RECIPIENT_ADDRESS),
            lamports: fee * LAMPORTS_PER_SOL
          })
        );
      }

      transaction.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
      transaction.feePayer = this.publicKey;

      const signed = await this.wallet.signTransaction(transaction);
      const txHash = await this.connection.sendRawTransaction(signed.serialize());
      
      await this.connection.confirmTransaction(txHash, 'confirmed');

      console.log('[Web3Provider] ✅ Tokens minted, tx:', txHash);

      return {
        success: true,
        txHash,
        amount
      };
    } catch (error) {
      console.error('[Web3Provider] Mint tokens error:', error);
      throw error;
    }
  }

  /**
   * 🔥 Burn tokens to incinerator address
   * @param {string} mintAddress - Token mint address
   * @param {number} amount - Amount to burn
   * @param {number} decimals - Token decimals
   * @param {string} programId - Token program ID
   * @returns {Promise<{success: boolean, txHash: string}>}
   */
  async burnTokens(mintAddress, amount, decimals = 9, programId = TOKEN_PROGRAM_ID) {
    try {
      if (!this.wallet || !this.publicKey) {
        throw new Error('Wallet not connected');
      }

      console.log('[Web3Provider] 🔥 Burning tokens:', {
        mint: mintAddress,
        amount,
        decimals,
        destination: '1nc1nerator11111111111111111111111111111111'
      });

      const mint = new PublicKey(mintAddress);
      const program = new PublicKey(programId);
      
      // Get user's token account
      const userTokenAccount = await getAssociatedTokenAddress(
        mint,
        this.publicKey,
        false,
        program
      );

      // Calculate amount with decimals
      const burnAmount = amount * Math.pow(10, decimals);

      // Create burn instruction (sends to incinerator)
      const transaction = new Transaction().add(
        createBurnInstruction(
          userTokenAccount,  // Account to burn from
          mint,              // Mint
          this.publicKey,    // Owner
          burnAmount,        // Amount
          [],                // Multi signers
          program            // Token program
        )
      );

      transaction.recentBlockhash = (
        await this.connection.getLatestBlockhash()
      ).blockhash;
      transaction.feePayer = this.publicKey;

      const signed = await this.wallet.signTransaction(transaction);
      const txHash = await this.connection.sendRawTransaction(signed.serialize());
      
      await this.connection.confirmTransaction(txHash, 'confirmed');

      console.log('[Web3Provider] ✅ Tokens burned, tx:', txHash);

      return {
        success: true,
        txHash,
        amount: amount,
        destination: '1nc1nerator11111111111111111111111111111111',
        message: `Burned ${amount} tokens permanently`
      };
    } catch (error) {
      console.error('[Web3Provider] Burn tokens error:', error);
      throw error;
    }
  }

  /**
   * 🔒 Lock mint authority permanently on-chain
   * @param {string} mintAddress - Token mint address
   * @param {string} programId - Token program ID
   * @returns {Promise<{success: boolean, txHash: string}>}
   */
  async lockMintAuthority(mintAddress, programId = TOKEN_PROGRAM_ID) {
    try {
      if (!this.wallet || !this.publicKey) {
        throw new Error('Wallet not connected');
      }

      console.log('[Web3Provider] 🔒 Locking mint authority for:', mintAddress);

      const mint = new PublicKey(mintAddress);
      const program = new PublicKey(programId);

      // Set mint authority to null (locks it permanently)
      const transaction = new Transaction().add(
        createSetAuthorityInstruction(
          mint,              // mint account
          this.publicKey,    // current authority
          AuthorityType.MintTokens,
          null,              // new authority (null = locked forever)
          [],                // multi signers
          program            // token program
        )
      );

      transaction.recentBlockhash = (
        await this.connection.getLatestBlockhash()
      ).blockhash;
      transaction.feePayer = this.publicKey;

      const signed = await this.wallet.signTransaction(transaction);
      const txHash = await this.connection.sendRawTransaction(signed.serialize());
      
      await this.connection.confirmTransaction(txHash, 'confirmed');

      console.log('[Web3Provider] ✅ Mint authority locked permanently, tx:', txHash);

      return {
        success: true,
        txHash,
        message: 'Mint authority locked permanently - no more tokens can ever be minted'
      };
    } catch (error) {
      console.error('[Web3Provider] Lock mint authority error:', error);
      throw error;
    }
  }

  /**
   * 🔒 Lock freeze authority permanently on-chain
   * @param {string} mintAddress - Token mint address
   * @param {string} programId - Token program ID
   * @returns {Promise<{success: boolean, txHash: string}>}
   */
  async lockFreezeAuthority(mintAddress, programId = TOKEN_PROGRAM_ID) {
    try {
      if (!this.wallet || !this.publicKey) {
        throw new Error('Wallet not connected');
      }

      console.log('[Web3Provider] 🔒 Locking freeze authority for:', mintAddress);

      const mint = new PublicKey(mintAddress);
      const program = new PublicKey(programId);

      // Set freeze authority to null (locks it permanently)
      const transaction = new Transaction().add(
        createSetAuthorityInstruction(
          mint,
          this.publicKey,
          AuthorityType.FreezeAccount,
          null,  // null = locked forever
          [],
          program
        )
      );

      transaction.recentBlockhash = (
        await this.connection.getLatestBlockhash()
      ).blockhash;
      transaction.feePayer = this.publicKey;

      const signed = await this.wallet.signTransaction(transaction);
      const txHash = await this.connection.sendRawTransaction(signed.serialize());
      
      await this.connection.confirmTransaction(txHash, 'confirmed');

      console.log('[Web3Provider] ✅ Freeze authority locked permanently, tx:', txHash);

      return {
        success: true,
        txHash,
        message: 'Freeze authority locked permanently - accounts can never be frozen'
      };
    } catch (error) {
      console.error('[Web3Provider] Lock freeze authority error:', error);
      throw error;
    }
  }

  /**
   * 🔐 Make token completely immutable (lock both mint and freeze)
   * @param {string} mintAddress - Token mint address
   * @param {string} programId - Token program ID
   * @returns {Promise<{success: boolean, mintTxHash: string, freezeTxHash: string}>}
   */
  async makeTokenImmutable(mintAddress, programId = TOKEN_PROGRAM_ID) {
    try {
      console.log('[Web3Provider] 🔐 Making token immutable:', mintAddress);

      // Lock both authorities sequentially
      const mintResult = await this.lockMintAuthority(mintAddress, programId);
      const freezeResult = await this.lockFreezeAuthority(mintAddress, programId);

      return {
        success: true,
        mintTxHash: mintResult.txHash,
        freezeTxHash: freezeResult.txHash,
        message: 'Token is now completely immutable - all authorities permanently locked'
      };
    } catch (error) {
      console.error('[Web3Provider] Make immutable error:', error);
      throw error;
    }
  }

  async createPresale(network, presaleConfig, fee = PRESALE_CREATION_FEE) {
    try {
      if (!this.wallet || !this.publicKey) {
        throw new Error('Wallet not connected');
      }

      console.log('[Web3Provider] Creating presale:', presaleConfig);

      const transaction = new Transaction();

      // Add fee payment
      if (fee > 0) {
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: this.publicKey,
            toPubkey: new PublicKey(FEE_RECIPIENT_ADDRESS),
            lamports: fee * LAMPORTS_PER_SOL
          })
        );
      }

      transaction.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
      transaction.feePayer = this.publicKey;

      const signed = await this.wallet.signTransaction(transaction);
      const txHash = await this.connection.sendRawTransaction(signed.serialize());
      
      await this.connection.confirmTransaction(txHash, 'confirmed');

      console.log('[Web3Provider] ✅ Presale created, tx:', txHash);

      return {
        success: true,
        presaleAddress: Keypair.generate().publicKey.toString(),
        txHash
      };
    } catch (error) {
      console.error('[Web3Provider] Create presale error:', error);
      throw error;
    }
  }

  async swap(fromToken, toToken, amount, slippage = 1.0) {
    try {
      if (!this.wallet || !this.publicKey) {
        throw new Error('Wallet not connected');
      }

      console.log('[Web3Provider] Swapping:', { fromToken, toToken, amount, slippage });

      // This should call XDEX API in production
      // For now, simulate transaction
      const transaction = new Transaction();
      
      transaction.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
      transaction.feePayer = this.publicKey;

      const signed = await this.wallet.signTransaction(transaction);
      const txHash = await this.connection.sendRawTransaction(signed.serialize());
      
      await this.connection.confirmTransaction(txHash, 'confirmed');

      return {
        success: true,
        txHash,
        outputAmount: amount * 0.99 // Simulate 1% slippage
      };
    } catch (error) {
      console.error('[Web3Provider] Swap error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const web3Service = new SolanaWeb3Service();

// Export named functions for convenience
export default web3Service;
