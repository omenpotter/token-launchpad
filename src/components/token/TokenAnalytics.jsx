import React, { useState } from 'react';
import { TrendingUp, Users, Activity, Droplets, ArrowUpRight, ArrowDownRight, BarChart3, Target } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';

export default function TokenAnalytics({ token }) {
  const [timeframe, setTimeframe] = useState('24h');
  
  // Mock data - timeframe dependent
  const priceHistoryData = {
    '24h': [
      { time: '00:00', price: 0.08, volume: 500 },
      { time: '04:00', price: 0.09, volume: 800 },
      { time: '08:00', price: 0.12, volume: 1200 },
      { time: '12:00', price: 0.11, volume: 900 },
      { time: '16:00', price: 0.15, volume: 1500 },
      { time: '20:00', price: 0.14, volume: 1100 },
      { time: '24:00', price: 0.16, volume: 1300 }
    ],
    '7d': [
      { time: 'Mon', price: 0.08, volume: 4500 },
      { time: 'Tue', price: 0.10, volume: 5200 },
      { time: 'Wed', price: 0.12, volume: 6100 },
      { time: 'Thu', price: 0.14, volume: 5800 },
      { time: 'Fri', price: 0.15, volume: 7200 },
      { time: 'Sat', price: 0.14, volume: 4800 },
      { time: 'Sun', price: 0.16, volume: 5500 }
    ],
    '30d': [
      { time: 'Week 1', price: 0.05, volume: 18000 },
      { time: 'Week 2', price: 0.08, volume: 22000 },
      { time: 'Week 3', price: 0.12, volume: 28000 },
      { time: 'Week 4', price: 0.16, volume: 32000 }
    ]
  };

  const priceHistory = priceHistoryData[timeframe];

  // Market comparison data
  const marketComparison = [
    { name: token.symbol, value: 100, change: 15.5, color: '#06b6d4' },
    { name: 'Market Avg', value: 55, change: 8.2, color: '#8b5cf6' },
    { name: 'XNT', value: 35, change: 5.1, color: '#f59e0b' }
  ];

  const holdersDistribution = [
    { name: 'Top 10 Holders', value: 35, color: '#8b5cf6' },
    { name: '11-100 Holders', value: 40, color: '#06b6d4' },
    { name: '100+ Holders', value: 25, color: '#10b981' }
  ];

  const recentTransactions = [
    { type: 'mint', amount: 1000, from: '0x1234...5678', time: '2 mins ago', hash: '0xabc...' },
    { type: 'swap', amount: 500, from: '0x8765...4321', time: '15 mins ago', hash: '0xdef...' },
    { type: 'burn', amount: 200, from: '0x5432...8765', time: '1 hour ago', hash: '0xghi...' },
    { type: 'mint', amount: 750, from: '0x9876...5432', time: '3 hours ago', hash: '0xjkl...' }
  ];

  const priceChange = ((priceHistory[priceHistory.length - 1].price - priceHistory[0].price) / priceHistory[0].price * 100).toFixed(2);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-white font-semibold">Token Analytics</h4>
        <div className="flex gap-2">
          {['24h', '7d', '30d'].map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                timeframe === tf
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-slate-400">Current Price</span>
          </div>
          <p className="text-2xl font-bold text-white mb-1">0.16 XNT</p>
          <span className={`text-xs flex items-center gap-1 ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {priceChange >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(priceChange)}%
          </span>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <Droplets className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-slate-400">TVL</span>
          </div>
          <p className="text-2xl font-bold text-white mb-1">$12.5K</p>
          <span className="text-xs text-slate-500">In liquidity pools</span>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-slate-400">Holders</span>
          </div>
          <p className="text-2xl font-bold text-white mb-1">247</p>
          <span className="text-xs text-slate-500">Unique wallets</span>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-green-400" />
            <span className="text-xs text-slate-400">{timeframe} Volume</span>
          </div>
          <p className="text-2xl font-bold text-white mb-1">$8.2K</p>
          <span className="text-xs text-green-400 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            15.3%
          </span>
        </div>
      </div>

      {/* Price Chart */}
      <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
        <h4 className="text-white font-semibold mb-4">Price History ({timeframe})</h4>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={priceHistory}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#64748b" style={{ fontSize: '12px' }} />
            <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              labelStyle={{ color: '#cbd5e1' }}
            />
            <Area type="monotone" dataKey="price" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorPrice)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Volume Chart & Market Performance */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
          <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Trading Volume ({timeframe})
          </h4>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={priceHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#64748b" style={{ fontSize: '12px' }} />
              <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#cbd5e1' }}
              />
              <Bar dataKey="volume" fill="#06b6d4" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
          <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Performance vs Market
          </h4>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={marketComparison} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" stroke="#64748b" style={{ fontSize: '12px' }} />
              <YAxis dataKey="name" type="category" stroke="#64748b" style={{ fontSize: '12px' }} width={70} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#cbd5e1' }}
                formatter={(value) => [value, 'Index']}
              />
              <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                {marketComparison.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {marketComparison.map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-xs text-slate-400">{item.name}</span>
                </div>
                <p className="text-sm font-semibold text-white">+{item.change}%</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Holders Distribution */}
      <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
        <h4 className="text-white font-semibold mb-4">Holders Distribution</h4>
        <div className="flex items-center gap-8">
          <div className="w-48 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={holdersDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {holdersDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-3">
            {holdersDistribution.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-slate-300">{item.name}</span>
                </div>
                <span className="text-white font-semibold">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
        <h4 className="text-white font-semibold mb-4">Recent Transactions</h4>
        <div className="space-y-2">
          {recentTransactions.map((tx, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  tx.type === 'mint' ? 'bg-green-500/20' :
                  tx.type === 'burn' ? 'bg-red-500/20' :
                  'bg-blue-500/20'
                }`}>
                  {tx.type === 'mint' ? '🔥' : tx.type === 'burn' ? '🔥' : '🔄'}
                </div>
                <div>
                  <p className="text-white text-sm font-medium capitalize">{tx.type}</p>
                  <p className="text-xs text-slate-400">{tx.from}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-medium">{tx.amount.toLocaleString()} {token.symbol}</p>
                <p className="text-xs text-slate-500">{tx.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}