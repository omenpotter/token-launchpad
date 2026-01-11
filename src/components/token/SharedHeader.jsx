import React, { useState } from 'react';
import { Wallet, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useWallet } from './WalletContext';
import WalletConnectModal from './WalletConnectModal';

const X1_LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695ece00f88266143b4441ac/5910381b6_711323c7-8ae9-4314-922d-ccab7986c619.jpg";
const TELEGRAM_ICON = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695ece00f88266143b4441ac/3166166d8_Telegram_2019_Logosvg1.jpg";
const TWITTER_ICON = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695ece00f88266143b4441ac/2e2eecb01_31AGs2bX7mL.png";

export default function SharedHeader() {
  const { walletConnected, walletAddress, connectBackpack, connectPhantom, connectX1, disconnectWallet } = useWallet();
  const [showWalletModal, setShowWalletModal] = useState(false);

  const handleConnectBackpack = async () => {
    const result = await connectBackpack();
    if (result.success) {
      setShowWalletModal(false);
    } else {
      alert(result.error);
    }
  };



  const handleConnectX1 = async () => {
    const result = await connectX1();
    if (result.success) {
      setShowWalletModal(false);
    } else {
      alert(result.error);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-900/80 border-b border-slate-800/50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to={createPageUrl('Minting')} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden">
                <img src={X1_LOGO} alt="X1Space" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">X1Space Launcher</h1>
                <p className="text-xs text-slate-400">Create, mint & launch tokens</p>
              </div>
            </Link>

            {walletConnected ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-sm text-slate-300 font-mono">
                    {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
                  </span>
                </div>
                <button
                  onClick={disconnectWallet}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition border border-red-500/20"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Disconnect</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowWalletModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl transition font-medium"
              >
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </header>

      <nav className="bg-slate-900/50 border-b border-slate-800/50">
        <div className="max-w-6xl mx-auto px-4 py-2">
          <div className="flex items-center gap-4 text-sm">
            <a href="https://xdex.xyz" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-cyan-400 transition">
              xDEX
            </a>
            <a href="https://x1.ninja" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-cyan-400 transition">
              x1.ninja
            </a>
            <a href="https://www.x1space.xyz/" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-cyan-400 transition">
              Explorer
            </a>
            <a href="https://t.me/xdex_xyz" target="_blank" rel="noopener noreferrer" title="Telegram">
              <img src={TELEGRAM_ICON} alt="Telegram" className="w-5 h-5 rounded-full hover:opacity-80 transition" />
            </a>
            <a href="https://x.com/rkbehelvi" target="_blank" rel="noopener noreferrer" title="X">
              <img src={TWITTER_ICON} alt="X" className="w-5 h-5 hover:opacity-80 transition" />
            </a>
          </div>
        </div>
      </nav>

      <WalletConnectModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onConnectBackpack={handleConnectBackpack}
        onConnectX1={handleConnectX1}
      />
    </>
  );
}