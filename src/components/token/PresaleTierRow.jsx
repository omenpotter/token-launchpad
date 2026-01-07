import React from 'react';
import { Trash2 } from 'lucide-react';

export default function PresaleTierRow({ 
  tier, 
  index, 
  currency,
  onUpdate, 
  onRemove, 
  canRemove 
}) {
  return (
    <div className="grid grid-cols-12 gap-3 items-center bg-slate-700/30 rounded-xl p-3 border border-slate-600/50">
      <div className="col-span-1">
        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
          <span className="text-blue-400 font-semibold text-sm">{index + 1}</span>
        </div>
      </div>
      
      <div className="col-span-4">
        <label className="block text-xs text-slate-400 mb-1">From Supply</label>
        <input
          type="number"
          value={tier.fromSupply}
          onChange={(e) => onUpdate(index, 'fromSupply', Number(e.target.value))}
          placeholder="0"
          className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
        />
      </div>
      
      <div className="col-span-4">
        <label className="block text-xs text-slate-400 mb-1">To Supply</label>
        <input
          type="number"
          value={tier.toSupply}
          onChange={(e) => onUpdate(index, 'toSupply', Number(e.target.value))}
          placeholder="10000"
          className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
        />
      </div>
      
      <div className="col-span-2">
        <label className="block text-xs text-slate-400 mb-1">Price ({currency})</label>
        <input
          type="number"
          step="0.0001"
          value={tier.price}
          onChange={(e) => onUpdate(index, 'price', Number(e.target.value))}
          placeholder="0.01"
          className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
        />
      </div>
      
      <div className="col-span-1 flex justify-end">
        {canRemove && (
          <button
            onClick={() => onRemove(index)}
            className="p-2 hover:bg-red-500/20 rounded-lg transition group"
          >
            <Trash2 className="w-4 h-4 text-slate-500 group-hover:text-red-400 transition" />
          </button>
        )}
      </div>
    </div>
  );
}