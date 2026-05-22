import 'server-only'; // 🛡️ CRITICAL SAFETY LOCK

import { createClient } from '@supabase/supabase-js';
import { sanitizeKey } from '@/lib/key-utils';

const getSupabase = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = sanitizeKey(process.env.SUPABASE_SERVICE_ROLE_KEY);
    if (!url || !key) return null;
    return createClient(url, key);
};

export const ServiceLayer = {
    logEvent: async (action: string, meta: Record<string, unknown>) => {
        const supabase = getSupabase();
        if (!supabase) return;
        try {
            await supabase.from('audit_logs').insert({
                action,
                meta,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.warn("⚠️ Logging Failed:", message);
        }
    }
};
