import React from 'react';
import { Droplets, Lock, Clock, AlertCircle } from 'lucide-react';

export default function LiquidityPoolSection({
  createLiquidity,
  setCreateLiquidity,
  liquidityAmount,
  setLiquidityAmount,
  liquidityLockPeriod,
  setLiquidityLockPeriod,
  pairToken,
  setPairToken,
  currency,
  createdTokens = []
}) {
  const lockPeriods = [
    { value: 0, label: 'No Lock' },
    { value: 30, label: '30 Days' },
    { value: 90, label: '90 Days' },
    { value: 180, label: '6 Months' },
    { value: 365, label: '1 Year' },
    { value: 730, label: '2 Years' },
    { value: -1, label: 'Forever' }
  ];

  return (
    <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
            <Droplets className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Liquidity Pool</h3>
            <p className="text-xs text-slate-400">Create and lock liquidity for your token</p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={createLiquidity}
            onChange={(e) => setCreateLiquidity(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
        </label>
      </div>

      {createLiquidity && (
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Pair Token</label>
              <select
                value={pairToken}
                onChange={(e) => setPairToken(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition"
              >
                <option value="native">{currency} (Native)</option>
                {createdTokens.map(token => (
                  <option key={token.id} value={token.symbol}>
                    {token.name} ({token.symbol})
                  </option>
                ))}
                <option value="usdc">USDC</option>
                <option value="usdt">USDT</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {currency} Amount for Liquidity
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={liquidityAmount}
                  onChange={(e) => setLiquidityAmount(Number(e.target.value))}
                  placeholder="10"
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 pr-16 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                  {currency}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              Lock Period
            </label>
            <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
              {lockPeriods.map((period) => (
                <button
                  key={period.value}
                  onClick={() => setLiquidityLockPeriod(period.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    liquidityLockPeriod === period.value
                      ? 'bg-cyan-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>

          {liquidityLockPeriod > 0 && (
            <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <Clock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-amber-300 font-medium">Liquidity will be locked</p>
                <p className="text-xs text-amber-400/70 mt-1">
                  {liquidityLockPeriod === -1 
                    ? 'Liquidity will be permanently locked and cannot be withdrawn.'
                    : `You won't be able to remove liquidity for ${liquidityLockPeriod} days after creation.`
                  }
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-300">
                A portion of your token supply will be paired with {currency} to create the initial liquidity pool.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}