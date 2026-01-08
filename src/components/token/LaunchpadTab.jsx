import React, { useState } from 'react';
import { Rocket, Plus, Calendar, DollarSign, Users, TrendingUp, AlertCircle, Target, Layers } from 'lucide-react';
import PresaleTierRow from './PresaleTierRow';
import LiquidityPoolSection from './LiquidityPoolSection';

const DEFAULT_TIERS = [
  { fromSupply: 0, toSupply: 10000, price: 0.1 },
  { fromSupply: 10000, toSupply: 25000, price: 0.15 },
  { fromSupply: 25000, toSupply: 50000, price: 0.2 },
  { fromSupply: 50000, toSupply: 75000, price: 0.25 },
  { fromSupply: 75000, toSupply: 100000, price: 0.3 }
];

export default function LaunchpadTab({
  createdTokens,
  presales,
  walletConnected,
  presaleFee,
  currency,
  onCreatePresale,
  onViewPresale,
  selectedTokenForPresale,
  setSelectedTokenForPresale
}) {
  const [presaleName, setPresaleName] = useState('');
  const [presaleDescription, setPresaleDescription] = useState('');
  const [softCap, setSoftCap] = useState(10);
  const [hardCap, setHardCap] = useState(100);
  const [presaleStart, setPresaleStart] = useState('');
  const [presaleEnd, setPresaleEnd] = useState('');
  const [presaleTokens, setPresaleTokens] = useState(100000);
  const [minContribution, setMinContribution] = useState(0.1);
  const [maxContribution, setMaxContribution] = useState(10);
  
  // Presale Tiers
  const [pricingTiers, setPricingTiers] = useState(DEFAULT_TIERS);
  
  // Liquidity Pool
  const [createLiquidity, setCreateLiquidity] = useState(false);
  const [liquidityAmount, setLiquidityAmount] = useState(10);
  const [liquidityLockPeriod, setLiquidityLockPeriod] = useState(180);
  const [pairToken, setPairToken] = useState('native');

  const selectedToken = createdTokens.find(t => t.id === parseInt(selectedTokenForPresale));

  const updateTier = (index, field, value) => {
    const newTiers = [...pricingTiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setPricingTiers(newTiers);
  };

  const addTier = () => {
    const lastTier = pricingTiers[pricingTiers.length - 1];
    setPricingTiers([
      ...pricingTiers,
      {
        fromSupply: lastTier.toSupply,
        toSupply: lastTier.toSupply + 25000,
        price: lastTier.price * 1.5
      }
    ]);
  };

  const removeTier = (index) => {
    if (pricingTiers.length > 1) {
      setPricingTiers(pricingTiers.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = () => {
    if (!selectedTokenForPresale || !presaleName || !presaleStart || !presaleEnd) {
      alert('Please fill in all required fields');
      return;
    }
    if (softCap >= hardCap) {
      alert('Hard cap must be greater than soft cap');
      return;
    }

    onCreatePresale({
      tokenId: selectedTokenForPresale,
      name: presaleName,
      description: presaleDescription,
      softCap,
      hardCap,
      startDate: presaleStart,
      endDate: presaleEnd,
      totalTokens: presaleTokens,
      minContribution,
      maxContribution,
      pricingTiers,
      liquidity: createLiquidity ? {
        amount: liquidityAmount,
        lockPeriod: liquidityLockPeriod,
        pairToken
      } : null
    });
  };

  return (
    <div className="space-y-6">
      {/* Active Presales */}
      {presales.length > 0 && (
        <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Active Presales</h3>
              <p className="text-xs text-slate-400">{presales.length} presale(s) created</p>
            </div>
          </div>

          <div className="space-y-3">
            {presales.map(presale => (
              <div key={presale.id} className="p-4 bg-slate-700/30 rounded-xl border border-slate-600/50 hover:border-slate-500/50 transition cursor-pointer" onClick={() => onViewPresale(presale)}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-white font-medium">{presale.presaleName}</h4>
                    <p className="text-sm text-slate-400">{presale.tokenSymbol}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    presale.status === 'active' ? 'bg-green-500/20 text-green-400' :
                    presale.status === 'completed' ? 'bg-purple-500/20 text-purple-400' :
                    presale.status === 'upcoming' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>
                    {presale.status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400">Raised</p>
                    <p className="text-white font-medium">{presale.raised.toFixed(2)} {presale.currency}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Hard Cap</p>
                    <p className="text-white font-medium">{presale.hardCap} {presale.currency}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Investors</p>
                    <p className="text-white font-medium">{presale.investors}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Presale */}
      {createdTokens.length === 0 ? (
        <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
            <Rocket className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No Tokens Available</h3>
          <p className="text-slate-400">Create a token first to launch a presale</p>
        </div>
      ) : (
        <>
          {/* Token Selection */}
          <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Rocket className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Create Presale</h3>
                <p className="text-xs text-slate-400">Launch a token presale with custom pricing tiers</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Select Token *</label>
                <select
                  value={selectedTokenForPresale}
                  onChange={(e) => setSelectedTokenForPresale(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition"
                >
                  <option value="">Choose a token...</option>
                  {createdTokens.map(token => (
                    <option key={token.id} value={token.id}>
                      {token.name} ({token.symbol})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Presale Name *</label>
                <input
                  type="text"
                  value={presaleName}
                  onChange={(e) => setPresaleName(e.target.value)}
                  placeholder="Token Launch Round 1"
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
              <textarea
                value={presaleDescription}
                onChange={(e) => setPresaleDescription(e.target.value)}
                placeholder="Describe your presale..."
                rows={3}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition resize-none"
              />
            </div>
          </div>

          {/* Caps & Dates */}
          <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Caps & Schedule</h3>
                <p className="text-xs text-slate-400">Set funding goals and timeline</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Soft Cap ({currency})</label>
                <input
                  type="number"
                  value={softCap}
                  onChange={(e) => setSoftCap(Number(e.target.value))}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Hard Cap ({currency})</label>
                <input
                  type="number"
                  value={hardCap}
                  onChange={(e) => setHardCap(Number(e.target.value))}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Start Date *</label>
                <input
                  type="datetime-local"
                  value={presaleStart}
                  onChange={(e) => setPresaleStart(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">End Date *</label>
                <input
                  type="datetime-local"
                  value={presaleEnd}
                  onChange={(e) => setPresaleEnd(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Total Tokens for Sale</label>
                <input
                  type="number"
                  value={presaleTokens}
                  onChange={(e) => setPresaleTokens(Number(e.target.value))}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Min Contribution ({currency})</label>
                <input
                  type="number"
                  step="0.01"
                  value={minContribution}
                  onChange={(e) => setMinContribution(Number(e.target.value))}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Max Contribution ({currency})</label>
                <input
                  type="number"
                  step="0.1"
                  value={maxContribution}
                  onChange={(e) => setMaxContribution(Number(e.target.value))}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Pricing Tiers */}
          <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Pricing Tiers</h3>
                  <p className="text-xs text-slate-400">Define supply ranges and prices (min 5 tiers)</p>
                </div>
              </div>
              <button
                onClick={addTier}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-xl transition text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Tier
              </button>
            </div>

            <div className="space-y-3">
              {pricingTiers.map((tier, index) => (
                <PresaleTierRow
                  key={index}
                  tier={tier}
                  index={index}
                  currency={currency}
                  onUpdate={updateTier}
                  onRemove={removeTier}
                  canRemove={pricingTiers.length > 5}
                />
              ))}
            </div>

            {pricingTiers.length < 5 && (
              <div className="mt-4 flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-300">
                  Please add at least {5 - pricingTiers.length} more tier(s). Minimum 5 tiers required.
                </p>
              </div>
            )}
          </div>

          {/* Liquidity Pool */}
          <LiquidityPoolSection
            createLiquidity={createLiquidity}
            setCreateLiquidity={setCreateLiquidity}
            liquidityAmount={liquidityAmount}
            setLiquidityAmount={setLiquidityAmount}
            liquidityLockPeriod={liquidityLockPeriod}
            setLiquidityLockPeriod={setLiquidityLockPeriod}
            pairToken={pairToken}
            setPairToken={setPairToken}
            currency={currency}
          />

          {/* Create Button */}
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl p-5 border border-purple-500/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-purple-400" />
                <span className="text-slate-300 text-sm">Presale Creation Fee:</span>
              </div>
              <span className="text-xl font-bold text-white">{presaleFee} {currency}</span>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!walletConnected || !selectedTokenForPresale || !presaleName || pricingTiers.length < 5}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition flex items-center justify-center gap-2"
            >
              <Rocket className="w-5 h-5" />
              {walletConnected ? 'Create Presale' : 'Connect Wallet First'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}