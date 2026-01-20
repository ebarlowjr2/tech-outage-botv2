import { createClient as createSupabaseClient } from '@supabase/supabase-js';

let clientInstance: ReturnType<typeof createSupabaseClient> | null = null;

export function createClient() {
    if (clientInstance) return clientInstance;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase environment variables');
    }

    clientInstance = createSupabaseClient(supabaseUrl, supabaseKey);
    return clientInstance;
}
