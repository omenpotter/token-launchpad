import React, { useState } from 'react';
import { Droplets, Plus, Minus, AlertTriangle, Info, TrendingUp } from 'lucide-react';

export default function LiquidityManagement({ token, currency, onAddLiquidity, onRemoveLiquidity }) {
  const [activeTab, setActiveTab] = useState('add');
  const [tokenAmount, setTokenAmount] = useState(0);
  const [currencyAmount, setCurrencyAmount] = useState(0);
  const [removePercentage, setRemovePercentage] = useState(50);

  // Mock data
  const poolData = {
    tokenReserve: 50000,
    currencyReserve: 5,
    totalShares: 100,
    userShares: 10,
    userSharePercentage: 10
  };

  const calculatePoolShare = () => {
    if (!tokenAmount || !currencyAmount) return 0;
    return ((tokenAmount / (poolData.tokenReserve + tokenAmount)) * 100).toFixed(2);
  };

  const handleAddLiquidity = () => {
    if (!tokenAmount || !currencyAmount) {
      alert('Please enter amounts');
      return;
    }
    onAddLiquidity(tokenAmount, currencyAmount);
    setTokenAmount(0);
    setCurrencyAmount(0);
  };

  const handleRemoveLiquidity = () => {
    if (!removePercentage) {
      alert('Please select percentage to remove');
      return;
    }
    onRemoveLiquidity(removePercentage);
    setRemovePercentage(50);
  };

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

        {/* Pool Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-700/30 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1">Your Liquidity</p>
            <p className="text-white font-semibold">${(poolData.userSharePercentage * poolData.currencyReserve / 100).toFixed(2)}</p>
          </div>
          <div className="bg-slate-700/30 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1">Pool Share</p>
            <p className="text-white font-semibold">{poolData.userSharePercentage}%</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700/50">
        <button
          onClick={() => setActiveTab('add')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition ${
            activeTab === 'add'
              ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/5'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <Plus className="w-4 h-4 inline mr-2" />
          Add Liquidity
        </button>
        <button
          onClick={() => setActiveTab('remove')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition ${
            activeTab === 'remove'
              ? 'text-red-400 border-b-2 border-red-400 bg-red-500/5'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <Minus className="w-4 h-4 inline mr-2" />
          Remove Liquidity
        </button>
      </div>

      <div className="p-5">
        {activeTab === 'add' ? (
          <div className="space-y-4">
            {/* Token Amount */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">{token.symbol} Amount</label>
              <input
                type="number"
                step="1"
                value={tokenAmount}
                onChange={(e) => setTokenAmount(Number(e.target.value))}
                placeholder="0"
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition"
              />
            </div>

            {/* Currency Amount */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">{currency} Amount</label>
              <input
                type="number"
                step="0.01"
                value={currencyAmount}
                onChange={(e) => setCurrencyAmount(Number(e.target.value))}
                placeholder="0"
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition"
              />
            </div>

            {/* Pool Share Info */}
            {tokenAmount > 0 && currencyAmount > 0 && (
              <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-medium text-cyan-300">New Pool Share</span>
                </div>
                <p className="text-2xl font-bold text-white mb-1">{calculatePoolShare()}%</p>
                <p className="text-xs text-cyan-400">You will own {calculatePoolShare()}% of the pool</p>
              </div>
            )}

            <button
              onClick={handleAddLiquidity}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Liquidity
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Percentage Slider */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">Remove Percentage</label>
                <span className="text-white font-bold">{removePercentage}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={removePercentage}
                onChange={(e) => setRemovePercentage(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
              <div className="flex justify-between mt-2">
                {[25, 50, 75, 100].map(val => (
                  <button
                    key={val}
                    onClick={() => setRemovePercentage(val)}
                    className={`px-3 py-1 text-xs rounded-lg transition ${
                      removePercentage === val
                        ? 'bg-red-500 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {val}%
                  </button>
                ))}
              </div>
            </div>

            {/* Estimated Amounts */}
            <div className="bg-slate-700/30 rounded-xl p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">You will receive:</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white">{((poolData.tokenReserve * poolData.userSharePercentage / 100) * (removePercentage / 100)).toFixed(0)} {token.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white">{((poolData.currencyReserve * poolData.userSharePercentage / 100) * (removePercentage / 100)).toFixed(4)} {currency}</span>
              </div>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-300">
                Removing liquidity will reduce your pool share and you'll stop earning fees on that portion.
              </p>
            </div>

            <button
              onClick={handleRemoveLiquidity}
              className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
            >
              <Minus className="w-5 h-5" />
              Remove Liquidity
            </button>
          </div>
        )}
      </div>
    </div>
  );
}