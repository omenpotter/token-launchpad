import React from 'react';
import { WalletProvider } from './components/token/WalletContext';
import './components/token/web3/polyfills';

export default function Layout({ children, currentPageName }) {
  return (
    <WalletProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {children}
      </div>
    </WalletProvider>
  );
}