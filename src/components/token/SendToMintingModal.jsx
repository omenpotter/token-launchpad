import React, { useState } from 'react';
import { X, Send, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SendToMintingModal({ isOpen, onClose, token, onConfirm }) {
  const [enableFairMint, setEnableFairMint] = useState(false);
  const [maxPerWallet, setMaxPerWallet] = useState(1000);

  if (!isOpen || !token) return null;

  const handleConfirm = () => {
    onConfirm({
      enableFairMint,
      maxPerWallet: enableFairMint ? maxPerWallet : 0
    });
    onClose();
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
          onClick={(e) => e.stopPropagation()}
          className="bg-slate-800 rounded-2xl max-w-md w-full border border-slate-700 shadow-2xl"
        >
          <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Send to Minting Page</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-700/50 rounded-lg transition">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-slate-700/30 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                  {token.symbol.charAt(0)}
                </div>
                <div>
                  <h4 className="text-white font-semibold">{token.name}</h4>
                  <p className="text-slate-400 text-sm">{token.symbol}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-700/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-slate-400" />
                  <span className="text-white font-medium">Enable Fair Mint</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableFairMint}
                    onChange={(e) => setEnableFairMint(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                </label>
              </div>
              <p className="text-xs text-slate-400">Limit tokens per wallet during public minting</p>
            </div>

            {enableFairMint && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-slate-700/30 rounded-xl p-4"
              >
                <label className="block text-sm text-slate-300 mb-2">Max Per Wallet</label>
                <input
                  type="number"
                  value={maxPerWallet}
                  onChange={(e) => setMaxPerWallet(Number(e.target.value))}
                  min={1}
                  className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-4 py-3"
                />
              </motion.div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl transition font-medium flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}