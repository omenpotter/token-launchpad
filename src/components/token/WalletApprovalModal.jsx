import React from 'react';
import { Wallet, AlertCircle, Loader2, X, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WalletApprovalModal({ 
  isOpen, 
  onClose, 
  onApprove, 
  isLoading, 
  approvalData 
}) {
  if (!isOpen || !approvalData) return null;

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
          <div className="bg-slate-800/50 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">{approvalData.title}</h3>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition disabled:opacity-50"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5">
            {/* Fee Amount */}
            <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50">
              <p className="text-slate-400 text-sm mb-1">Transaction Fee</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">{approvalData.amount}</span>
                <span className="text-lg font-medium text-blue-400">{approvalData.currency}</span>
              </div>
            </div>

            {/* Transaction Details */}
            {approvalData.details && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-400 uppercase tracking-wide">Transaction Details</p>
                <div className="bg-slate-700/20 rounded-xl border border-slate-700/50 divide-y divide-slate-700/50">
                  {approvalData.details.tokenName && (
                    <div className="flex justify-between items-center px-4 py-3">
                      <span className="text-slate-400 text-sm">Token Name</span>
                      <span className="text-white font-medium">{approvalData.details.tokenName}</span>
                    </div>
                  )}
                  {approvalData.details.tokenSymbol && (
                    <div className="flex justify-between items-center px-4 py-3">
                      <span className="text-slate-400 text-sm">Symbol</span>
                      <span className="text-white font-medium">{approvalData.details.tokenSymbol}</span>
                    </div>
                  )}
                  {approvalData.details.supply && (
                    <div className="flex justify-between items-center px-4 py-3">
                      <span className="text-slate-400 text-sm">Supply</span>
                      <span className="text-white font-medium">{approvalData.details.supply.toLocaleString()}</span>
                    </div>
                  )}
                  {approvalData.details.mintAmount && (
                    <div className="flex justify-between items-center px-4 py-3">
                      <span className="text-slate-400 text-sm">Mint Amount</span>
                      <span className="text-white font-medium">{approvalData.details.mintAmount.toLocaleString()}</span>
                    </div>
                  )}
                  {approvalData.details.action && (
                    <div className="flex justify-between items-center px-4 py-3">
                      <span className="text-slate-400 text-sm">Action</span>
                      <span className="text-white font-medium">{approvalData.details.action}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Info Banner */}
            <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-300">
                Your wallet will prompt you to confirm this transaction. The fee will be deducted from your wallet balance.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-4 rounded-xl transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onApprove}
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-3 px-4 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Approve & Pay
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}