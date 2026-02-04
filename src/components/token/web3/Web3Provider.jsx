// FILE: src/components/token/web3/Web3Provider.jsx
// ADD THESE FUNCTIONS AT THE END OF THE WEB3PROVIDER CLASS (before the closing brace and export)
// ADD AFTER LINE 686 (after the last existing method)

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
}

// Export singleton instance
export const web3Service = new SolanaWeb3Service();

// Export named functions for convenience
export default web3Service;
