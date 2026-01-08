import '../components/token/web3/polyfills';
import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Redirecting to Minting...</h1>
      </div>
      <script dangerouslySetInnerHTML={{
        __html: `window.location.href = '${createPageUrl('Minting')}';`
      }} />
    </div>
  );
}