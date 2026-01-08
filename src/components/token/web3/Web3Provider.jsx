import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
  Keypair
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  createBurnInstruction,
  getAssociatedTokenAddress,
  getMint,
  getAccount,
  createInitializeMetadataPointerInstruction,
  createInitializeMintCloseAuthorityInstruction,
  TYPE_SIZE,
  LENGTH_SIZE,
  ExtensionType,
  getMintLen
} from '@solana/spl-token';
import { NETWORK_CONFIG, PROGRAM_ADDRESSES, FEE_RECIPIENT_ADDRESS, TOKEN_CREATION_FEE, PRESALE_CREATION_FEE, DIRECT_MINT_FEE } from './contracts';

class SolanaWeb3Service {
  constructor() {
    this.connection = null;
    this.wallet = null;
    this.publicKey = null;
    this.network = 'x1Testnet';
  }

  // Initialize connection
  initConnection(network) {
    this.network = network;
    const config = NETWORK_CONFIG[network];
    this.connection = new Connection(config.rpcUrl, 'confirmed');
    return this.connection;
  }

  // Connect wallet (for Phantom, Backpack, etc.)
  async connectWallet(walletAdapter) {
    try {
      if (!walletAdapter) {
        throw new Error('No wallet adapter provided');
      }

      // Store wallet adapter
      this.wallet = walletAdapter;

      // Connect if not already connected
      if (!walletAdapter.connected) {
        await walletAdapter.connect();
      }

      this.publicKey = walletAdapter.publicKey;

      return {
        address: this.publicKey.toString(),
        connected: true
      };
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  }

  // Disconnect wallet
  async disconnect() {
    if (this.wallet) {
      await this.wallet.disconnect();
    }
    this.wallet = null;
    this.publicKey = null;
  }

  // Get SOL balance
  async getBalance(address) {
    if (!this.connection) throw new Error('Connection not initialized');
    const publicKey = new PublicKey(address || this.publicKey);
    const balance = await this.connection.getBalance(publicKey);
    return balance / LAMPORTS_PER_SOL;
  }

  // Create SPL Token
  async createToken(network, tokenData, fee) {
    if (!this.wallet || !this.publicKey) throw new Error('Wallet not connected');
    if (!this.connection) this.initConnection(network);

    try {
      // Generate new keypair for mint
      const mintKeypair = Keypair.generate();
      const mint = mintKeypair.publicKey;

      // Get associated token account
      const associatedToken = await getAssociatedTokenAddress(
        mint,
        this.publicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      // Calculate rent
      const mintLen = getMintLen([]);
      const lamports = await this.connection.getMinimumBalanceForRentExemption(mintLen);

      // Create transaction
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

      // Create mint account
      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: this.publicKey,
          newAccountPubkey: mint,
          space: mintLen,
          lamports,
          programId: TOKEN_PROGRAM_ID
        })
      );

      // Initialize mint
      transaction.add(
        createInitializeMintInstruction(
          mint,
          tokenData.decimals,
          this.publicKey, // mint authority
          tokenData.lockMint ? null : this.publicKey, // freeze authority
          TOKEN_PROGRAM_ID
        )
      );

      // Create associated token account
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

      // Mint initial supply
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

      // Get recent blockhash and set fee payer
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.publicKey;

      // Sign with mint keypair
      transaction.partialSign(mintKeypair);

      // Sign with wallet and send
      const signedTx = await this.wallet.signTransaction(transaction);
      const signature = await this.connection.sendRawTransaction(signedTx.serialize());

      // Confirm transaction
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

  // Mint tokens
  async mintTokens(tokenAddress, amount, decimals, fee) {
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

      // Mint tokens
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

      // Burn tokens
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

      const transaction = new Transaction();

      // Burn tokens
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

      // Get token info
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

  // Add Liquidity (simplified for SVM)
  async addLiquidity(network, tokenAddress, tokenAmount, solAmount, decimals) {
    if (!this.wallet || !this.publicKey) throw new Error('Wallet not connected');
    if (!this.connection) this.initConnection(network);

    try {
      // This would interact with a DEX program like Raydium or Orca
      // For now, this is a placeholder
      const transaction = new Transaction();

      // Add SOL transfer
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

      // Swap tokens (simplified)
  async swapTokens(network, fromToken, toToken, amountIn, decimals) {
    if (!this.wallet || !this.publicKey) throw new Error('Wallet not connected');
    if (!this.connection) this.initConnection(network);

    try {
      // This would interact with a DEX program
      // Placeholder implementation
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

      // Create Presale (simplified)
  async createPresale(network, presaleData, fee) {
    if (!this.wallet || !this.publicKey) throw new Error('Wallet not connected');
    if (!this.connection) this.initConnection(network);

    try {
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

      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.publicKey;

      const signedTx = await this.wallet.signTransaction(transaction);
      const signature = await this.connection.sendRawTransaction(signedTx.serialize());
      await this.connection.confirmTransaction(signature, 'confirmed');

      return {
        txHash: signature,
        presaleAddress: 'PRESALE_ACCOUNT_ADDRESS' // Would be generated from program
      };
      } catch (error) {
      console.error('Error creating presale:', error);
      throw error;
      }
      }

      // Invest in Presale
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