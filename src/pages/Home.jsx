import '../components/token/web3/polyfills';
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function HomePage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(createPageUrl('Minting'));
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Redirecting to Minting...</h1>
      </div>
    </div>
  );
}