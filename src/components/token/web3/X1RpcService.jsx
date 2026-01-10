import './polyfills';
import * as web3 from '@solana/web3.js';
import { NETWORK_CONFIG } from './contracts';

const { Connection, PublicKey } = web3;

class X1RpcService {
  constructor() {
    this.connection = null;
    this.network = 'x1Mainnet';
  }

  initConnection(network = 'x1Mainnet') {
    this.network = network;
    const config = NETWORK_CONFIG[network];
    this.connection = new Connection(config.rpcUrl, 'confirmed');
    return this.connection;
  }

  getConnection() {
    if (!this.connection) {
      this.initConnection();
    }
    return this.connection;
  }

  async getTokenSupply(mintAddress) {
    try {
      const connection = this.getConnection();
      const mint = new PublicKey(mintAddress);
      const supply = await connection.getTokenSupply(mint);
      
      return {
        amount: supply.value.amount,
        decimals: supply.value.decimals,
        uiAmount: supply.value.uiAmount
      };
    } catch (error) {
      console.error('[X1RpcService] Error getting token supply:', error);
      throw error;
    }
  }

  async getSignaturesForAddress(address, options = {}) {
    try {
      const connection = this.getConnection();
      const pubkey = new PublicKey(address);
      const limit = options.limit || 100;
      
      const signatures = await connection.getSignaturesForAddress(pubkey, { limit });
      return signatures;
    } catch (error) {
      console.error('[X1RpcService] Error getting signatures:', error);
      throw error;
    }
  }

  async getTransaction(signature) {
    try {
      const connection = this.getConnection();
      const tx = await connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0
      });
      return tx;
    } catch (error) {
      console.error('[X1RpcService] Error getting transaction:', error);
      return null;
    }
  }

  async getAccountInfo(address) {
    try {
      const connection = this.getConnection();
      const pubkey = new PublicKey(address);
      const accountInfo = await connection.getAccountInfo(pubkey);
      return accountInfo;
    } catch (error) {
      console.error('[X1RpcService] Error getting account info:', error);
      throw error;
    }
  }

  async getBalance(address) {
    try {
      const connection = this.getConnection();
      const pubkey = new PublicKey(address);
      const balance = await connection.getBalance(pubkey);
      return balance / web3.LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('[X1RpcService] Error getting balance:', error);
      throw error;
    }
  }
}

export const x1RpcService = new X1RpcService();