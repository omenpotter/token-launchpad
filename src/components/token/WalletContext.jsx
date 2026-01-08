import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { web3Service } from './web3/Web3Provider';

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [network, setNetwork] = useState('x1Testnet');
  const initialized = useRef(false);

  // Check if wallet is already connected on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    
    web3Service.initConnection(network);
    
    // Check for existing wallet connections
    const checkExistingConnection = async () => {
      // Small delay to let wallet extensions inject
      await new Promise(resolve => setTimeout(resolve, 100));
      
      try {
        // Check Backpack first
        if (window.backpack) {
          try {
            // Try to connect silently if previously connected
            const resp = await window.backpack.connect({ onlyIfTrusted: true });
            if (resp?.publicKey) {
              const result = await web3Service.connectWallet(window.backpack);
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
              const result = await web3Service.connectWallet(window.phantom.solana);
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
        const result = await web3Service.connectWallet(window.backpack);
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
        const result = await web3Service.connectWallet(window.phantom.solana);
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