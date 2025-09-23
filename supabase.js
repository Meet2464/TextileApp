import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import { createClient } from '@supabase/supabase-js';

// Prefer environment variables if using Expo (eas secrets) or .env
// Paste your values here or use Expo env vars
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://inwlsalsahhyjliddryf.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlud2xzYWxzYWhoeWpsaWRkcnlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2MTczNDksImV4cCI6MjA3NDE5MzM0OX0.cRFX4bdjqLCko-sdSaaYmxWQE2cgichgi3M4U67dTCQ';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase credentials are not set. Paste URL and anon key in supabase.js or set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY env vars.');
}

export const supabase = createClient(SUPABASE_URL || '', SUPABASE_ANON_KEY || '');


