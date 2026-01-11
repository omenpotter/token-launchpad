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
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  createBurnInstruction,
  createSetAuthorityInstruction,
  getAssociatedTokenAddress,
  getAccount,
  getMint,
  getMintLen,
  AuthorityType
} = splToken;

// CRITICAL: Standardized dApp metadata - MUST be used in ALL wallet connects
const DAPP_METADATA = {
  name: 'X1Space',
  icon: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695ece00f88266143b4441ac/5910381b6_711323c7-8ae9-4314-922d-ccab7986c619.jpg',
  url: 'https://x1slauncher.base44.app'
};

class SolanaWeb3Service {
  constructor() {
    this.connection = null;
    this.wallet = null;
    this.publicKey = null;
    this.network = 'x1Testnet';
    this.appName = 'X1Space';
  }

  initConnection(network, appName = 'X1Space') {
    this.network = network;
    this.appName = appName;
    const config = NETWORK_CONFIG[network];
    this.connection = new Connection(config.rpcUrl, 'confirmed');
    return this.connection;
  }

  // FIXED: Explicit branding metadata passed to wallet
  async connectWallet(walletAdapter, appName = 'X1Space') {
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

  async disconnect() {
    if (this.wallet) {
      await this.wallet.disconnect();
    }
    this.wallet = null;
    this.publicKey = null;
  }

  async getBalance(address) {
    if (!this.connection) throw new Error('Connection not initialized');
    const publicKey = new PublicKey(address || this.publicKey);
    const balance = await this.connection.getBalance(publicKey);
    return balance / LAMPORTS_PER_SOL;
  }

  async createToken(network, tokenData, fee) {
    if (!this.wallet || !this.publicKey) throw new Error('Wallet not connected');
    if (!this.connection) this.initConnection(network);

    try {
      const mintKeypair = Keypair.generate();
      const mint = mintKeypair.publicKey;

      const associatedToken = await getAssociatedTokenAddress(
        mint,
        this.publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const mintLen = getMintLen([]);
      const lamports = await this.connection.getMinimumBalanceForRentExemption(mintLen);

      const transaction = new Transaction();

      if (fee > 0) {
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: this.publicKey,
            toPubkey: new PublicKey(FEE_RECIPIENT_ADDRESS),
            lamports: fee * LAMPORTS_PER_SOL
          })
        );
      }

      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: this.publicKey,
          newAccountPubkey: mint,
          space: mintLen,
          lamports,
          programId: TOKEN_PROGRAM_ID
        })
      );

      // Initialize mint with mint authority and freeze authority
      transaction.add(
        createInitializeMintInstruction(
          mint,
          tokenData.decimals,
          this.publicKey, // mint authority (will be revoked later if lockMint is true)
          tokenData.immutable ? null : this.publicKey, // freeze authority (null if immutable)
          TOKEN_PROGRAM_ID
        )
      );

      transaction.add(
        createAssociatedTokenAccountInstruction(
          this.publicKey,
          associatedToken,
          this.publicKey,
          mint,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );

      if (tokenData.supply > 0) {
        transaction.add(
          createMintToInstruction(
            mint,
            associatedToken,
            this.publicKey,
            tokenData.supply * Math.pow(10, tokenData.decimals),
            [],
            TOKEN_PROGRAM_ID
          )
        );
      }

      // Lock mint authority if lockMint is true
      if (tokenData.lockMint) {
        transaction.add(
          createSetAuthorityInstruction(
            mint,
            this.publicKey, // current authority
            AuthorityType.MintTokens,
            null, // set to null to lock
            [],
            TOKEN_PROGRAM_ID
          )
        );
      }

      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.publicKey;

      transaction.partialSign(mintKeypair);

      const signedTx = await this.wallet.signTransaction(transaction);
      const signature = await this.connection.sendRawTransaction(signedTx.serialize());

      await this.connection.confirmTransaction(signature, 'confirmed');

      return {
        txHash: signature,
        tokenAddress: mint.toString(),
        associatedTokenAccount: associatedToken.toString()
      };
    } catch (error) {
      console.error('Error creating token:', error);
      throw error;
    }
  }

  async mintTokens(tokenAddress, amount, decimals, fee) {
    if (!this.wallet || !this.publicKey) throw new Error('Wallet not connected');
    if (!this.connection) throw new Error('Connection not initialized');

    try {
      const mint = new PublicKey(tokenAddress);
      
      // Check if mint authority exists
      const mintInfo = await getMint(this.connection, mint);
      if (!mintInfo.mintAuthority) {
        throw new Error('Mint authority has been revoked. Cannot mint more tokens.');
      }
      
      // Verify current user is the mint authority
      if (mintInfo.mintAuthority.toString() !== this.publicKey.toString()) {
        throw new Error('You are not the mint authority for this token.');
      }

      const associatedToken = await getAssociatedTokenAddress(
        mint,
        this.publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const transaction = new Transaction();

      if (fee > 0) {
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: this.publicKey,
            toPubkey: new PublicKey(FEE_RECIPIENT_ADDRESS),
            lamports: fee * LAMPORTS_PER_SOL
          })
        );
      }

      transaction.add(
        createMintToInstruction(
          mint,
          associatedToken,
          this.publicKey,
          amount * Math.pow(10, decimals),
          [],
          TOKEN_PROGRAM_ID
        )
      );

      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.publicKey;

      const signedTx = await this.wallet.signTransaction(transaction);
      const signature = await this.connection.sendRawTransaction(signedTx.serialize());
      await this.connection.confirmTransaction(signature, 'confirmed');

      return {
        txHash: signature
      };
    } catch (error) {
      console.error('Error minting tokens:', error);
      throw error;
    }
  }

  async burnTokens(tokenAddress, amount, decimals) {
    if (!this.wallet || !this.publicKey) throw new Error('Wallet not connected');
    if (!this.connection) throw new Error('Connection not initialized');

    try {
      const mint = new PublicKey(tokenAddress);
      const associatedToken = await getAssociatedTokenAddress(
        mint,
        this.publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      // Check if token account exists and has balance
      try {
        const accountInfo = await getAccount(this.connection, associatedToken);
        const balance = Number(accountInfo.amount) / Math.pow(10, decimals);
        
        if (balance < amount) {
          throw new Error(`Insufficient balance. You have ${balance} tokens, trying to burn ${amount}`);
        }
      } catch (error) {
        if (error.message.includes('could not find account')) {
          throw new Error('Token account not found. You may not hold any of these tokens.');
        }
        throw error;
      }

      const transaction = new Transaction();

      transaction.add(
        createBurnInstruction(
          associatedToken,
          mint,
          this.publicKey,
          amount * Math.pow(10, decimals),
          [],
          TOKEN_PROGRAM_ID
        )
      );

      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.publicKey;

      const signedTx = await this.wallet.signTransaction(transaction);
      const signature = await this.connection.sendRawTransaction(signedTx.serialize());
      await this.connection.confirmTransaction(signature, 'confirmed');

      return {
        txHash: signature
      };
    } catch (error) {
      console.error('Error burning tokens:', error);
      throw error;
    }
  }

  async getTokenInfo(tokenAddress) {
    if (!this.connection) throw new Error('Connection not initialized');

    try {
      const mint = new PublicKey(tokenAddress);
      const mintInfo = await getMint(this.connection, mint);

      return {
        address: tokenAddress,
        decimals: mintInfo.decimals,
        supply: Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals),
        mintAuthority: mintInfo.mintAuthority?.toString() || null,
        freezeAuthority: mintInfo.freezeAuthority?.toString() || null
      };
    } catch (error) {
      console.error('Error getting token info:', error);
      throw error;
    }
  }

  async addLiquidity(network, tokenAddress, tokenAmount, solAmount, decimals) {
    if (!this.wallet || !this.publicKey) throw new Error('Wallet not connected');
    if (!this.connection) this.initConnection(network);

    try {
      const transaction = new Transaction();

      transaction.add(
        SystemProgram.transfer({
          fromPubkey: this.publicKey,
          toPubkey: new PublicKey(PROGRAM_ADDRESSES[network].DEXProgram),
          lamports: solAmount * LAMPORTS_PER_SOL
        })
      );

      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.publicKey;

      const signedTx = await this.wallet.signTransaction(transaction);
      const signature = await this.connection.sendRawTransaction(signedTx.serialize());
      await this.connection.confirmTransaction(signature, 'confirmed');

      return {
        txHash: signature
      };
    } catch (error) {
      console.error('Error adding liquidity:', error);
      throw error;
    }
  }

  async swapTokens(network, fromToken, toToken, amountIn, decimals) {
    if (!this.wallet || !this.publicKey) throw new Error('Wallet not connected');
    if (!this.connection) this.initConnection(network);

    try {
      const transaction = new Transaction();

      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.publicKey;

      const signedTx = await this.wallet.signTransaction(transaction);
      const signature = await this.connection.sendRawTransaction(signedTx.serialize());
      await this.connection.confirmTransaction(signature, 'confirmed');

      return {
        txHash: signature
      };
    } catch (error) {
      console.error('Error swapping tokens:', error);
      throw error;
    }
  }

  async createPresale(network, presaleData, fee) {
    if (!this.wallet || !this.publicKey) throw new Error('Wallet not connected');
    if (!this.connection) this.initConnection(network);

    try {
      const transaction = new Transaction();

      if (fee > 0) {
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: this.publicKey,
            toPubkey: new PublicKey(FEE_RECIPIENT_ADDRESS),
            lamports: fee * LAMPORTS_PER_SOL
          })
        );
      }

      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.publicKey;

      const signedTx = await this.wallet.signTransaction(transaction);
      const signature = await this.connection.sendRawTransaction(signedTx.serialize());
      await this.connection.confirmTransaction(signature, 'confirmed');

      return {
        txHash: signature,
        presaleAddress: 'PRESALE_ACCOUNT_ADDRESS'
      };
    } catch (error) {
      console.error('Error creating presale:', error);
      throw error;
    }
  }

  async investInPresale(presaleAddress, amount) {
    if (!this.wallet || !this.publicKey) throw new Error('Wallet not connected');
    if (!this.connection) throw new Error('Connection not initialized');

    try {
      const transaction = new Transaction();

      transaction.add(
        SystemProgram.transfer({
          fromPubkey: this.publicKey,
          toPubkey: new PublicKey(presaleAddress),
          lamports: amount * LAMPORTS_PER_SOL
        })
      );

      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.publicKey;

      const signedTx = await this.wallet.signTransaction(transaction);
      const signature = await this.connection.sendRawTransaction(signedTx.serialize());
      await this.connection.confirmTransaction(signature, 'confirmed');

      return {
        txHash: signature
      };
    } catch (error) {
      console.error('Error investing in presale:', error);
      throw error;
    }
  }
}

export const web3Service = new SolanaWeb3Service();