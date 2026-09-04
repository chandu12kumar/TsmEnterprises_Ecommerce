// Supabase Edge Function: send-enquiry-email
// Serves: Customer Confirmation Email + Admin Notification Email
// Uses @supabase/server and Resend API

import { withSupabase } from 'npm:@supabase/server'

// Ambient Deno typing to prevent IDE/TypeScript errors in non-Deno environments
declare const Deno: {
  env: {
    get(key: string): string | undefined
  }
}

interface RequestPayload {
  enquiry_id: string
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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

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

      // Enforce rate limit per IP (15 requests per minute)
      if (!checkRateLimit(`ip:${clientIp}`, 15, 60_000)) {
        return Response.json(
          { error: 'Too many email requests from this IP. Please wait a moment.' },
          { status: 429, headers: { ...corsHeaders, 'Retry-After': '60' } }
        )
      }

      const resendApiKey = Deno.env.get('RESEND_API_KEY') || ''
      const adminEmail = Deno.env.get('ADMIN_EMAIL') || 'admin@tsmenterprises.in'
      const siteUrl = Deno.env.get('SITE_URL') || 'https://tsmenterprises.in'

      const body = (await req.json().catch(() => ({}))) as RequestPayload
      const { enquiry_id } = body

      if (!enquiry_id || typeof enquiry_id !== 'string' || !UUID_REGEX.test(enquiry_id)) {
        return Response.json(
          { error: 'Valid enquiry_id UUID parameter is required' },
          { status: 400, headers: corsHeaders }
        )
      }

      // Enforce rate limit per enquiry_id (maximum 3 dispatches per 5 minutes)
      if (!checkRateLimit(`enquiry:${enquiry_id}`, 3, 300_000)) {
        return Response.json(
          { error: 'Too many dispatch attempts for this enquiry. Please wait.' },
          { status: 429, headers: { ...corsHeaders, 'Retry-After': '60' } }
        )
      }

      // Use admin client with elevated privileges to bypass RLS for email dispatch
      const db = ctx.supabaseAdmin || ctx.supabase

      // 2. Fetch Enquiry Details with Vehicle Info
      const { data: enquiry, error: enqError } = await db
        .from('enquiries')
        .select(`
          *,
          vehicles:vehicle_id (
            id, name, category, brand, model, year, price, location, description
          )
        `)
        .eq('id', enquiry_id)
        .single()

      if (enqError || !enquiry) {
        return Response.json(
          { error: 'Enquiry not found', details: enqError?.message },
          { status: 404, headers: corsHeaders }
        )
      }

      // 3. Duplicate Email Check in email_logs
      const { data: existingLogs } = await db
        .from('email_logs')
        .select('id')
        .eq('enquiry_id', enquiry_id)
        .eq('status', 'sent')

      if (existingLogs && existingLogs.length > 0) {
        return Response.json(
          { message: 'Emails already sent for this enquiry', skipped: true },
          { status: 200, headers: corsHeaders }
        )
      }

