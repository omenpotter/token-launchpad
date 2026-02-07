// FILE: src/services/XDEXService.js
// ✅ XDEX API Integration for X1Nexus Launcher
// Documentation: https://api.xdex.xyz

const XDEX_API_BASE = 'https://api.xdex.xyz';

/**
 * XDEX Service - All DEX operations via XDEX API
 */
class XDEXService {
  constructor() {
    this.baseUrl = XDEX_API_BASE;
  }

  /**
   * Get wallet tokens with metadata
   */
  async getWalletTokens(walletAddress, network = 'X1 Mainnet') {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/xendex/wallet/tokens?` +
        `network=${encodeURIComponent(network)}&` +
        `wallet_address=${walletAddress}`
      );

      if (!response.ok) {
        throw new Error(`XDEX API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error('Failed to fetch wallet tokens');
      }

      return data.data.tokens;
    } catch (error) {
      console.error('[XDEX] Get wallet tokens error:', error);
      throw error;
    }
  }

  /**
   * Get token price in USD
   */
  async getTokenPrice(tokenAddress, network = 'X1 Mainnet') {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/token-price/price?` +
        `network=${encodeURIComponent(network)}&` +
        `address=${tokenAddress}`
      );

      if (!response.ok) {
        throw new Error(`Price fetch error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.price || 0;
    } catch (error) {
      console.error('[XDEX] Get token price error:', error);
      return 0;
    }
  }

  /**
   * Get LP token price
   */
  async getLPTokenPrice(lpMintAddress, network = 'X1 Mainnet') {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/token-price/lp-price?` +
        `network=${encodeURIComponent(network)}&` +
        `address=${lpMintAddress}`
      );

      if (!response.ok) {
        throw new Error(`LP price fetch error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.price || 0;
    } catch (error) {
      console.error('[XDEX] Get LP price error:', error);
      return 0;
    }
  }

  /**
   * List all pools
   */
  async listPools(network = 'X1 Mainnet') {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/xendex/pool/list?network=${encodeURIComponent(network)}`
      );

      if (!response.ok) {
        throw new Error(`Pool list error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.pools || [];
    } catch (error) {
      console.error('[XDEX] List pools error:', error);
      throw error;
    }
  }

  /**
   * Get pool status
   */
  async getPoolStatus(network = 'X1 Mainnet') {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/xendex/pool/status?network=${encodeURIComponent(network)}`
      );

      if (!response.ok) {
        throw new Error(`Pool status error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[XDEX] Get pool status error:', error);
      throw error;
    }
  }

  /**
   * Get specific pool info
   */
  async getPool(poolAddress, network = 'X1 Mainnet') {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/xendex/pool/${poolAddress}?network=${encodeURIComponent(network)}`
      );

      if (!response.ok) {
        throw new Error(`Pool fetch error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[XDEX] Get pool error:', error);
      throw error;
    }
  }

  /**
   * Get pool by token pair
   */
  async getPoolByTokenPair(token1, token2, network = 'X1 Mainnet') {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/xendex/pool/tokens/${token1}/${token2}?` +
        `network=${encodeURIComponent(network)}`
      );

      if (!response.ok) {
        throw new Error(`Pool by tokens error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[XDEX] Get pool by tokens error:', error);
      throw error;
    }
  }

  /**
   * Get swap quote
   */
  async getSwapQuote(tokenIn, tokenOut, amountIn, network = 'X1 Mainnet') {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/xendex/swap/quote?` +
        `network=${encodeURIComponent(network)}&` +
        `token_in=${tokenIn}&` +
        `token_out=${tokenOut}&` +
        `token_in_amount=${amountIn}`
      );

      if (!response.ok) {
        throw new Error(`Quote error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[XDEX] Get quote error:', error);
      throw error;
    }
  }

  /**
   * Prepare swap transaction
   */
  async prepareSwap(params) {
    try {
      const {
        network = 'X1 Mainnet',
        wallet,
        tokenIn,
        tokenOut,
        amountIn,
        slippage = 1.0,
        isExactAmountIn = true
      } = params;

      const response = await fetch(
        `${this.baseUrl}/api/xendex/swap/prepare`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            network,
            wallet,
            token_in: tokenIn,
            token_out: tokenOut,
            token_in_amount: amountIn,
            is_exact_amount_in: isExactAmountIn,
            slippage_tolerance: slippage
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Swap prepare error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[XDEX] Prepare swap error:', error);
      throw error;
    }
  }

  /**
   * Create liquidity pool
   */
  async createPool(params) {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/xendex/pool/create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(params)
        }
      );

      if (!response.ok) {
        throw new Error(`Create pool error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[XDEX] Create pool error:', error);
      throw error;
    }
  }

  /**
   * Deposit liquidity to pool
   */
  async depositLiquidity(params) {
    try {
      const {
        network = 'X1 Mainnet',
        wallet,
        tokenA,
        tokenB,
        amountA,
        amountB,
        slippage = 1.0
      } = params;

      const response = await fetch(
        `${this.baseUrl}/api/xendex/pool/deposit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            network,
            wallet_address: wallet,
            token_a: tokenA,
            token_b: tokenB,
            amount_a: amountA,
            amount_b: amountB,
            slippage_tolerance: slippage
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Deposit error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[XDEX] Deposit liquidity error:', error);
      throw error;
    }
  }

  /**
   * Withdraw liquidity from pool
   */
  async withdrawLiquidity(params) {
    try {
      const {
        network = 'X1 Mainnet',
        wallet,
        poolAddress,
        lpAmount,
        slippage = 1.0
      } = params;

      const response = await fetch(
        `${this.baseUrl}/api/xendex/pool/withdraw`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            network,
            wallet_address: wallet,
            pool_address: poolAddress,
            lp_token_amount: lpAmount,
            slippage_tolerance: slippage
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Withdraw error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[XDEX] Withdraw liquidity error:', error);
      throw error;
    }
  }

  /**
   * List farms
   */
  async listFarms(network = 'X1 Mainnet') {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/xendex/farm/list?network=${encodeURIComponent(network)}`
      );

      if (!response.ok) {
        throw new Error(`Farm list error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.farms || [];
    } catch (error) {
      console.error('[XDEX] List farms error:', error);
      throw error;
    }
  }

  /**
   * Get specific farm
   */
  async getFarm(poolAddress, network = 'X1 Mainnet') {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/xendex/farm/${poolAddress}?network=${encodeURIComponent(network)}`
      );

      if (!response.ok) {
        throw new Error(`Farm fetch error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[XDEX] Get farm error:', error);
      throw error;
    }
  }

  /**
   * Get chart history
   */
  async getChartHistory(params) {
    try {
      const { network = 'X1 Mainnet', ...rest } = params;
      const queryString = new URLSearchParams({
        network,
        ...rest
      }).toString();

      const response = await fetch(
        `${this.baseUrl}/api/xendex/chart/history?${queryString}`
      );

      if (!response.ok) {
        throw new Error(`Chart history error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[XDEX] Get chart history error:', error);
      throw error;
    }
  }

  /**
   * Get chart price
   */
  async getChartPrice(params) {
    try {
      const { network = 'X1 Mainnet', ...rest } = params;
      const queryString = new URLSearchParams({
        network,
        ...rest
      }).toString();

      const response = await fetch(
        `${this.baseUrl}/api/xendex/chart/price?${queryString}`
      );

      if (!response.ok) {
        throw new Error(`Chart price error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[XDEX] Get chart price error:', error);
      throw error;
    }
  }

  /**
   * List validators
   */
  async listValidators(network = 'X1 Mainnet') {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/xendex/validators?network=${encodeURIComponent(network)}`
      );

      if (!response.ok) {
        throw new Error(`Validators list error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.validators || [];
    } catch (error) {
      console.error('[XDEX] List validators error:', error);
      throw error;
    }
  }

  /**
   * Get wallet pool tokens (LP tokens)
   */
  async getWalletPoolTokens(walletAddress, network = 'X1 Mainnet') {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/xendex/wallet/tokens/pool?` +
        `network=${encodeURIComponent(network)}&` +
        `wallet_address=${walletAddress}`
      );

      if (!response.ok) {
        throw new Error(`Pool tokens error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.tokens || [];
    } catch (error) {
      console.error('[XDEX] Get pool tokens error:', error);
      throw error;
    }
  }
}

// Export singleton
export const xdexService = new XDEXService();
export default xdexService;
