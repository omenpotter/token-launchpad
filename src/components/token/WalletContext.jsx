import './web3/polyfills';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { web3Service } from './web3/Web3Provider';

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletType, setWalletType] = useState(''); // 'backpack', 'x1', etc.
  const [network, setNetwork] = useState('x1Mainnet');
  const initialized = useRef(false);

  // Check if wallet is already connected on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    
    web3Service.initConnection(network);
    
    // Check for existing wallet connections
    const checkExistingConnection = async () => {
      // Wait for wallet extensions to inject (critical for X1 Wallet)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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
              setWalletType('backpack');
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
              setWalletType('x1');
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
        setWalletType('backpack');
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
      console.log('[X1Space] ═══ X1 Wallet Detection Started ═══');
      
      // Initial check of all possible injection points
      console.log('[X1Space] window.x1Wallet:', typeof window.x1Wallet, window.x1Wallet?._initialized);
      console.log('[X1Space] window.x1:', typeof window.x1, window.x1?._initialized);
      console.log('[X1Space] window.solana:', typeof window.solana);
      console.log('[X1Space] window.solana?.isX1Wallet:', window.solana?.isX1Wallet);
      
      // Check for injected event
      console.log('[X1Space] Waiting for X1 Wallet injection...');
      
      // Listen for injection event
      let injectionDetected = false;
      const injectionListener = () => {
        console.log('[X1Space] 🎯 X1 Wallet injection event detected!');
        injectionDetected = true;
      };
      window.addEventListener('x1Wallet#initialized', injectionListener);
      
      // Wait longer for extension injection (up to 2 seconds)
      let retries = 0;
      const maxRetries = 20;
      const retryDelay = 100;
      
      while (retries < maxRetries) {
        let x1Provider = null;
        
        // Check all injection points
        if (window.x1Wallet?._initialized) {
          console.log('[X1Space] ✅ Found via window.x1Wallet (initialized)');
          x1Provider = window.x1Wallet;
        } else if (window.x1?._initialized) {
          console.log('[X1Space] ✅ Found via window.x1 (initialized)');
          x1Provider = window.x1;
        } else if (window.solana?.isX1Wallet) {
          console.log('[X1Space] ✅ Found via window.solana.isX1Wallet');
          x1Provider = window.solana;
        }
        
        if (x1Provider) {
          window.removeEventListener('x1Wallet#initialized', injectionListener);
          console.log('[X1Space] 🔗 Attempting connection...');
          
          try {
            const result = await web3Service.connectWallet(x1Provider, 'X1Space');
            setWalletAddress(result.address);
            setWalletConnected(true);
            setWalletType('x1');
            console.log('[X1Space] ✅ Connected successfully to:', result.address);
            return { success: true };
          } catch (connError) {
            console.error('[X1Space] ❌ Connection failed:', connError);
            return { success: false, error: 'Connection failed: ' + connError.message };
          }
        }
        
        // Wait before next retry
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        retries++;
        
        if (retries % 5 === 0) {
          console.log(`[X1Space] ⏳ Still waiting... (${retries}/${maxRetries})`);
        }
      }
      
      window.removeEventListener('x1Wallet#initialized', injectionListener);
      
      console.error('[X1Space] ═══ DETECTION FAILED ═══');
      console.error('[X1Space] Waited', (maxRetries * retryDelay) / 1000, 'seconds');
      console.error('[X1Space] Extension status:');
      console.error('[X1Space] - window.x1Wallet exists:', !!window.x1Wallet);
      console.error('[X1Space] - window.x1 exists:', !!window.x1);
      console.error('[X1Space] - Injection event detected:', injectionDetected);
      
      return { 
        success: false, 
        error: 'X1 Wallet not detected after 2 seconds.\n\n' +
               'Troubleshooting:\n' +
               '1. Check if extension is installed and enabled\n' +
               '2. Try refreshing the page\n' +
               '3. Check browser console for errors\n' +
               '4. Verify extension has permission for this site' 
      };
    } catch (error) {
      console.error('[X1Space] ❌ Unexpected error:', error);
      return { success: false, error: 'Unexpected error: ' + error.message };
    }
  }, []);

  const disconnectWallet = useCallback(async () => {
    await web3Service.disconnect();
    setWalletConnected(false);
    setWalletAddress('');
    setWalletType('');
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