      const vehicle = enquiry.vehicles || {}
      const formattedPrice = vehicle.price
        ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(vehicle.price)
        : 'Price on Enquiry'
      const enquiryDate = new Date(enquiry.created_at || Date.now()).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })

      // If Resend API Key is not configured yet, record note & return gracefully
      if (!resendApiKey) {
        console.warn('RESEND_API_KEY is not configured in Supabase Edge Function secrets.')
        return Response.json(
          {
            success: true,
            notice: 'Enquiry saved. RESEND_API_KEY environment variable pending setup in Supabase.',
            enquiry_id,
          },
          { status: 200, headers: corsHeaders }
        )
      }

      // Helper: Send Email via Resend
      const fromEmail = Deno.env.get('FROM_EMAIL') || 'TSM Enterprises <onboarding@resend.dev>'
      const sendEmail = async ({ to, subject, html, text }: { to: string; subject: string; html: string; text: string }) => {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [to],
            subject,
            html,
            text,
          }),
        })
        const data = await res.json()
        console.log('Resend response:', JSON.stringify(data))
        return data
      }

      // ─── EMAIL 1: Customer Confirmation ───
      const customerSubject = `TSM Enterprises – Vehicle Enquiry Confirmation (#${enquiry_id.slice(0, 8)})`
      const vehicleDetailUrl = `${siteUrl}/product/${vehicle.id || ''}`

      const customerHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8f9fa; margin: 0; padding: 20px; color: #212529; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e9ecef; }
            .header { background: #060b22; padding: 24px; text-align: center; border-bottom: 3px solid #e01010; }
            .logo { color: #ffffff; font-size: 22px; font-weight: bold; letter-spacing: 1px; }
            .logo span { color: #e01010; }
            .content { padding: 30px 25px; }
            .highlight-box { background: #fff5f5; border-left: 4px solid #e01010; padding: 15px 20px; border-radius: 4px; margin: 20px 0; font-size: 14px; line-height: 1.5; color: #333; }
            .card { background: #fdfdfd; border: 1px solid #eaeaea; border-radius: 8px; padding: 18px; margin: 20px 0; }
            .card-title { font-size: 16px; font-weight: bold; color: #060b22; margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 8px; }
            .spec-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
            .spec-label { color: #6c757d; }
            .spec-value { font-weight: 600; color: #212529; }
            .btn { display: inline-block; background-color: #e01010; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: bold; font-size: 14px; text-align: center; margin: 15px 0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #e9ecef; }
            .footer a { color: #e01010; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">TSM <span>ENTERPRISES</span></div>
              <div style="color: #a0aec0; font-size: 12px; margin-top: 4px;">Quality Second-Hand Commercial & Agricultural Vehicles</div>
            </div>
            <div class="content">
              <h2 style="color: #060b22; margin-top: 0;">Enquiry Confirmed</h2>
              <p>Dear <strong>${enquiry.name}</strong>,</p>
              <div class="highlight-box">
                <strong>Thank you for your enquiry with TSM Enterprises.</strong> We have received your vehicle enquiry successfully. Our team will contact you shortly to confirm availability, pricing, documentation, and further purchase details.
              </div>

              <div class="card">
                <div class="card-title">Vehicle Information</div>
                <div class="spec-row"><span class="spec-label">Vehicle Name:</span><span class="spec-value">${vehicle.name || 'Enquired Vehicle'}</span></div>
                <div class="spec-row"><span class="spec-label">Category:</span><span class="spec-value">${vehicle.category || 'Commercial'}</span></div>
                <div class="spec-row"><span class="spec-label">Model / Year:</span><span class="spec-value">${vehicle.model || '—'} (${vehicle.year || '—'})</span></div>
                <div class="spec-row"><span class="spec-label">Price:</span><span class="spec-value">${formattedPrice}</span></div>
                <div class="spec-row"><span class="spec-label">Location:</span><span class="spec-value">${vehicle.location || 'Salem, Tamil Nadu'}</span></div>
              </div>

              <div class="card">
                <div class="card-title">Enquiry Details</div>
                <div class="spec-row"><span class="spec-label">Enquiry ID:</span><span class="spec-value">#${enquiry_id.slice(0, 8)}</span></div>
                <div class="spec-row"><span class="spec-label">Date:</span><span class="spec-value">${enquiryDate}</span></div>
                <div class="spec-row"><span class="spec-label">Contact Phone:</span><span class="spec-value">${enquiry.phone}</span></div>
                <div class="spec-row"><span class="spec-label">Your Message:</span><span class="spec-value">"${enquiry.message || 'No additional note'}"</span></div>
              </div>

              <div style="text-align: center;">
                <a href="${vehicleDetailUrl}" class="btn">View Vehicle Online</a>
              </div>

              <p style="font-size: 13px; color: #6c757d; margin-top: 25px;">
                Need immediate assistance? Call our direct dealership desk at <strong>+91 77590 54042</strong> or WhatsApp us anytime.
              </p>
            </div>
            <div class="footer">
              © ${new Date().getFullYear()} TSM Enterprises. All Rights Reserved.<br>
              Near Govt Bus Stand, Gayatri Nagar, Khunti, Jharkhand<br>
              <a href="mailto:kamikimnekaku@gmail.com">kamikimnekaku@gmail.com</a> | +91 77590 54042
            </div>
          </div>
        </body>
        </html>
      `

      const customerText = `
TSM ENTERPRISES — VEHICLE ENQUIRY CONFIRMATION
===============================================
Dear ${enquiry.name},

Thank you for your enquiry with TSM Enterprises. We have received your vehicle enquiry successfully. Our team will contact you shortly to confirm availability, pricing, documentation, and further purchase details.

VEHICLE DETAILS:
- Name: ${vehicle.name || 'Commercial Vehicle'}
- Category: ${vehicle.category || '—'}
- Year: ${vehicle.year || '—'}
- Price: ${formattedPrice}
- Location: ${vehicle.location || 'Khunti, Jharkhand'}

ENQUIRY DETAILS:
- Enquiry ID: #${enquiry_id.slice(0, 8)}
- Date: ${enquiryDate}
- Contact Phone: ${enquiry.phone}
- Message: "${enquiry.message || '—'}"

View Vehicle: ${vehicleDetailUrl}

Contact TSM Enterprises: +91 77590 54042 | kamikimnekaku@gmail.com
Near Govt Bus Stand, Gayatri Nagar, Khunti, Jharkhand
      `

      // ─── EMAIL 2: Admin Notification ───
      const adminSubject = `New Vehicle Enquiry / Booking – TSM Enterprises (#${enquiry_id.slice(0, 8)})`
      const adminDashboardUrl = `${siteUrl}/admin/enquiries`

      const adminHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f1f3f5; padding: 20px; color: #212529; }
            .box { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; border: 1px solid #ced4da; overflow: hidden; }
            .banner { background: #e01010; color: #ffffff; padding: 18px 24px; font-weight: bold; font-size: 18px; }
            .inner { padding: 24px; }
            .sec { margin-bottom: 20px; }
            .sec-h { font-size: 14px; font-weight: bold; text-transform: uppercase; color: #0a1435; margin-bottom: 8px; border-bottom: 2px solid #e9ecef; padding-bottom: 4px; }
            .row { font-size: 13px; margin-bottom: 6px; }
            .label { color: #6c757d; display: inline-block; width: 130px; }
            .val { font-weight: 600; color: #0a1435; }
            .cta { display: inline-block; background: #0a1435; color: #ffffff !important; padding: 10px 22px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="box">
            <div class="banner">🚨 New Customer Enquiry Received</div>
            <div class="inner">
              <div class="sec">
                <div class="sec-h">Customer Information</div>
                <div class="row"><span class="label">Name:</span><span class="val">${enquiry.name}</span></div>
                <div class="row"><span class="label">Phone:</span><span class="val"><a href="tel:${enquiry.phone}">${enquiry.phone}</a></span></div>
                <div class="row"><span class="label">Email:</span><span class="val">${enquiry.email || 'Not provided'}</span></div>
                <div class="row"><span class="label">WhatsApp Direct:</span><span class="val"><a href="https://wa.me/91${enquiry.phone.replace(/[^0-9]/g, '')}">Chat on WhatsApp</a></span></div>
              </div>

              <div class="sec">
                <div class="sec-h">Vehicle Details</div>
                <div class="row"><span class="label">Vehicle:</span><span class="val">${vehicle.name || 'General Enquiry'}</span></div>
                <div class="row"><span class="label">Category / Brand:</span><span class="val">${vehicle.category || '—'} / ${vehicle.brand || '—'}</span></div>
                <div class="row"><span class="label">Year / Price:</span><span class="val">${vehicle.year || '—'} / ${formattedPrice}</span></div>
                <div class="row"><span class="label">Vehicle ID:</span><span class="val">${vehicle.id || '—'}</span></div>
              </div>

              <div class="sec">
                <div class="sec-h">Enquiry Content</div>
                <div class="row"><span class="label">Enquiry ID:</span><span class="val">#${enquiry_id}</span></div>
                <div class="row"><span class="label">Status:</span><span class="val">${enquiry.status || 'new'}</span></div>
                <div class="row" style="margin-top: 8px;">
                  <div style="background: #f8f9fa; padding: 10px; border-radius: 6px; font-style: italic;">
                    "${enquiry.message || 'Customer requested contact'}"
                  </div>
                </div>
              </div>

              <div style="text-align: center; margin-top: 25px;">
                <a href="${adminDashboardUrl}" class="cta">View Enquiry in Admin Dashboard</a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `

      const adminText = `
NEW VEHICLE ENQUIRY RECEIVED
Customer: ${enquiry.name} (${enquiry.phone})
Email: ${enquiry.email || '—'}
Vehicle: ${vehicle.name || 'General'} (Price: ${formattedPrice})
Enquiry ID: #${enquiry_id}
Message: "${enquiry.message || '—'}"
Admin Link: ${adminDashboardUrl}
      `

      // 4. Dispatch Emails & Record in email_logs
      let customerResult = null
      let adminResult = null

      if (enquiry.email) {
        try {
          customerResult = await sendEmail({
            to: enquiry.email,
            subject: customerSubject,
            html: customerHtml,
            text: customerText,
          })
          await db.from('email_logs').insert({
            enquiry_id,
            recipient_email: enquiry.email,
            email_type: 'customer_confirmation',
            status: customerResult?.id ? 'sent' : 'failed',
            error_message: customerResult?.error?.message || null,
          })
        } catch (err: any) {
          await db.from('email_logs').insert({
            enquiry_id,
            recipient_email: enquiry.email,
            email_type: 'customer_confirmation',
            status: 'failed',
            error_message: err?.message || String(err),
          })
        }
      }

      try {
        adminResult = await sendEmail({
          to: adminEmail,
          subject: adminSubject,
          html: adminHtml,
          text: adminText,
        })
        await db.from('email_logs').insert({
          enquiry_id,
          recipient_email: adminEmail,
          email_type: 'admin_notification',
          status: adminResult?.id ? 'sent' : 'failed',
          error_message: adminResult?.error?.message || null,
        })
      } catch (err: any) {
        await db.from('email_logs').insert({
          enquiry_id,
          recipient_email: adminEmail,
          email_type: 'admin_notification',
          status: 'failed',
          error_message: err?.message || String(err),
        })
      }

      return Response.json(
        {
          success: true,
          customer_email_sent: !!customerResult?.id,
          admin_email_sent: !!adminResult?.id,
        },
        { status: 200, headers: corsHeaders }
      )
    } catch (error: any) {
      return Response.json(
        { error: error.message || 'Internal Server Error' },
        { status: 500, headers: corsHeaders }
      )
    }
  }),
}
