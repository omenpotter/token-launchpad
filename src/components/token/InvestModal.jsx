import React from 'react';
import { X, DollarSign, TrendingUp, AlertCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InvestModal({ 
  isOpen, 
  onClose, 
  presale, 
  investAmount, 
  setInvestAmount, 
  currency,
  onConfirm 
}) {
  if (!isOpen || !presale) return null;

  const calculateTokens = () => {
    let remainingInvestment = investAmount;
    let tokensReceived = 0;

    if (presale.pricingTiers) {
      for (const tier of presale.pricingTiers) {
        if (remainingInvestment <= 0) break;
        
        const tierCapacity = (tier.toSupply - tier.fromSupply) * tier.price;
        const amountForThisTier = Math.min(remainingInvestment, tierCapacity);
        const tokensFromTier = amountForThisTier / tier.price;
        
        tokensReceived += tokensFromTier;
        remainingInvestment -= amountForThisTier;
      }
    }

    return tokensReceived.toFixed(2);
  };

  const getAveragePrice = () => {
    const tokens = parseFloat(calculateTokens());
    if (tokens === 0) return 0;
    return (investAmount / tokens).toFixed(4);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl max-w-md w-full border border-slate-700 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-b border-slate-700/50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Invest in Presale</h3>
                  <p className="text-xs text-slate-400">{presale.tokenSymbol}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-700/50 rounded-lg transition"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5">
            {/* Investment Amount Input */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Investment Amount
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={investAmount}
                  onChange={(e) => setInvestAmount(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-4 pr-16 text-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                  {currency}
                </span>
              </div>
            </div>

            {/* Calculation Display */}
            {investAmount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-700/30 rounded-xl p-4 space-y-3"
              >
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">You will receive</span>
                  <span className="text-white font-semibold text-lg">
                    {calculateTokens()} {presale.tokenSymbol}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Average price</span>
                  <span className="text-slate-300 text-sm">
                    {getAveragePrice()} {currency} per token
                  </span>
                </div>
              </motion.div>
            )}

            {/* Presale Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-700/20 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-1">Soft Cap</p>
                <p className="text-white font-medium text-sm">{presale.softCap} {currency}</p>
              </div>
              <div className="bg-slate-700/20 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-1">Hard Cap</p>
                <p className="text-white font-medium text-sm">{presale.hardCap} {currency}</p>
              </div>
            </div>

            {/* Progress */}
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-2">
                <span>Raised</span>
                <span>{presale.raised.toFixed(2)} / {presale.hardCap} {currency}</span>
              </div>
              <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                  style={{ width: `${Math.min((presale.raised / presale.hardCap) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Warning */}
            {investAmount > 0 && investAmount + presale.raised > presale.hardCap && (
              <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-300">
                  Your investment exceeds the remaining hard cap. Only {(presale.hardCap - presale.raised).toFixed(2)} {currency} can be invested.
                </p>
              </div>
            )}

            {/* Info */}
            <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <TrendingUp className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-300">
                Your wallet will prompt you to approve this investment. Funds will be held in the presale contract until completion.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-4 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={!investAmount || investAmount <= 0 || investAmount + presale.raised > presale.hardCap}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2"
            >
              Confirm Investment
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}