import React from 'react';
import { X, Calendar, DollarSign, Users, Target, TrendingUp, Layers, Clock, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PresaleDetailModal({ presale, onClose, onInvest, walletConnected }) {
  if (!presale) return null;

  const progressPercentage = (presale.raised / presale.hardCap) * 100;
  const softCapPercentage = (presale.softCap / presale.hardCap) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl max-w-3xl w-full border border-slate-700 shadow-2xl overflow-hidden my-8"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-b border-slate-700/50 p-6">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-slate-700/50 rounded-lg transition"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
            
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-2xl">
                {presale.tokenSymbol.charAt(0)}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-1">{presale.presaleName}</h2>
                <p className="text-slate-300">{presale.tokenSymbol}</p>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                  presale.status === 'active' ? 'bg-green-500/20 text-green-400' :
                  presale.status === 'completed' ? 'bg-purple-500/20 text-purple-400' :
                  presale.status === 'upcoming' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-slate-500/20 text-slate-400'
                }`}>
                  {presale.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Description */}
            {presale.presaleDescription && (
              <div>
                <p className="text-slate-300 text-sm leading-relaxed">{presale.presaleDescription}</p>
              </div>
            )}

            {/* Progress Bar */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-400">Progress</span>
                <span className="text-sm font-semibold text-white">
                  {presale.raised.toFixed(2)} / {presale.hardCap} {presale.currency}
                </span>
              </div>
              <div className="relative h-3 bg-slate-700/50 rounded-full overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                />
                {softCapPercentage < 100 && (
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-amber-400"
                    style={{ left: `${softCapPercentage}%` }}
                  >
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-amber-400 whitespace-nowrap">
                      Soft Cap
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-slate-500">{progressPercentage.toFixed(1)}%</span>
                <span className="text-xs text-slate-500">{presale.investors} investors</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-700/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-blue-400" />
                  <p className="text-xs text-slate-400">Soft Cap</p>
                </div>
                <p className="text-white font-semibold">{presale.softCap} {presale.currency}</p>
              </div>
              <div className="bg-slate-700/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <p className="text-xs text-slate-400">Hard Cap</p>
                </div>
                <p className="text-white font-semibold">{presale.hardCap} {presale.currency}</p>
              </div>
              <div className="bg-slate-700/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  <p className="text-xs text-slate-400">Investors</p>
                </div>
                <p className="text-white font-semibold">{presale.investors}</p>
              </div>
              <div className="bg-slate-700/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-amber-400" />
                  <p className="text-xs text-slate-400">Raised</p>
                </div>
                <p className="text-white font-semibold">{presale.raised.toFixed(2)} {presale.currency}</p>
              </div>
            </div>

            {/* Pricing Tiers */}
            {presale.pricingTiers && presale.pricingTiers.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-semibold text-white">Pricing Tiers</h3>
                </div>
                <div className="space-y-2">
                  {presale.pricingTiers.map((tier, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                          <span className="text-amber-400 font-semibold text-sm">{index + 1}</span>
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">
                            {tier.fromSupply.toLocaleString()} - {tier.toSupply.toLocaleString()} tokens
                          </p>
                          <p className="text-xs text-slate-400">
                            {(tier.toSupply - tier.fromSupply).toLocaleString()} tokens available
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-semibold">{tier.price} {presale.currency}</p>
                        <p className="text-xs text-slate-400">per token</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Liquidity Info */}
            {presale.liquidity && (
              <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                  <h4 className="text-white font-semibold">Liquidity Pool</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Initial Liquidity</p>
                    <p className="text-white font-medium">{presale.liquidity.amount} {presale.currency}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Lock Period</p>
                    <p className="text-white font-medium">
                      {presale.liquidity.lockPeriod === -1 ? 'Forever' :
                       presale.liquidity.lockPeriod === 0 ? 'No Lock' :
                       `${presale.liquidity.lockPeriod} days`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Invest Button */}
            <button
              onClick={() => onInvest(presale)}
              disabled={!walletConnected || presale.status === 'completed'}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition flex items-center justify-center gap-2"
            >
              {!walletConnected ? (
                'Connect Wallet to Invest'
              ) : presale.status === 'completed' ? (
                'Presale Completed'
              ) : presale.status === 'upcoming' ? (
                'Upcoming - Cannot Invest Yet'
              ) : (
                <>
                  Invest in Presale
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}