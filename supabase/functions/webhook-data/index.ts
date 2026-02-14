import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface WebhookPayload {
  organization_id: string;
  records: {
    date: string;
    scheduled_operations?: number;
    completed_operations?: number;
    cancelled_operations?: number;
    cancellation_reason?: string;
    location_id?: string;
    weather_impact?: boolean;
    custom_data?: Record<string, unknown>;
  }[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate webhook key
    const webhookKey = req.headers.get('x-webhook-key');
    const authHeader = req.headers.get('authorization');
    
    if (!webhookKey && !authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required. Use x-webhook-key header or Authorization Bearer token.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // If using Bearer token, validate the user
    let organizationId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Invalid authentication token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get user's organization
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (org) {
        organizationId = org.id;
      }
    }

    const payload: WebhookPayload = await req.json();

    if (!payload.records || !Array.isArray(payload.records) || payload.records.length === 0) {
      return new Response(
        JSON.stringify({ error: 'records array is required and must not be empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const orgId = payload.organization_id || organizationId;
    if (!orgId) {
      return new Response(
        JSON.stringify({ error: 'organization_id is required (in payload or via auth token)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate and insert records
    const records = payload.records.map(record => ({
      organization_id: orgId,
      date: record.date,
      scheduled_operations: record.scheduled_operations || 0,
      completed_operations: record.completed_operations || 0,
      cancelled_operations: record.cancelled_operations || 0,
      cancellation_reason: record.cancellation_reason || null,
      location_id: record.location_id || null,
      weather_impact: record.weather_impact || false,
      custom_data: record.custom_data || {},
    }));

    const { data, error } = await supabase
      .from('operational_data')
      .insert(records)
      .select();

    if (error) {
      console.error('Database insert error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to insert records', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Webhook: inserted ${data.length} records for org ${orgId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        inserted: data.length,
        message: `${data.length} registros importados com sucesso` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
