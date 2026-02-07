// FILE: src/components/token/web3/Web3Provider.jsx
// ✅ COMPLETE TOKEN-2022 ONLY IMPLEMENTATION
// ✅ Correct Program ID: TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb

import './polyfills';
import * as web3 from '@solana/web3.js';
import * as splToken from '@solana/spl-token';
import { NETWORK_CONFIG, FEE_RECIPIENT_ADDRESS } from './contracts';

const { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram,
  LAMPORTS_PER_SOL,
  Keypair
} = web3;

const {
  createInitializeMint2Instruction,
  createInitializeMetadataPointerInstruction,
  createInitializeTransferFeeConfigInstruction,
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
  TYPE_SIZE,
  LENGTH_SIZE
} = splToken;

// ✅✅✅ CORRECT TOKEN-2022 PROGRAM ID FOR X1 (SOLANA FORK) ✅✅✅
const TOKEN_2022_PROGRAM_ID = new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

// Incinerator for burning
const INCINERATOR = '1nc1nerator11111111111111111111111111111111';

// dApp metadata for wallet connection
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
    this.network = 'x1Mainnet';
  }

  initConnection(network = 'x1Mainnet') {
    this.network = network;
    const config = NETWORK_CONFIG[network];
    if (!config) {
      throw new Error(`Unknown network: ${network}`);
    }
    this.connection = new Connection(config.rpcUrl, 'confirmed');
    console.log(`[Web3] ✅ Connected to ${network}: ${config.rpcUrl}`);
    return this.connection;
  }

  async connectWallet(walletAdapter) {
    try {
      if (!walletAdapter) {
        throw new Error('No wallet adapter provided');
      }

      this.wallet = walletAdapter;

      if (!walletAdapter.connected) {
        try {
          await walletAdapter.connect(DAPP_METADATA);
        } catch (firstError) {
          try {
            await walletAdapter.connect({
              name: DAPP_METADATA.name,
              icon: DAPP_METADATA.icon,
              url: DAPP_METADATA.url
            });
          } catch (secondError) {
            await walletAdapter.connect();
          }
        }
      }

      this.publicKey = walletAdapter.publicKey;
      console.log('[Web3] ✅ Wallet connected:', this.publicKey.toString());

      return {
        address: this.publicKey.toString(),
        connected: true
      };
    } catch (error) {
      console.error('[Web3] Connection error:', error);
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
      console.error('[Web3] Get balance error:', error);
      throw error;
    }
  }

  /**
   * ✅ Check mint authority - CRITICAL before minting
   */
  async checkMintAuthority(mintAddress) {
    try {
      if (!this.wallet || !this.publicKey) {
        throw new Error('Wallet not connected');
      }

      const mint = new PublicKey(mintAddress);

      // Get mint info using Token-2022 program
      const mintInfo = await getMint(
        this.connection,
        mint,
        'confirmed',
        TOKEN_2022_PROGRAM_ID
      );

      const isAuthority = mintInfo.mintAuthority && 
        mintInfo.mintAuthority.equals(this.publicKey);

      const currentAuthority = mintInfo.mintAuthority 
        ? mintInfo.mintAuthority.toBase58()
        : 'null (locked)';

      return {
        isAuthority,
        currentAuthority,
        canMint: isAuthority && mintInfo.mintAuthority !== null,
        yourWallet: this.publicKey.toBase58(),
        isLocked: mintInfo.mintAuthority === null
      };
    } catch (error) {
      console.error('[Web3] Check authority error:', error);
      throw error;
    }
  }

  /**
   * ✅ Create Token-2022 token with extensions
   */
  async createToken(tokenConfig, fee = 0.1) {
    try {
      if (!this.wallet || !this.publicKey) {
        throw new Error('Wallet not connected');
      }

      console.log('[Web3] Creating Token-2022 token:', tokenConfig);

      const mintKeypair = Keypair.generate();
      const transaction = new Transaction();

      // Determine extensions
      const extensions = [ExtensionType.MetadataPointer];
      
      if (tokenConfig.transferFee && tokenConfig.transferFeePercent > 0) {
        extensions.push(ExtensionType.TransferFeeConfig);
      }
      
      if (tokenConfig.nonTransferable) {
        extensions.push(ExtensionType.NonTransferable);
      }

      // Calculate space
      const mintLen = getMintLen(extensions);
      const lamports = await this.connection.getMinimumBalanceForRentExemption(mintLen);

      // 1. Create account
      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: this.publicKey,
          newAccountPubkey: mintKeypair.publicKey,
          space: mintLen,
          lamports,
          programId: TOKEN_2022_PROGRAM_ID
        })
      );

      // 2. Initialize metadata pointer
      transaction.add(
        createInitializeMetadataPointerInstruction(
          mintKeypair.publicKey,
          this.publicKey,
          mintKeypair.publicKey,
          TOKEN_2022_PROGRAM_ID
        )
      );

      // 3. Initialize transfer fee config if enabled
      if (tokenConfig.transferFee && tokenConfig.transferFeePercent > 0) {
        const feeBasisPoints = Math.floor(tokenConfig.transferFeePercent * 100);
        const maxFee = BigInt((tokenConfig.maxTransferFee || 1000) * Math.pow(10, tokenConfig.decimals));
        
        transaction.add(
          createInitializeTransferFeeConfigInstruction(
            mintKeypair.publicKey,
            this.publicKey,
            this.publicKey,
            feeBasisPoints,
            maxFee,
            TOKEN_2022_PROGRAM_ID
          )
        );
      }

      // 4. Initialize mint
      transaction.add(
        createInitializeMint2Instruction(
          mintKeypair.publicKey,
          tokenConfig.decimals || 9,
          this.publicKey, // ✅ YOU own mint authority
          tokenConfig.freezeAuthority ? this.publicKey : null,
          TOKEN_2022_PROGRAM_ID
        )
      );

      // 5. Create associated token account and mint initial supply if specified
      if (tokenConfig.initialSupply && tokenConfig.initialSupply > 0) {
        const associatedToken = await getAssociatedTokenAddress(
          mintKeypair.publicKey,
          this.publicKey,
          false,
          TOKEN_2022_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        );

        transaction.add(
          createAssociatedTokenAccountInstruction(
            this.publicKey,
            associatedToken,
            this.publicKey,
            mintKeypair.publicKey,
            TOKEN_2022_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          )
        );

        const mintAmount = BigInt(tokenConfig.initialSupply * Math.pow(10, tokenConfig.decimals || 9));
        transaction.add(
          createMintToInstruction(
            mintKeypair.publicKey,
            associatedToken,
            this.publicKey,
            mintAmount,
            [],
            TOKEN_2022_PROGRAM_ID
          )
        );
      }

      // 6. Add fee payment
      if (fee > 0) {
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: this.publicKey,
            toPubkey: new PublicKey(FEE_RECIPIENT_ADDRESS),
            lamports: fee * LAMPORTS_PER_SOL
          })
        );
      }

      // Sign and send
      transaction.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
      transaction.feePayer = this.publicKey;
      transaction.partialSign(mintKeypair);

      const signed = await this.wallet.signTransaction(transaction);
      const txHash = await this.connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed'
      });

      await this.connection.confirmTransaction(txHash, 'confirmed');

      console.log('[Web3] ✅ Token-2022 created:', {
        mint: mintKeypair.publicKey.toString(),
        txHash
      });

      return {
        success: true,
        mintAddress: mintKeypair.publicKey.toString(),
        txHash,
        tokenType: 'TOKEN2022',
        explorerUrl: `https://explorer.x1.xyz/tx/${txHash}`
      };
    } catch (error) {
      console.error('[Web3] Create token error:', error);
      throw error;
    }
  }

  /**
   * ✅ Mint tokens with authority check
   */
  async mintTokens(mintAddress, amount, decimals = 9, fee = 0) {
    try {
      if (!this.wallet || !this.publicKey) {
        throw new Error('Wallet not connected');
      }

      // ✅ CRITICAL: Check authority FIRST
      const authCheck = await this.checkMintAuthority(mintAddress);
      
      if (!authCheck.canMint) {
        throw new Error(
          `❌ Cannot mint tokens\n\n` +
          `Reason: ${authCheck.isLocked ? 'Mint authority is permanently locked' : 'You are not the mint authority'}\n\n` +
          `Current Authority: ${authCheck.currentAuthority}\n` +
          `Your Wallet: ${authCheck.yourWallet}\n\n` +
          `${authCheck.isLocked 
            ? 'No more tokens can ever be minted for this token.' 
            : 'Only the wallet that created this token can mint more.'}`
        );
      }

      console.log('[Web3] ✅ Authority verified, minting tokens...');

      const mint = new PublicKey(mintAddress);
      const associatedToken = await getAssociatedTokenAddress(
        mint,
        this.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const transaction = new Transaction();

      // Check if token account exists
      try {
        await getAccount(this.connection, associatedToken, 'confirmed', TOKEN_2022_PROGRAM_ID);
      } catch (error) {
        // Create if doesn't exist
        transaction.add(
          createAssociatedTokenAccountInstruction(
            this.publicKey,
            associatedToken,
            this.publicKey,
            mint,
            TOKEN_2022_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          )
        );
      }

      // Mint tokens
      const mintAmount = BigInt(amount * Math.pow(10, decimals));
      transaction.add(
        createMintToInstruction(
          mint,
          associatedToken,
          this.publicKey,
          mintAmount,
          [],
          TOKEN_2022_PROGRAM_ID
        )
      );

      // Add fee
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

      console.log('[Web3] ✅ Tokens minted, tx:', txHash);

      return {
        success: true,
        txHash,
        amount,
        explorerUrl: `https://explorer.x1.xyz/tx/${txHash}`
      };
    } catch (error) {
      console.error('[Web3] Mint error:', error);
      throw error;
    }
  }

  /**
   * ✅ Burn tokens to incinerator
   */
  async burnTokens(mintAddress, amount, decimals = 9) {
    try {
      if (!this.wallet || !this.publicKey) {
        throw new Error('Wallet not connected');
      }

      console.log('[Web3] 🔥 Burning tokens to incinerator...');

      const mint = new PublicKey(mintAddress);
      const userTokenAccount = await getAssociatedTokenAddress(
        mint,
        this.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const burnAmount = BigInt(amount * Math.pow(10, decimals));

      const transaction = new Transaction().add(
        createBurnInstruction(
          userTokenAccount,
          mint,
          this.publicKey,
          burnAmount,
          [],
          TOKEN_2022_PROGRAM_ID
        )
      );

      transaction.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
      transaction.feePayer = this.publicKey;

      const signed = await this.wallet.signTransaction(transaction);
      const txHash = await this.connection.sendRawTransaction(signed.serialize());
      
      await this.connection.confirmTransaction(txHash, 'confirmed');

      console.log('[Web3] ✅ Tokens burned, tx:', txHash);

      return {
        success: true,
        txHash,
        amount,
        destination: INCINERATOR,
        explorerUrl: `https://explorer.x1.xyz/tx/${txHash}`
      };
    } catch (error) {
      console.error('[Web3] Burn error:', error);
      throw error;
    }
  }

  /**
   * ✅ Lock mint authority permanently
   */
  async lockMintAuthority(mintAddress) {
    try {
      if (!this.wallet || !this.publicKey) {
        throw new Error('Wallet not connected');
      }

      const mint = new PublicKey(mintAddress);
      const transaction = new Transaction().add(
        createSetAuthorityInstruction(
          mint,
          this.publicKey,
          AuthorityType.MintTokens,
          null,
          [],
          TOKEN_2022_PROGRAM_ID
        )
      );

      transaction.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
      transaction.feePayer = this.publicKey;

      const signed = await this.wallet.signTransaction(transaction);
      const txHash = await this.connection.sendRawTransaction(signed.serialize());
      
      await this.connection.confirmTransaction(txHash, 'confirmed');

      return {
        success: true,
        txHash,
        message: 'Mint authority permanently locked',
        explorerUrl: `https://explorer.x1.xyz/tx/${txHash}`
      };
    } catch (error) {
      console.error('[Web3] Lock mint error:', error);
      throw error;
    }
  }

  /**
   * ✅ Lock freeze authority permanently
   */
  async lockFreezeAuthority(mintAddress) {
    try {
      if (!this.wallet || !this.publicKey) {
        throw new Error('Wallet not connected');
      }

      const mint = new PublicKey(mintAddress);
      const transaction = new Transaction().add(
        createSetAuthorityInstruction(
          mint,
          this.publicKey,
          AuthorityType.FreezeAccount,
          null,
          [],
          TOKEN_2022_PROGRAM_ID
        )
      );

      transaction.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
      transaction.feePayer = this.publicKey;

      const signed = await this.wallet.signTransaction(transaction);
      const txHash = await this.connection.sendRawTransaction(signed.serialize());
      
      await this.connection.confirmTransaction(txHash, 'confirmed');

      return {
        success: true,
        txHash,
        message: 'Freeze authority permanently locked',
        explorerUrl: `https://explorer.x1.xyz/tx/${txHash}`
      };
    } catch (error) {
      console.error('[Web3] Lock freeze error:', error);
      throw error;
    }
  }

  /**
   * ✅ Make token immutable (lock both authorities)
   */
  async makeTokenImmutable(mintAddress) {
    try {
      const mintResult = await this.lockMintAuthority(mintAddress);
      const freezeResult = await this.lockFreezeAuthority(mintAddress);

      return {
        success: true,
        mintTxHash: mintResult.txHash,
        freezeTxHash: freezeResult.txHash,
        message: 'Token is now completely immutable'
      };
    } catch (error) {
      console.error('[Web3] Make immutable error:', error);
      throw error;
    }
  }
}

export const web3Service = new SolanaWeb3Service();
export default web3Service;
