// FILE: src/components/token/DashboardTab.jsx
// FIND AND REPLACE THE MINT MORE AND BURN BUTTONS (around lines 223-320)
// REPLACE WITH THIS CODE:

{/* ✅ FIXED: Mint More Button with proper validation */}
<button
  onClick={async () => {
    if (!walletConnected) {
      alert('Please connect your wallet first');
      return;
    }

    const mintAmount = prompt(`Enter amount of ${token.symbol} to mint:`);
    if (!mintAmount || isNaN(mintAmount) || parseFloat(mintAmount) <= 0) {
      alert('Invalid mint amount');
      return;
    }

    try {
      // ✅ CRITICAL FIX: Validate mint address first
      if (!token.mint || typeof token.mint !== 'string') {
        throw new Error('Invalid token mint address in database');
      }

      // Trim and validate length
      const mintAddress = token.mint.trim();
      if (mintAddress.length < 32 || mintAddress.length > 44) {
        throw new Error(`Invalid mint address length: ${mintAddress.length} (expected 32-44)`);
      }

      // ✅ Initialize connection if needed
      if (!web3Service.connection) {
        web3Service.initConnection(network || 'x1Mainnet');
      }

      const programId = token.type === 'TOKEN2022' 
        ? 'TokenzQdBNbNbGKPFXCWuBvf9Ss623VQ5DA' 
        : 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
      
      console.log('[Dashboard] Minting:', {
        mint: mintAddress,
        amount: parseFloat(mintAmount),
        decimals: token.decimals || 9,
        programId
      });
      
      const result = await web3Service.mintTokens(
        mintAddress,
        parseFloat(mintAmount),
        token.decimals || 9,
        0, // No fee for dashboard minting
        programId
      );

      // Update database
      await base44.entities.Token.update(token.id, {
        totalMinted: (token.totalMinted || 0) + parseFloat(mintAmount),
        supply: token.supply + parseFloat(mintAmount)
      });

      if (typeof refetchTokens === 'function') {
        await refetchTokens();
      }

      alert(`✅ Minted ${mintAmount} ${token.symbol} successfully!\n\nTransaction: ${result.txHash}\n\nView on Explorer:\nhttps://explorer.x1.xyz/tx/${result.txHash}`);
    } catch (error) {
      console.error('[Dashboard] Mint error:', error);
      alert('Failed to mint tokens: ' + error.message);
    }
  }}
  className="flex items-center justify-center gap-2 px-3 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg transition text-sm font-medium"
>
  <Zap className="w-4 h-4" />
  Mint More
</button>

{/* ✅ FIXED: Burn Button with incinerator address */}
<button
  onClick={async () => {
    if (!walletConnected) {
      alert('Please connect your wallet first');
      return;
    }

    const burnAmount = prompt(`Enter amount of ${token.symbol} to burn:`);
    if (!burnAmount || isNaN(burnAmount) || parseFloat(burnAmount) <= 0) {
      alert('Invalid burn amount');
      return;
    }

    // ⚠️ Burn confirmation with incinerator address
    const confirmBurn = window.confirm(
      `⚠️ WARNING: Burn ${burnAmount} ${token.symbol}?\n\n` +
      `This action is PERMANENT and IRREVERSIBLE.\n` +
      `Burned tokens will be sent to:\n` +
      `1nc1nerator11111111111111111111111111111111\n\n` +
      `Are you absolutely sure?`
    );

    if (!confirmBurn) {
      return;
    }

    try {
      // ✅ CRITICAL FIX: Validate mint address first
      if (!token.mint || typeof token.mint !== 'string') {
        throw new Error('Invalid token mint address in database');
      }

      // Trim and validate length
      const mintAddress = token.mint.trim();
      if (mintAddress.length < 32 || mintAddress.length > 44) {
        throw new Error(`Invalid mint address length: ${mintAddress.length} (expected 32-44)`);
      }

      // ✅ Initialize connection if needed
      if (!web3Service.connection) {
        web3Service.initConnection(network || 'x1Mainnet');
      }

      const programId = token.type === 'TOKEN2022' 
        ? 'TokenzQdBNbNbGKPFXCWuBvf9Ss623VQ5DA' 
        : 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
      
      console.log('[Dashboard] Burning:', {
        mint: mintAddress,
        amount: parseFloat(burnAmount),
        decimals: token.decimals || 9,
        programId,
        destination: '1nc1nerator11111111111111111111111111111111'
      });
      
      const result = await web3Service.burnTokens(
        mintAddress,
        parseFloat(burnAmount),
        token.decimals || 9,
        programId
      );

      // Update database
      await base44.entities.Token.update(token.id, {
        burned: (token.burned || 0) + parseFloat(burnAmount),
        supply: Math.max(0, token.supply - parseFloat(burnAmount))
      });

      if (typeof refetchTokens === 'function') {
        await refetchTokens();
      }

      alert(`✅ Burned ${burnAmount} ${token.symbol} successfully!\n\nTokens sent to incinerator:\n1nc1nerator11111111111111111111111111111111\n\nTransaction: ${result.txHash}\n\nView on Explorer:\nhttps://explorer.x1.xyz/tx/${result.txHash}`);
    } catch (error) {
      console.error('[Dashboard] Burn error:', error);
      alert('Failed to burn tokens: ' + error.message);
    }
  }}
  className="flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition text-sm font-medium"
>
  <Flame className="w-4 h-4" />
  Burn
</button>
