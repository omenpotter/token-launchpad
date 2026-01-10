import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

// ✅ Use environment variable for Base44 URL
const base44Url = import.meta.env.VITE_BASE44_API_URL || appBaseUrl || 'https://x1slauncher.base44.app';

console.log('[Base44Client] Initializing with URL:', base44Url);
console.log('[Base44Client] App ID:', appId);

// Create a client with authentication required
export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: base44Url, // ✅ Use the configured URL
  requiresAuth: false,
  appBaseUrl: base44Url // ✅ Also update appBaseUrl
});
