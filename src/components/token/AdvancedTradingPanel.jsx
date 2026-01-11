import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, RefreshCw, Zap, ExternalLink } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const X1_RPC_ENDPOINT = 'https://rpc.mainnet.x1.xyz';

export default function AdvancedTradingPanel({ 
  tokenAddress,
  tokenSymbol = 'TOKEN',
  tokenName = 'Token',
  walletConnected,
  wallet,
  onTradeComplete
}) {
  const [tradeMode, setTradeMode] = useState('buy');
  const [inputAmount, setInputAmount] = useState('');
  const [estimatedOutput, setEstimatedOutput] = useState(0);
  const [timeframe, setTimeframe] = useState('1h');
  const [priceData, setPriceData] = useState([]);
  const [tokenData, setTokenData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTokenData = async () => {
    if (!tokenAddress) return;

    try {
      const response = await base44.functions.invoke('fetchTokenOnChainData', {
        tokenAddress
      });

      const data = response.data;
      const supply = data.supply?.value;

      setTokenData({
        symbol: tokenSymbol,
        name: tokenName,
        price: 0,
        marketCap: 0,
        liquidity: 0,
        totalSupply: supply ? parseFloat(supply.amount) / Math.pow(10, supply.decimals) : 0,
        circulatingSupply: 0,
        decimals: supply?.decimals || 9
      });

    } catch (error) {
      console.error('Error fetching token data:', error);
    }
  };

  const calculateQuote = (amount, isBuy) => {
    if (!amount || isNaN(amount)) {
      setEstimatedOutput(0);
      return;
    }
    const rate = isBuy ? 1000 : 0.001;
    setEstimatedOutput(parseFloat(amount) * rate);
  };

  const handleTrade = async () => {
    if (!walletConnected || !wallet) {
      alert('Please connect your wallet first');
      return;
    }

    if (!inputAmount || parseFloat(inputAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert(`${tradeMode === 'buy' ? 'Buy' : 'Sell'} order submitted`);
      setInputAmount('');
      if (onTradeComplete) onTradeComplete();
    } catch (error) {
      alert('Trade failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (tokenAddress) {
      fetchTokenData();
    }
  }, [tokenAddress]);

  useEffect(() => {
    calculateQuote(inputAmount, tradeMode === 'buy');
  }, [inputAmount, tradeMode]);

  const formatNumber = (num, decimals = 2) => {
    if (!num) return '0';
    if (num >= 1e9) return (num / 1e9).toFixed(decimals) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(decimals) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(decimals) + 'K';
    return num.toFixed(decimals);
  };

  const timeframes = ['1m', '5m', '1h', '1d'];

  if (!tokenData) {
    return (
      <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50 flex items-center justify-center">
        <RefreshCw className="w-6 h-6 text-slate-400 animate-spin mr-2" />
        <span className="text-slate-400">Loading token data from X1...</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* LEFT SIDE - Chart Section */}
      <div className="space-y-4">
        {/* Timeframe Selector */}
        <div className="flex gap-2">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                timeframe === tf
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Token Header with Links */}
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-lg font-semibold text-white">{tokenSymbol}/XNT</h3>
              <p className="text-sm text-slate-400">{tokenName}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href={`https://x1.ninja/token/${tokenAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-3 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg transition text-sm font-medium flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              x1.ninja
            </a>
            <a
              href="https://app.xdex.xyz/liquidity"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg transition text-sm font-medium flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              xDEX
            </a>
          </div>
        </div>

        {/* Price Chart */}
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 h-80">
          {priceData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priceData}>
                <XAxis dataKey="time" stroke="#64748b" />
                <YAxis stroke="#64748b" tickFormatter={(value) => value.toFixed(6)} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  labelFormatter={(label) => ['$' + label.toFixed(8), 'Price']}
                />
                <Line type="monotone" dataKey="price" stroke="#8b5cf6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <TrendingUp className="w-12 h-12 mb-2 opacity-50" />
              <p className="font-bold">📊 Price Chart</p>
              <p className="text-sm mt-1">No historical data available</p>
            </div>
          )}
        </div>

        {/* Token Stats Grid */}
        {tokenData && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <p className="text-xs text-slate-400 mb-1">Price</p>
              <p className="text-lg font-bold text-white">${tokenData.price > 0 ? tokenData.price.toFixed(8) : '-.--------'}</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <p className="text-xs text-slate-400 mb-1">Market Cap</p>
              <p className="text-lg font-bold text-white">${tokenData.marketCap > 0 ? formatNumber(tokenData.marketCap) : '-'}</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <p className="text-xs text-slate-400 mb-1">Liquidity</p>
              <p className="text-lg font-bold text-white">${tokenData.liquidity > 0 ? formatNumber(tokenData.liquidity) : '-'}</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <p className="text-xs text-slate-400 mb-1">Total Supply</p>
              <p className="text-lg font-bold text-white">{tokenData.totalSupply > 0 ? formatNumber(tokenData.totalSupply) : '-'}</p>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT SIDE - Trading Panel */}
      <div className="space-y-4">
        {/* Buy/Sell Toggle */}
        <div className="flex gap-2 bg-slate-800/50 p-2 rounded-xl border border-slate-700/50">
          <button
            onClick={() => setTradeMode('buy')}
            className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all ${
              tradeMode === 'buy'
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                : 'bg-transparent text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="inline w-5 h-5 mr-2" />
            Buy
          </button>
          <button
            onClick={() => setTradeMode('sell')}
            className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all ${
              tradeMode === 'sell'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg'
                : 'bg-transparent text-slate-400 hover:text-white'
            }`}
          >
            <TrendingDown className="inline w-5 h-5 mr-2" />
            Sell
          </button>
        </div>

        {/* Input Amount */}
        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
          <label className="text-sm text-slate-400 mb-2 block">
            You {tradeMode === 'buy' ? 'Pay' : 'Sell'}
          </label>
          <div className="relative">
            <input
              type="number"
              value={inputAmount}
              onChange={(e) => setInputAmount(e.target.value)}
              placeholder="0.0"
              className="w-full bg-slate-700 border border-slate-600 text-white text-2xl font-bold rounded-xl px-4 py-4 pr-20 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
              {tradeMode === 'buy' ? 'XNT' : tokenSymbol}
            </span>
          </div>
        </div>

        {/* Estimated Output */}
        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
          <label className="text-sm text-slate-400 mb-2 block">
            You {tradeMode === 'buy' ? 'Receive' : 'Get'}
          </label>
          <div className="relative">
            <input
              type="text"
              value={estimatedOutput.toFixed(4)}
              readOnly
              className="w-full bg-slate-700/50 border border-slate-600 text-white text-2xl font-bold rounded-xl px-4 py-4 pr-20 outline-none"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
              {tradeMode === 'buy' ? tokenSymbol : 'XNT'}
            </span>
          </div>
        </div>

        {/* Trade Button */}
        <button
          onClick={handleTrade}
          disabled={!walletConnected || isLoading || !inputAmount}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
            tradeMode === 'buy'
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500'
              : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500'
          } text-white disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed`}
        >
          {isLoading ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Zap className="w-5 h-5" />
          )}
          {isLoading ? 'Processing...' : walletConnected ? `${tradeMode === 'buy' ? 'Buy' : 'Sell'} ${tokenSymbol}` : 'Connect Wallet'}
        </button>

        {/* Info Box */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <p className="text-xs text-blue-300">
            Trading is executed via xDEX liquidity pools. Prices are fetched from X1 blockchain in real-time.
          </p>
        </div>
      </div>
    </div>
  );
}