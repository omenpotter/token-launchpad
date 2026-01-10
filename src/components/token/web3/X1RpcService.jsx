import * as web3 from '@solana/web3.js';
import { NETWORK_CONFIG } from './contracts';

const { Connection, PublicKey } = web3;

export class X1RpcService {
  constructor(network = 'x1Mainnet') {
    this.network = network;
    this.connection = new Connection(NETWORK_CONFIG[network].rpcUrl, 'confirmed');
  }

  async getTokenAccountsByOwner(ownerAddress, mintAddress) {
    try {
      const ownerPublicKey = new PublicKey(ownerAddress);
      const mintPublicKey = new PublicKey(mintAddress);
      
      const tokenAccounts = await this.connection.getTokenAccountsByOwner(
        ownerPublicKey,
        { mint: mintPublicKey }
      );
      
      return tokenAccounts.value.map(account => ({
        pubkey: account.pubkey.toString(),
        account: account.account
      }));
    } catch (error) {
      console.error('Error fetching token accounts:', error);
      throw error;
    }
  }

  async getAccountInfo(address) {
    try {
      const publicKey = new PublicKey(address);
      const accountInfo = await this.connection.getAccountInfo(publicKey);
      return accountInfo;
    } catch (error) {
      console.error('Error fetching account info:', error);
      throw error;
    }
  }

  async getTokenSupply(mintAddress) {
    try {
      const mintPublicKey = new PublicKey(mintAddress);
      const supply = await this.connection.getTokenSupply(mintPublicKey);
      return supply.value;
    } catch (error) {
      console.error('Error fetching token supply:', error);
      throw error;
    }
  }

  async getSignaturesForAddress(address, options = {}) {
    try {
      const publicKey = new PublicKey(address);
      const signatures = await this.connection.getSignaturesForAddress(
        publicKey,
        options
      );
      return signatures;
    } catch (error) {
      console.error('Error fetching signatures:', error);
      throw error;
    }
  }

  async getTransaction(signature) {
    try {
      const transaction = await this.connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0
      });
      return transaction;
    } catch (error) {
      console.error('Error fetching transaction:', error);
      throw error;
    }
  }
}

export const x1RpcService = new X1RpcService();