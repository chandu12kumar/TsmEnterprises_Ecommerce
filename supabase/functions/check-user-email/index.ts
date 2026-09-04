// Supabase Edge Function: check-user-email
// Securely checks whether an email address belongs to a registered user
// Does NOT expose users list, passwords, tokens, or sensitive user data to the client

import { withSupabase } from 'npm:@supabase/server'

// Ambient Deno typing to prevent IDE/TypeScript errors in non-Deno environments
declare const Deno: {
  env: {
    get(key: string): string | undefined
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// In-memory sliding-window rate limiter per Edge Function isolate
const rateLimits = new Map<string, number[]>()

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const timestamps = (rateLimits.get(key) || []).filter((t) => now - t < windowMs)
  if (timestamps.length >= limit) {
    rateLimits.set(key, timestamps)
    return false
  }
  timestamps.push(now)
  rateLimits.set(key, timestamps)
  return true
}

export default {
  fetch: withSupabase({ auth: 'none' }, async (req: Request, ctx: any) => {
    // 1. Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    try {
      const clientIp = (
        req.headers.get('x-forwarded-for')?.split(',')[0] ||
        req.headers.get('cf-connecting-ip') ||
        'anonymous'
      ).trim()

      // Enforce rate limit per IP (20 requests per minute)
      if (!checkRateLimit(`ip:${clientIp}`, 20, 60_000)) {
        return Response.json(
          { error: 'Too many requests from this IP. Please wait a moment.' },
          { status: 429, headers: { ...corsHeaders, 'Retry-After': '60' } }
        )
      }

      const body = (await req.json().catch(() => ({}))) as { email?: string }
      const email = (body?.email || '').trim().toLowerCase()

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return Response.json(
          { error: 'A valid email address is required.' },
          { status: 400, headers: corsHeaders }
        )
      }

      // Enforce rate limit per target email (6 checks per minute)
      if (!checkRateLimit(`email:${email}`, 6, 60_000)) {
        return Response.json(
          { error: 'Too many verification attempts for this email. Please wait a moment.' },
          { status: 429, headers: { ...corsHeaders, 'Retry-After': '60' } }
        )
      }

      // Always use elevated admin client if available to check profiles
      const db = ctx.supabaseAdmin || ctx.supabase

      // Check 1: Profiles table
      const { data: profile, error: profileErr } = await db
        .from('profiles')
        .select('id')
        .ilike('email', email)
        .maybeSingle()

      if (profile && profile.id) {
        return Response.json(
          { exists: true, email },
          { status: 200, headers: corsHeaders }
        )
      }

      // Check 2: Try RPC check_user_exists if available
      try {
        const { data: rpcExists, error: rpcErr } = await db.rpc('check_user_exists', {
          lookup_email: email,
        })
        if (!rpcErr && typeof rpcExists === 'boolean') {
          return Response.json(
            { exists: rpcExists, email },
            { status: 200, headers: corsHeaders }
          )
        }
      } catch (rpcCatch) {
        // RPC might not exist yet, continue
      }

      // Check 3: Check auth.admin if available
      if (ctx.supabaseAdmin?.auth?.admin?.listUsers) {
        try {
          // List with small batch to check match
          const { data: authUsers } = await ctx.supabaseAdmin.auth.admin.listUsers({
            page: 1,
            perPage: 100,
          })
          const found = authUsers?.users?.some(
            (u: any) => (u.email || '').toLowerCase() === email
          )
          if (found) {
            return Response.json(
              { exists: true, email },
              { status: 200, headers: corsHeaders }
            )
          }
        } catch (authErr) {
          // Fallback if admin.listUsers has permission restrictions
        }
      }

      return Response.json(
        { exists: false, email },
        { status: 200, headers: corsHeaders }
      )
    } catch (err: any) {
      console.error('Error in check-user-email function:', err)
      return Response.json(
        { error: 'Internal server error while checking email.' },
        { status: 500, headers: corsHeaders }
      )
    }
  }),
}
