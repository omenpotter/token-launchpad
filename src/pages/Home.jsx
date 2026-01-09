import React, { useState } from 'react';
import { ArrowRight, Coins, Zap, Shield, Users, TrendingUp, BarChart3, Rocket, Lock, Github, Twitter, Mail, ChevronDown, Play, CheckCircle, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const X1_LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695ece00f88266143b4441ac/5910381b6_711323c7-8ae9-4314-922d-ccab7986c619.jpg";

export default function Home() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const features = [
    {
      icon: Coins,
      title: 'Instant Token Creation',
      description: 'Create SPL tokens on X1 in seconds with customizable parameters'
    },
    {
      icon: Zap,
      title: 'One-Click Minting',
      description: 'Mint additional tokens anytime with flexible supply management'
    },
    {
      icon: Shield,
      title: 'Secure by Design',
      description: 'Lock minting authority and set immutable token parameters'
    },
    {
      icon: TrendingUp,
      title: 'Token Analytics',
      description: 'Real-time tracking of your token metrics and performance'
    },
    {
      icon: Rocket,
      title: 'Presale Launchpad',
      description: 'Launch presales directly from your dashboard'
    },
    {
      icon: Users,
      title: 'Fair Mint Features',
      description: 'Set wallet limits and enable fair distribution mechanisms'
    }
  ];

  const steps = [
    {
      number: '01',
      title: 'Connect Wallet',
      description: 'Link your Phantom, Backpack, or X1 Wallet safely'
    },
    {
      number: '02',
      title: 'Create Token',
      description: 'Set name, symbol, supply, and advanced parameters'
    },
    {
      number: '03',
      title: 'Manage & Launch',
      description: 'Mint, burn, add liquidity, or launch a presale instantly'
    }
  ];

  const testimonials = [
    {
      name: 'Alex Chen',
      role: 'Token Creator',
      text: 'X1Space made token creation incredibly simple. Launched my first token in under 5 minutes!'
    },
    {
      name: 'Sarah Mitchell',
      role: 'Project Manager',
      text: 'The dashboard is intuitive and all the features I need are right there. Highly recommended!'
    },
    {
      name: 'Marcus Johnson',
      role: 'Crypto Developer',
      text: 'Finally a platform that handles both X1 and Solana tokens seamlessly.'
    }
  ];

  const handleGetStarted = () => {
    navigate(createPageUrl('Minting'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white">
      {/* Navigation */}
      <nav className="fixed w-full top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden">
                <img src={X1_LOGO} alt="X1Space" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-xl font-bold">X1Space Launcher</h1>
                <p className="text-xs text-slate-400">Create, mint & launch tokens</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-300 hover:text-white transition">Features</a>
              <a href="#how-it-works" className="text-slate-300 hover:text-white transition">How It Works</a>
              <a href="#testimonials" className="text-slate-300 hover:text-white transition">Testimonials</a>
              <button
                onClick={handleGetStarted}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg font-semibold transition transform hover:scale-105"
              >
                Launch App
              </button>
            </div>

            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2"
            >
              <ChevronDown className={`w-6 h-6 transition ${menuOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:hidden mt-4 pb-4 space-y-3 border-t border-slate-700/50 pt-4"
            >
              <a href="#features" className="block text-slate-300 hover:text-white transition">Features</a>
              <a href="#how-it-works" className="block text-slate-300 hover:text-white transition">How It Works</a>
              <a href="#testimonials" className="block text-slate-300 hover:text-white transition">Testimonials</a>
              <button
                onClick={handleGetStarted}
                className="w-full px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-semibold transition"
              >
                Launch App
              </button>
            </motion.div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-12"
          >
            <div className="inline-block mb-4 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full">
              <span className="text-blue-400 text-sm font-semibold">🚀 Token Creation Made Easy</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Create Tokens in Seconds
            </h1>

            <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
              The easiest way to launch, manage, and grow your tokens on X1 Network and Solana. No coding required.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleGetStarted}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg font-semibold flex items-center justify-center gap-2 transition transform hover:scale-105"
              >
                Get Started <ArrowRight className="w-5 h-5" />
              </button>
              <button className="px-8 py-4 border border-slate-600 hover:border-slate-500 rounded-lg font-semibold flex items-center justify-center gap-2 transition">
                <Play className="w-5 h-5" /> Watch Demo
              </button>
            </div>
          </motion.div>

          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-16 rounded-2xl overflow-hidden border border-slate-700/50 shadow-2xl"
          >
            <div className="bg-gradient-to-b from-slate-800 to-slate-900 p-8 h-96 flex items-center justify-center">
              <div className="text-center">
                <Coins className="w-16 h-16 text-blue-400 mx-auto mb-4 opacity-50" />
                <p className="text-slate-400">Dashboard Preview</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-y border-slate-700/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-400 mb-2">10K+</div>
              <p className="text-slate-400">Tokens Created</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-400 mb-2">50K+</div>
              <p className="text-slate-400">Active Users</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-pink-400 mb-2">$100M+</div>
              <p className="text-slate-400">Total Volume</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-cyan-400 mb-2">99.9%</div>
              <p className="text-slate-400">Uptime</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-slate-400">Everything you need to create, manage, and launch tokens</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:border-slate-600/50 transition group"
                >
                  <Icon className="w-12 h-12 text-blue-400 mb-4 group-hover:scale-110 transition" />
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-slate-400">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-slate-400">Get your token live in just 3 simple steps</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div className="p-8 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                  <div className="text-5xl font-bold text-blue-400/20 mb-4">{step.number}</div>
                  <h3 className="text-2xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-slate-400">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 text-slate-600">
                    <ArrowRight className="w-8 h-8" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Loved by Creators</h2>
            <p className="text-xl text-slate-400">Join thousands of successful token launches</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-8 bg-slate-800/50 border border-slate-700/50 rounded-xl"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-300 mb-6 italic">"{testimonial.text}"</p>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-slate-400 text-sm">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-slate-600/50 rounded-2xl p-12 text-center"
          >
            <h2 className="text-4xl font-bold mb-4">Ready to Launch Your Token?</h2>
            <p className="text-xl text-slate-300 mb-8">Join the revolution of token creation. Start for free today.</p>
            <button
              onClick={handleGetStarted}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg font-semibold transition transform hover:scale-105"
            >
              Launch App Now
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Coins className="w-6 h-6 text-blue-400" />
                <span className="font-bold text-lg">X1Space</span>
              </div>
              <p className="text-slate-400">The easiest way to create and manage tokens.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <div className="space-y-2 text-slate-400">
                <p className="hover:text-white cursor-pointer transition">Features</p>
                <p className="hover:text-white cursor-pointer transition">Pricing</p>
                <p className="hover:text-white cursor-pointer transition">Security</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <div className="space-y-2 text-slate-400">
                <p className="hover:text-white cursor-pointer transition">About</p>
                <p className="hover:text-white cursor-pointer transition">Blog</p>
                <p className="hover:text-white cursor-pointer transition">Contact</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Follow Us</h4>
              <div className="flex gap-4">
                <Twitter className="w-5 h-5 text-slate-400 hover:text-white cursor-pointer transition" />
                <Github className="w-5 h-5 text-slate-400 hover:text-white cursor-pointer transition" />
                <Mail className="w-5 h-5 text-slate-400 hover:text-white cursor-pointer transition" />
              </div>
            </div>
          </div>
          <div className="border-t border-slate-700/50 pt-8 text-center text-slate-400">
            <p>&copy; 2026 X1Space. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}