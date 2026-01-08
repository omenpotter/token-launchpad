import React from 'react';

const TELEGRAM_ICON = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695ece00f88266143b4441ac/3166166d8_Telegram_2019_Logosvg1.jpg";
const TWITTER_ICON = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695ece00f88266143b4441ac/2e2eecb01_31AGs2bX7mL.png";

export default function SharedFooter() {
  return (
    <footer className="mt-12 border-t border-slate-800/50 bg-slate-900/50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <p className="text-slate-400 text-sm">© 2026 X1Space Launcher. All rights reserved.</p>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://xdex.xyz" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-cyan-400 transition text-sm">
              xDEX.xyz
            </a>
            <a href="https://t.me/xdex_xyz" target="_blank" rel="noopener noreferrer" title="Telegram">
              <img src={TELEGRAM_ICON} alt="Telegram" className="w-5 h-5 rounded-full hover:opacity-80 transition" />
            </a>
            <a href="https://x.com/rkbehelvi" target="_blank" rel="noopener noreferrer" title="X">
              <img src={TWITTER_ICON} alt="X" className="w-5 h-5 hover:opacity-80 transition" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}