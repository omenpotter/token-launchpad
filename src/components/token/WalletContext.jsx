import './web3/polyfills';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { web3Service } from './web3/Web3Provider';

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletType, setWalletType] = useState('');
  const [network, setNetwork] = useState('x1Mainnet');
  const initialized = useRef(false);

  // Initialize connection on mount - NO AUTO-CONNECT
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    
    web3Service.initConnection(network);
    
    // CRITICAL FIX: REMOVED all auto-connect logic
    // Users MUST explicitly click "Connect Wallet" button
    // NO onlyIfTrusted checks - they auto-connect without approval popup
    console.log('[X1Space] WalletProvider initialized - awaiting manual wallet connection');
  }, []);

  // FIXED: Backpack connection with explicit approval popup
  const connectBackpack = useCallback(async () => {
    try {
      if (!window.backpack) {
        return { 
          success: false, 
          error: 'Backpack wallet not found. Please install Backpack from https://backpack.app' 
        };
      }

      console.log('[X1Space] Connecting Backpack - forcing explicit user approval...');
      
      // CRITICAL FIX: Force explicit connect - NO onlyIfTrusted, NO silent mode
      // This MUST show the wallet approval popup
      const result = await web3Service.connectWallet(window.backpack, 'X1Space');
      
      setWalletAddress(result.address);
      setWalletConnected(true);
      setWalletType('backpack');
      
      console.log('[X1Space] ✅ Backpack connected:', result.address);
      return { success: true };
      
    } catch (error) {
      console.error('[X1Space] Backpack connection error:', error);
      return { 
        success: false, 
        error: 'Failed to connect Backpack: ' + error.message 
      };
    }
  }, []);

  // FIXED: Phantom connection with explicit approval
  const connectPhantom = useCallback(async () => {
    try {
      if (!window.phantom?.solana) {
        return { 
          success: false, 
          error: 'Phantom wallet not found. Please install Phantom from https://phantom.app' 
        };
      }

      console.log('[X1Space] Connecting Phantom - forcing explicit user approval...');
      
      // CRITICAL FIX: Force explicit connect - NO onlyIfTrusted
      const result = await web3Service.connectWallet(window.phantom.solana, 'X1Space');
      
      setWalletAddress(result.address);
      setWalletConnected(true);
      setWalletType('phantom');
      
      console.log('[X1Space] ✅ Phantom connected:', result.address);
      return { success: true };
      
    } catch (error) {
      console.error('[X1Space] Phantom connection error:', error);
      return { 
        success: false, 
        error: 'Failed to connect Phantom: ' + error.message 
      };
    }
  }, []);

  // FIXED: X1 Wallet connection with proper branding
  const connectX1 = useCallback(async () => {
    try {
      console.log('[X1Space] ••• X1 Wallet Detection Started •••');
      
      console.log('[X1Space] window.x1Wallet:', typeof window.x1Wallet, window.x1Wallet?._initialized);
      console.log('[X1Space] window.x1:', typeof window.x1, window.x1?._initialized);
      console.log('[X1Space] window.solana:', typeof window.solana);
      console.log('[X1Space] window.solana?.isX1Wallet:', window.solana?.isX1Wallet);
      
      console.log('[X1Space] Waiting for X1 Wallet injection...');
      
      let injectionDetected = false;
      const injectionListener = () => {
        console.log('[X1Space] 🎯 X1 Wallet injection event detected!');
        injectionDetected = true;
      };
      window.addEventListener('x1Wallet#initialized', injectionListener);
      
      let retries = 0;
      const maxRetries = 20;
      const retryDelay = 100;
      
      while (retries < maxRetries) {
        let x1Provider = null;
        
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
          console.log('[X1Space] 🔗 Attempting connection with explicit branding...');
          
          try {
            // CRITICAL FIX: Pass metadata to show X1Space branding
            const result = await web3Service.connectWallet(x1Provider, 'X1Space');
            
            setWalletAddress(result.address);
            setWalletConnected(true);
            setWalletType('x1');
            
            console.log('[X1Space] ✅ Connected successfully to:', result.address);
            return { success: true };
            
          } catch (connError) {
            console.error('[X1Space] ❌ Connection failed:', connError);
            return { 
              success: false, 
              error: 'Connection failed: ' + connError.message 
            };
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        retries++;
        
        if (retries % 5 === 0) {
          console.log(`[X1Space] ⏳ Still waiting... (${retries}/${maxRetries})`);
        }
      }
      
      window.removeEventListener('x1Wallet#initialized', injectionListener);
      
      console.error('[X1Space] ••• DETECTION FAILED •••');
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
      return { 
        success: false, 
        error: 'Unexpected error: ' + error.message 
      };
    }
  }, []);

  // FIXED: Disconnect removes all state
  const disconnectWallet = useCallback(async () => {
    try {
      await web3Service.disconnect();
      setWalletConnected(false);
      setWalletAddress('');
      setWalletType('');
      console.log('[X1Space] Wallet disconnected');
    } catch (error) {
      console.error('[X1Space] Error disconnecting wallet:', error);
    }
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
