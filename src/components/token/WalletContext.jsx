import './web3/polyfills';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { web3Service } from './web3/Web3Provider';

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [network, setNetwork] = useState('x1Mainnet');
  const initialized = useRef(false);

  // Check if wallet is already connected on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    
    web3Service.initConnection(network);
    
    // Check for existing wallet connections
    const checkExistingConnection = async () => {
      // Wait longer for wallet extensions to inject
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        // Check Backpack first
        if (window.backpack) {
          try {
            // Try to connect silently if previously connected
            const resp = await window.backpack.connect({ onlyIfTrusted: true });
            if (resp?.publicKey) {
              const result = await web3Service.connectWallet(window.backpack, 'X1Space');
              setWalletAddress(result.address);
              setWalletConnected(true);
              return;
            }
          } catch (e) {
            // User hasn't previously connected
          }
        }

        // Check Phantom
        if (window.phantom?.solana) {
          try {
            // Try to connect silently if previously connected
            const resp = await window.phantom.solana.connect({ onlyIfTrusted: true });
            if (resp?.publicKey) {
              const result = await web3Service.connectWallet(window.phantom.solana, 'X1Space');
              setWalletAddress(result.address);
              setWalletConnected(true);
              return;
            }
          } catch (e) {
            // User hasn't previously connected
          }
        }

        // Check X1 Wallet
        let x1Provider = window.x1Wallet || window.x1 || (window.solana?.isX1Wallet && window.solana);
        if (x1Provider) {
          try {
            // Try to connect silently if previously connected
            const resp = await x1Provider.connect({ onlyIfTrusted: true });
            if (resp?.publicKey) {
              const result = await web3Service.connectWallet(x1Provider, 'X1Space');
              setWalletAddress(result.address);
              setWalletConnected(true);
              return;
            }
          } catch (e) {
            // User hasn't previously connected
          }
        }
      } catch (error) {
        console.log('No existing wallet connection found');
      }
    };

    checkExistingConnection();
  }, []);

  const connectBackpack = useCallback(async () => {
    try {
      if (window.backpack) {
        const result = await web3Service.connectWallet(window.backpack, 'X1Space');
        setWalletAddress(result.address);
        setWalletConnected(true);
        return { success: true };
      } else {
        return { success: false, error: 'Backpack wallet not found. Please install Backpack from https://backpack.app' };
      }
    } catch (error) {
      return { success: false, error: 'Failed to connect Backpack: ' + error.message };
    }
  }, []);

  const connectPhantom = useCallback(async () => {
    try {
      if (window.phantom?.solana) {
        const result = await web3Service.connectWallet(window.phantom.solana, 'X1Space');
        setWalletAddress(result.address);
        setWalletConnected(true);
        return { success: true };
      } else {
        return { success: false, error: 'Phantom wallet not found. Please install Phantom from https://phantom.app' };
      }
    } catch (error) {
      return { success: false, error: 'Failed to connect Phantom: ' + error.message };
    }
  }, []);

  const connectX1 = useCallback(async () => {
    try {
      // Wait for wallet to inject if not immediately available
      let retries = 0;
      const maxRetries = 10;
      
      while (retries < maxRetries) {
        let x1Provider = null;
        
        // X1 Wallet detection - based on actual provider.js injection
        if (window.x1Wallet) {
          x1Provider = window.x1Wallet;
        } else if (window.x1) {
          x1Provider = window.x1;
        } else if (window.solana?.isX1Wallet) {
          x1Provider = window.solana;
        }
        
        if (x1Provider) {
          const result = await web3Service.connectWallet(x1Provider, 'X1Space');
          setWalletAddress(result.address);
          setWalletConnected(true);
          return { success: true };
        }
        
        // Wait 100ms before retrying
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }
      
      return { success: false, error: 'X1 Wallet not found. Please install the X1 Wallet extension and refresh the page.' };
    } catch (error) {
      return { success: false, error: 'Failed to connect X1 Wallet: ' + error.message };
    }
  }, []);

  const disconnectWallet = useCallback(async () => {
    await web3Service.disconnect();
    setWalletConnected(false);
    setWalletAddress('');
  }, []);

  const value = {
    walletConnected,
    walletAddress,
    network,
    setNetwork,
    connectBackpack,
    connectPhantom,
    connectX1,
    disconnectWallet
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}