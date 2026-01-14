import React, { useState } from 'react';
import { Droplets, Plus, Minus, AlertTriangle, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function LiquidityManagement({ token, currency }) {
  return (
    <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
            <Droplets className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Liquidity Management</h3>
            <p className="text-xs text-slate-400">{token.symbol} / {currency}</p>
          </div>
        </div>
      </div>

      <div className="p-5 text-center space-y-4">
        <p className="text-slate-300 mb-4">
          Manage liquidity for {token.symbol} through our dedicated liquidity pool page.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            to={createPageUrl('LiquidityPool')}
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
          >
            <Droplets className="w-5 h-5" />
            Manage Liquidity
          </Link>

          <a
            href="https://app.xdex.xyz/liquidity"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            View on xDEX
          </a>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mt-4">
          <p className="text-xs text-blue-400">
            Liquidity data and pool management are handled through xDEX. Visit the Liquidity Pool page to add or remove liquidity.
          </p>
        </div>
      </div>
    </div>
  );
}