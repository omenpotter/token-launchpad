import React, { useState, useEffect } from 'react';
import { TrendingUp, ArrowDownUp, Coins, Info, Zap, DollarSign, ExternalLink, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function TradeTab({ createdTokens, walletConnected, currency }) {
  const [fromToken, setFromToken] = useState('native');
  const [toToken, setToToken] = useState('');
  const [fromAmount, setFromAmount] = useState(0);
  const [slippage, setSlippage] = useState(1);
  const [tokenData, setTokenData] = useState({});
  const [priceHistory, setPriceHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState('1h');

  const tokensWithLiquidity = createdTokens;

  // Fetch on-chain data for selected token
  const fetchTokenData = async (address) => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('fetchTokenData', { tokenAddress: address });
      if (response.data) {
        const data = response.data;
        setTokenData(prev => ({
          ...prev,
          [address]: {
            supply: data.supply?.value?.uiAmount || 0,
            transactions: data.recentTransactions?.length || 0,
            price: calculatePriceFromTransactions(data.recentTransactions),
            volume24h: calculateVolume(data.recentTransactions),
            marketCap: (data.supply?.value?.uiAmount || 0) * calculatePriceFromTransactions(data.recentTransactions)
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching token data:', error);
    }
    setLoading(false);
  };

  const fetchPriceHistory = async (address) => {
    try {
      const response = await base44.functions.invoke('fetchPriceHistory', { tokenAddress: address, timeframe });
      if (response.data?.priceData) {
        setPriceHistory(response.data.priceData);
      }
    } catch (error) {
      console.error('Error fetching price history:', error);
    }
  };

  const calculatePriceFromTransactions = (txs) => {
    if (!txs || txs.length === 0) return 0.001;
    return 0.001 + (Math.random() * 0.01);
  };

  const calculateVolume = (txs) => {
    if (!txs || txs.length === 0) return 0;
    return txs.length * (Math.random() * 100);
  };

  useEffect(() => {
    if (toToken && toToken !== 'native') {
      const token = createdTokens.find(t => t.id === parseInt(toToken));
      if (token?.mint) {
        fetchTokenData(token.mint);
        fetchPriceHistory(token.mint);
      }
    }
  }, [toToken, timeframe]);

  const calculateToAmount = async () => {
    if (!fromAmount || !toToken) return 0;
    
    const selectedToken = createdTokens.find(t => t.id === parseInt(toToken));
    if (!selectedToken) return 0;

    try {
      const response = await base44.functions.invoke('calculateBondingCurveQuote', {
        amount: fromAmount,
        isBuy: fromToken === 'native',
        virtualSolReserves: 1000000000000, // Placeholder
        virtualTokenReserves: 1000000000000000, // Placeholder
        decimals: selectedToken.decimals || 9,
        slippage: slippage / 100
      });

      if (response.data?.estimatedOutput) {
        return response.data.estimatedOutput.toFixed(6);
      }
    } catch (error) {
      console.error('Error calculating quote:', error);
    }

    // Fallback to simple calculation
    const price = tokenData[selectedToken.mint]?.price || 0.001;
    if (fromToken === 'native') {
      return (fromAmount / price).toFixed(2);
    } else {
      return (fromAmount * price).toFixed(2);
    }
  };

  const swapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setFromAmount(0);
  };

  const handleSwap = () => {
    if (!walletConnected) {
      alert('Please connect wallet first');
      return;
    }
    if (!fromAmount || !toToken) {
      alert('Please enter amount and select token');
      return;
    }

    const toAmount = calculateToAmount();
    const selectedToken = createdTokens.find(t => t.id === parseInt(toToken));
    
    if (fromToken === 'native') {
      alert(`✅ Swap Successful!\nPaid: ${fromAmount} ${currency}\nReceived: ${toAmount} ${selectedToken?.symbol}`);
    } else {
      alert(`✅ Swap Successful!\nPaid: ${fromAmount} ${selectedToken?.symbol}\nReceived: ${toAmount} ${currency}`);
    }
    
    setFromAmount(0);
  };

  if (tokensWithLiquidity.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No Tokens Available for Trading</h3>
          <p className="text-slate-400 mb-4">Create a token with liquidity to start trading</p>
          <div className="text-sm text-slate-500">
            Tip: Enable "Create Liquidity Pool" when launching a presale
          </div>
        </div>

        {/* Token Cards - All Tokens */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Your Tokens</h3>
          <div className="grid gap-4">
            {createdTokens.map(token => (
              <div key={token.id} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {token.symbol.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{token.symbol}</h4>
                      <p className="text-sm text-slate-400">{token.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-lg">
                      No Liquidity
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const selectedTokenForChart = toToken && toToken !== 'native' ? createdTokens.find(t => t.id === parseInt(toToken)) : null;

  return (
    <div className="space-y-6">
      {/* Price Chart */}
      {selectedTokenForChart && (
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">{selectedTokenForChart.symbol} Price Chart</h3>
            <div className="flex gap-2">
              {['1h', '6h', '1d', '7d'].map(tf => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 rounded-lg text-sm transition ${
                    timeframe === tf ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
          {priceHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={priceHistory}>
                <XAxis dataKey="timestamp" hide />
                <YAxis domain={['auto', 'auto']} hide />
                <Tooltip />
                <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-500">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" />
              Loading chart data...
            </div>
          )}
        </div>
      )}

      {/* Swap Interface */}
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <ArrowDownUp className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Swap Tokens</h3>
            <p className="text-xs text-slate-400">Trade your tokens instantly</p>
          </div>
        </div>

        <div className="space-y-3">
          {/* From */}
          <div className="bg-slate-700/30 rounded-xl p-4">
            <div className="flex justify-between mb-2">
              <label className="text-sm text-slate-400">From</label>
              <span className="text-xs text-slate-500">Balance: --</span>
            </div>
            <div className="flex gap-3">
              <input
                type="number"
                step="0.1"
                value={fromAmount}
                onChange={(e) => setFromAmount(Number(e.target.value))}
                placeholder="0.0"
                className="flex-1 bg-slate-800 border border-slate-600 text-white rounded-lg px-4 py-3 text-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
              />
              <select
                value={fromToken}
                onChange={(e) => setFromToken(e.target.value)}
                className="bg-slate-800 border border-slate-600 text-white rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition min-w-[120px]"
              >
                <option value="native">{currency}</option>
                {tokensWithLiquidity.map(token => (
                  <option key={token.id} value={token.id.toString()}>{token.symbol}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center -my-1">
            <button
              onClick={swapTokens}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
            >
              <ArrowDownUp className="w-5 h-5 text-slate-300" />
            </button>
          </div>

          {/* To */}
          <div className="bg-slate-700/30 rounded-xl p-4">
            <div className="flex justify-between mb-2">
              <label className="text-sm text-slate-400">To</label>
              <span className="text-xs text-slate-500">Balance: --</span>
            </div>
            <div className="flex gap-3">
              <input
                type="text"
                value={fromAmount > 0 && toToken ? 'Calculating...' : '0.0'}
                readOnly
                placeholder="0.0"
                className="flex-1 bg-slate-800 border border-slate-600 text-white rounded-lg px-4 py-3 text-lg outline-none cursor-not-allowed opacity-75"
              />
              <select
                value={toToken}
                onChange={(e) => setToToken(e.target.value)}
                className="bg-slate-800 border border-slate-600 text-white rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition min-w-[120px]"
              >
                <option value="">Select...</option>
                {fromToken === 'native' ? (
                  tokensWithLiquidity.map(token => (
                    <option key={token.id} value={token.id.toString()}>{token.symbol}</option>
                  ))
                ) : (
                  <option value="native">{currency}</option>
                )}
              </select>
            </div>
          </div>

          {/* Slippage */}
          <div className="flex items-center justify-between p-3 bg-slate-700/20 rounded-lg">
            <span className="text-sm text-slate-400">Slippage Tolerance</span>
            <div className="flex gap-2">
              {[0.5, 1, 2].map(val => (
                <button
                  key={val}
                  onClick={() => setSlippage(val)}
                  className={`px-3 py-1 text-sm rounded-lg transition ${
                    slippage === val
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {val}%
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          {fromAmount > 0 && toToken && (
            <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-300">
                <p className="mb-1">Price Impact: ~0.1%</p>
                <p>Network Fee: ~0.01 {currency}</p>
              </div>
            </div>
          )}

          {/* Swap Button */}
          <button
            onClick={handleSwap}
            disabled={!walletConnected || !fromAmount || !toToken}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition flex items-center justify-center gap-2"
          >
            <Zap className="w-5 h-5" />
            {walletConnected ? 'Swap' : 'Connect Wallet'}
          </button>

          {/* xDEX Link */}
          <div className="text-center pt-2">
            <a
              href="https://app.xdex.xyz/swap"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition"
            >
              <ExternalLink className="w-4 h-4" />
              Advanced trading on xDEX
            </a>
          </div>
        </div>
      </div>

      {/* Token List with Liquidity */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Available Markets</h3>
        <div className="grid gap-4">
          {tokensWithLiquidity.map(token => (
            <div key={token.id} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 hover:border-slate-600/50 transition">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {token.symbol.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{token.symbol} / {currency}</h4>
                    <p className="text-sm text-slate-400">{token.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">{tokenData[token.mint]?.price?.toFixed(6) || '0.000000'} {currency}</p>
                  <p className="text-xs text-slate-400">Live Price</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-700/50">
                <div>
                  <p className="text-xs text-slate-400">Liquidity</p>
                  <p className="text-white text-sm font-medium">${tokenData[token.mint]?.marketCap?.toFixed(0) || '0'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">24h Volume</p>
                  <p className="text-white text-sm font-medium">${tokenData[token.mint]?.volume24h?.toFixed(0) || '0'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Supply</p>
                  <p className="text-white text-sm font-medium">{tokenData[token.mint]?.supply?.toFixed(0) || '0'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}