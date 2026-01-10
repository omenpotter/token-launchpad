import { X1RpcService } from './X1RpcService';

export class LiquidityDetectionService {
  constructor(network = 'x1Mainnet') {
    this.rpcService = new X1RpcService(network);
  }

  async detectLiquidity(tokenMintAddress) {
    try {
      // Get token supply
      const supply = await this.rpcService.getTokenSupply(tokenMintAddress);
      
      // Get recent transactions
      const signatures = await this.rpcService.getSignaturesForAddress(
        tokenMintAddress,
        { limit: 100 }
      );
      
      // Analyze transactions for liquidity pool patterns
      const liquidityPools = [];
      const knownDexPrograms = [
        'DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1', // Raydium
        'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc', // Orca Whirlpool
        'srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX', // Serum/OpenBook
      ];
      
      for (const sig of signatures) {
        try {
          const tx = await this.rpcService.getTransaction(sig.signature);
          if (!tx) continue;
          
          // Check if transaction involves DEX programs
          const accounts = tx.transaction.message.accountKeys || [];
          const involvesDex = accounts.some(acc => 
            knownDexPrograms.includes(acc.toString())
          );
          
          if (involvesDex) {
            liquidityPools.push({
              signature: sig.signature,
              timestamp: sig.blockTime,
              dex: 'detected'
            });
          }
        } catch (err) {
          console.warn('Error processing transaction:', err);
        }
      }
      
      return {
        hasLiquidity: liquidityPools.length > 0,
        liquidityPools: liquidityPools.slice(0, 5), // Return top 5
        totalSupply: supply.amount,
        decimals: supply.decimals,
        transactionCount: signatures.length
      };
      
    } catch (error) {
      console.error('Error detecting liquidity:', error);
      throw error;
    }
  }
}

export const liquidityDetectionService = new LiquidityDetectionService();