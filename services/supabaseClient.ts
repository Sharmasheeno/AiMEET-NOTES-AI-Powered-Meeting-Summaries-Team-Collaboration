/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Add your Supabase project URL and anon key to the environment variables.
// You can find these in your Supabase project settings -> API.
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL and Anon Key must be provided in environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);