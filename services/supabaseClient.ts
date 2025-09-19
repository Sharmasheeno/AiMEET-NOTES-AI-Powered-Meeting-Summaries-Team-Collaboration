/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Use environment variables if available, otherwise use the provided fallback values for preview purposes.
const supabaseUrl = process.env.SUPABASE_URL || 'https://cuzltpwwnwbnpfjfvxhd.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1emx0cHd3bndibnBmamZ2eGhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyOTE2MTQsImV4cCI6MjA3Mzg2NzYxNH0.eo63gsiH2ay3f5AyxO3zIgYjCdmw_lMrilBKtZaljhQ';

let supabase: SupabaseClient;
let isSupabaseInitialized = false;

if (supabaseUrl && supabaseAnonKey) {
    // A simple check to see if we are using the fallback keys
    if (supabaseUrl === 'https://cuzltpwwnwbnpfjfvxhd.supabase.co') {
        console.warn("Using fallback Supabase credentials. For a production environment, please set the SUPABASE_URL and SUPABASE_ANON_KEY environment variables.");
    }
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    isSupabaseInitialized = true;
} else {
    console.warn("Supabase environment variables (SUPABASE_URL, SUPABASE_ANON_KEY) are not set. The application will be in a degraded mode.");
}

export { supabase, isSupabaseInitialized };