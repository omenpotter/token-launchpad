import React from 'react';
import { Coins } from 'lucide-react';

export default function MintingFeeConfig({ mintingFee, setMintingFee, currency = 'XNT' }) {
  return (
    <div className="bg-slate-700/30 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Coins className="w-5 h-5 text-cyan-400" />
        <h4 className="font-semibold text-white">Minting Fee Configuration</h4>
      </div>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm text-slate-400 mb-2">
            Public Minting Fee (per mint)
          </label>
          <div className="relative">
            <input
              type="number"
              value={mintingFee}
              onChange={(e) => setMintingFee(Math.max(0, parseFloat(e.target.value) || 0))}
              min="0"
              step="0.01"
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-2.5 pr-16 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
              {currency}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            {mintingFee === 0 ? '✨ Free mint enabled - users pay no fee' : `Users will pay ${mintingFee} ${currency} per mint`}
          </p>
        </div>
        
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          <p className="text-xs text-blue-300">
            💡 <strong>Tip:</strong> Set to 0 for a free public mint. Platform fees apply separately.
          </p>
        </div>
      </div>
    </div>
  );
}