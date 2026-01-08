import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WalletConnectModal({ isOpen, onClose, onConnectBackpack, onConnectPhantom }) {
  if (!isOpen) return null;

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
          className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl max-w-sm w-full border border-slate-700 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Connect Wallet</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-3">
            <button
              onClick={onConnectBackpack}
              className="w-full bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-xl p-4 flex items-center gap-4 transition group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-2xl">
                🦊
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-white group-hover:text-blue-300 transition">MetaMask / Web3</p>
                <p className="text-sm text-slate-400">Connect to X1 Network</p>
              </div>
              <ExternalLink className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition" />
            </button>

            <button
              onClick={onConnectPhantom}
              className="w-full bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-xl p-4 flex items-center gap-4 transition group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl">
                💼
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-white group-hover:text-blue-300 transition">Other Web3 Wallets</p>
                <p className="text-sm text-slate-400">Any Ethereum-compatible wallet</p>
              </div>
              <ExternalLink className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition" />
            </button>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6">
            <p className="text-xs text-slate-500 text-center">
              By connecting a wallet, you agree to our Terms of Service
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}