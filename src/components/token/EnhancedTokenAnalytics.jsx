import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, DollarSign, Activity, Flame, RefreshCw, AlertCircle } from 'lucide-react';

export default function EnhancedTokenAnalytics({ token }) {
  const [priceData, setPriceData] = useState([]);
  const [holderData, setHolderData] = useState(null);
  const [onChainData, setOnChainData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('1d');
  const [x1NinjaAnalytics, setX1NinjaAnalytics] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [token.mint, timeframe]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch X1 Ninja analytics
      const ninjaRes = await base44.functions.invoke('fetchX1NinjaAnalytics', {
        tokenAddress: token.mint
      });
      
      if (ninjaRes.data.success) {
        setX1NinjaAnalytics(ninjaRes.data.analytics);
      }

      // Fetch price history
      const priceRes = await base44.functions.invoke('fetchPriceHistory', {
        tokenAddress: token.mint,
        timeframe
      });

      // Fetch holder distribution
      const holderRes = await base44.functions.invoke('fetchHolderDistribution', {
        tokenAddress: token.mint
      });

      // Fetch on-chain data
      const onChainRes = await base44.functions.invoke('fetchTokenData', {
        tokenAddress: token.mint
      });

      setPriceData(priceRes.data.priceData || []);
      setHolderData(holderRes.data);
      setOnChainData(onChainRes.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
        <span className="ml-2 text-slate-300">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-red-300 font-medium">Failed to load analytics</p>
          <p className="text-red-200 text-sm mt-1">{error}</p>
          <button onClick={fetchAnalytics} className="text-sm text-red-400 hover:text-red-300 underline mt-2">
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Use X1 Ninja analytics if available, otherwise fallback to price data
  const currentPrice = x1NinjaAnalytics?.price || (priceData.length > 0 ? priceData[priceData.length - 1].price : 0);
  const priceChange = x1NinjaAnalytics?.priceChange24h || (priceData.length > 1 
    ? ((priceData[priceData.length - 1].price - priceData[0].price) / priceData[0].price) * 100 
    : 0);

  const totalVolume = x1NinjaAnalytics?.volume24h || priceData.reduce((sum, d) => sum + (d.volume || 0), 0);
  const marketCap = x1NinjaAnalytics?.marketCap || (currentPrice * token.supply);
  const burnRate = token.burned ? (token.burned / token.initialSupply) * 100 : 0;
  const holders = x1NinjaAnalytics?.holders || holderData?.totalHolders || 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-700/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-green-400" />
            <span className="text-xs text-slate-400">Current Price</span>
          </div>
          <p className="text-lg font-bold text-white">${currentPrice.toFixed(6)}</p>
          <p className={`text-xs mt-1 ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
          </p>
        </div>

        <div className="bg-slate-700/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-slate-400">24h Volume</span>
          </div>
          <p className="text-lg font-bold text-white">${totalVolume.toFixed(2)}</p>
        </div>

        <div className="bg-slate-700/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-slate-400">Market Cap</span>
          </div>
          <p className="text-lg font-bold text-white">${marketCap.toFixed(2)}</p>
        </div>

        <div className="bg-slate-700/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-slate-400">Holders</span>
          </div>
          <p className="text-lg font-bold text-white">{holders}</p>
        </div>
      </div>

      {/* Price Chart */}
      <div className="bg-slate-700/30 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-white font-medium">Price History</h4>
          <div className="flex gap-2">
            {['1h', '1d', '1w'].map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 text-xs rounded-lg transition ${
                  timeframe === tf 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={priceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              dataKey="timestamp" 
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickFormatter={(ts) => new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            />
            <YAxis 
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickFormatter={(val) => `$${val.toFixed(4)}`}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              labelStyle={{ color: '#cbd5e1' }}
            />
            <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Holder Distribution */}
      {holderData?.distribution && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-slate-700/30 rounded-xl p-4">
            <h4 className="text-white font-medium mb-4">Top Holders Distribution</h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={holderData.distribution.slice(0, 6)}
                  dataKey="percentage"
                  nameKey="address"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => `${entry.percentage.toFixed(1)}%`}
                >
                  {holderData.distribution.slice(0, 6).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-slate-700/30 rounded-xl p-4">
            <h4 className="text-white font-medium mb-4">Holder Statistics</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Total Holders</span>
                <span className="text-white font-medium">{holderData.totalHolders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Top Holder</span>
                <span className="text-white font-medium">{holderData.topHolderPercentage.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Circulating Supply</span>
                <span className="text-white font-medium">{token.supply.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm flex items-center gap-1">
                  <Flame className="w-4 h-4 text-orange-400" />
                  Burn Rate
                </span>
                <span className="text-white font-medium">{burnRate.toFixed(2)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Activity */}
      {onChainData?.recentTransactions && (
        <div className="bg-slate-700/30 rounded-xl p-4">
          <h4 className="text-white font-medium mb-4">Recent Activity</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={onChainData.recentTransactions.slice(0, 20)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                dataKey="blockTime" 
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickFormatter={(time) => new Date(time * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              />
              <Bar dataKey="slot" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Supply Metrics */}
      <div className="bg-slate-700/30 rounded-xl p-4">
        <h4 className="text-white font-medium mb-4">Tokenomics</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Initial Supply</span>
            <span className="text-white font-mono">{token.initialSupply.toLocaleString()}</span>
          </div>
          <div className="w-full bg-slate-600 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full" 
              style={{ width: `${(token.supply / token.initialSupply) * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Current Supply</span>
            <span className="text-white font-mono">{token.supply.toLocaleString()}</span>
          </div>
          {token.burned > 0 && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <Flame className="w-4 h-4 text-orange-400" />
                  Burned
                </span>
                <span className="text-orange-400 font-mono">{token.burned.toLocaleString()}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}