// Default landing page - redirects to Minting
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to Minting page on mount
    navigate(createPageUrl('Minting'), { replace: true });
  }, [navigate]);

  return null;
}