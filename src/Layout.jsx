import './components/token/web3/polyfills';
import React, { useEffect } from 'react';
import { WalletProvider } from './components/token/WalletContext';

export default function Layout({ children, currentPageName }) {
  useEffect(() => {
    // Set document title for wallet detection
    document.title = 'X1Nexus Launcher';
    
    // Set meta tags for dApp identity
    const setMetaTag = (property, content) => {
      let meta = document.querySelector(`meta[property="${property}"]`) || 
                 document.querySelector(`meta[name="${property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };
    
    // Standard dApp metadata
    setMetaTag('og:title', 'X1Nexus');
    setMetaTag('og:site_name', 'X1Nexus');
    setMetaTag('og:image', 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695ece00f88266143b4441ac/5910381b6_711323c7-8ae9-4314-922d-ccab7986c619.jpg');
    setMetaTag('application-name', 'X1Nexus');
    setMetaTag('apple-mobile-web-app-title', 'X1Nexus');

    // Solana dApp standard metadata
    setMetaTag('dapp:name', 'X1Nexus');
    setMetaTag('dapp:icon', 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695ece00f88266143b4441ac/5910381b6_711323c7-8ae9-4314-922d-ccab7986c619.jpg');
  }, []);

  return (
    <WalletProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {children}
      </div>
    </WalletProvider>
  );
}