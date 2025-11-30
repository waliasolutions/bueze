import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify caller is admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'super_admin'])
      .single();

    if (!roles) {
      throw new Error('Admin access required');
    }

    console.log('Starting test data population...');
    
    const results = {
      homeownersCreated: 0,
      handwerkersCreated: 0,
      leadsCreated: 0,
      proposalsCreated: 0,
      errors: [] as string[]
    };

    // Test data definitions
    const homeowners = [
      { email: 'homeowner1@test.ch', name: 'Max Müller', phone: '+41 79 123 45 67' },
      { email: 'homeowner2@test.ch', name: 'Anna Schmidt', phone: '+41 79 234 56 78' },
      { email: 'homeowner3@test.ch', name: 'Peter Weber', phone: '+41 79 345 67 89' },
      { email: 'homeowner4@test.ch', name: 'Lisa Meyer', phone: '+41 79 456 78 90' },
      { email: 'homeowner5@test.ch', name: 'Thomas Fischer', phone: '+41 79 567 89 01' },
    ];

    const handwerkers = [
      { 
        email: 'elektriker@test.ch', 
        firstName: 'Hans', 
        lastName: 'Elektro',
        company: 'Elektro Hans GmbH',
        categories: ['electrician'],
        zip: '8001',
        canton: 'ZH',
        city: 'Zürich'
      },
      { 
        email: 'maler@test.ch', 
        firstName: 'Maria', 
        lastName: 'Farben',
        company: 'Malermeister Farben',
        categories: ['painter'],
        zip: '3011',
        canton: 'BE',
        city: 'Bern'
      },
      { 
        email: 'schreiner@test.ch', 
        firstName: 'Karl', 
        lastName: 'Holz',
        company: 'Schreinerei Holz AG',
        categories: ['carpenter'],
        zip: '4051',
        canton: 'BS',
        city: 'Basel'
      },
      { 
        email: 'heizung@test.ch', 
        firstName: 'Stefan', 
        lastName: 'Warm',
        company: 'Heizung & Sanitär Warm',
        categories: ['plumber', 'heating'],
        zip: '6003',
        canton: 'LU',
        city: 'Luzern'
      },
      { 
        email: 'dachdecker@test.ch', 
        firstName: 'Andreas', 
        lastName: 'Dach',
        company: 'Dachdeckerei Dach',
        categories: ['roofer'],
        zip: '9000',
        canton: 'SG',
        city: 'St. Gallen'
      },
    ];

    // Create homeowners
    for (const homeowner of homeowners) {
      try {
        const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: homeowner.email,
          password: 'Test1234!',
          email_confirm: true,
          user_metadata: {
            full_name: homeowner.name,
            phone: homeowner.phone
          }
        });

        if (createError) throw createError;

        await supabaseAdmin.from('profiles').upsert({
          id: authData.user.id,
          email: homeowner.email,
          full_name: homeowner.name,
          phone: homeowner.phone
        });

        await supabaseAdmin.from('user_roles').upsert({
          user_id: authData.user.id,
          role: 'client'
        });

        results.homeownersCreated++;
        console.log(`Created homeowner: ${homeowner.email}`);
      } catch (error) {
        results.errors.push(`Homeowner ${homeowner.email}: ${error.message}`);
      }
    }

    // Create handwerkers
    const handwerkerIds: string[] = [];
    for (const handwerker of handwerkers) {
      try {
        const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: handwerker.email,
          password: 'Test1234!',
          email_confirm: true,
          user_metadata: {
            full_name: `${handwerker.firstName} ${handwerker.lastName}`
          }
        });

        if (createError) throw createError;

        await supabaseAdmin.from('profiles').upsert({
          id: authData.user.id,
          email: handwerker.email,
          full_name: `${handwerker.firstName} ${handwerker.lastName}`
        });

        await supabaseAdmin.from('user_roles').upsert({
          user_id: authData.user.id,
          role: 'handwerker'
        });

        const { data: profileData } = await supabaseAdmin
          .from('handwerker_profiles')
          .insert({
            user_id: authData.user.id,
            email: handwerker.email,
            first_name: handwerker.firstName,
            last_name: handwerker.lastName,
            company_name: handwerker.company,
            categories: handwerker.categories,
            service_areas: [handwerker.zip],
            business_zip: handwerker.zip,
            business_canton: handwerker.canton,
            business_city: handwerker.city,
            verification_status: 'approved',
            is_verified: true,
            verified_at: new Date().toISOString(),
            bio: `Professioneller ${handwerker.categories[0]} mit jahrelanger Erfahrung.`,
            hourly_rate_min: 80,
            hourly_rate_max: 120
          })
          .select()
          .single();

        await supabaseAdmin.from('handwerker_subscriptions').insert({
          user_id: authData.user.id,
          plan_type: 'free',
          proposals_limit: 5,
          proposals_used_this_period: 0,
          status: 'active'
        });

        handwerkerIds.push(authData.user.id);
        results.handwerkersCreated++;
        console.log(`Created handwerker: ${handwerker.email}`);
      } catch (error) {
        results.errors.push(`Handwerker ${handwerker.email}: ${error.message}`);
      }
    }

    // Get created homeowner IDs
    const { data: homeownerProfiles } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .in('email', homeowners.map(h => h.email));

    // Create leads
    const leadCategories = ['electrician', 'painter', 'carpenter', 'plumber', 'roofer'];
    const cities = [
      { name: 'Zürich', zip: '8001', canton: 'ZH' },
      { name: 'Bern', zip: '3011', canton: 'BE' },
      { name: 'Basel', zip: '4051', canton: 'BS' },
      { name: 'Luzern', zip: '6003', canton: 'LU' },
      { name: 'St. Gallen', zip: '9000', canton: 'SG' }
    ];

    const leadTemplates = [
      { title: 'Badezimmer Renovation', desc: 'Komplette Badezimmer-Renovation inklusive Fliesen und Sanitär' },
      { title: 'Wohnzimmer streichen', desc: '3 Zimmer professionell streichen lassen' },
      { title: 'Küche modernisieren', desc: 'Neue Kücheninstallation mit Elektroarbeiten' },
      { title: 'Dach reparieren', desc: 'Mehrere undichte Stellen im Dach beheben' },
      { title: 'Parkett verlegen', desc: 'Parkett in Wohnzimmer und Schlafzimmer verlegen' }
    ];

    const leadIds: string[] = [];
    if (homeownerProfiles && homeownerProfiles.length > 0) {
      for (let i = 0; i < 25; i++) {
        try {
          const owner = homeownerProfiles[i % homeownerProfiles.length];
          const city = cities[i % cities.length];
          const template = leadTemplates[i % leadTemplates.length];
          const category = leadCategories[i % leadCategories.length];

          const { data: leadData } = await supabaseAdmin
            .from('leads')
            .insert({
              owner_id: owner.id,
              title: `${template.title} ${i + 1}`,
              description: template.desc,
              category: category,
              city: city.name,
              zip: city.zip,
              canton: city.canton,
              budget_min: 1000 + (i * 500),
              budget_max: 3000 + (i * 1000),
              budget_type: i % 2 === 0 ? 'estimate' : 'fixed',
              urgency: ['immediate', 'urgent', 'planning'][i % 3],
              status: 'active',
              proposal_deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()
            })
            .select()
            .single();

          if (leadData) {
            leadIds.push(leadData.id);
            results.leadsCreated++;
          }
        } catch (error) {
          results.errors.push(`Lead ${i + 1}: ${error.message}`);
        }
      }
    }

    // Create proposals
    if (leadIds.length > 0 && handwerkerIds.length > 0) {
      for (const leadId of leadIds.slice(0, 15)) {
        const numProposals = Math.floor(Math.random() * 3) + 1; // 1-3 proposals per lead
        
        for (let i = 0; i < Math.min(numProposals, handwerkerIds.length); i++) {
          try {
            const handwerkerId = handwerkerIds[i % handwerkerIds.length];
            
            await supabaseAdmin.from('lead_proposals').insert({
              lead_id: leadId,
              handwerker_id: handwerkerId,
              message: 'Guten Tag, ich biete professionelle Dienstleistungen mit jahrelanger Erfahrung. Gerne erstelle ich Ihnen ein detailliertes Angebot.',
              price_min: 800 + (i * 200),
              price_max: 1500 + (i * 300),
              estimated_duration_days: 5 + i,
              status: 'pending'
            });

            results.proposalsCreated++;
          } catch (error) {
            results.errors.push(`Proposal: ${error.message}`);
          }
        }
      }
    }

    console.log('Test data population completed:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Test data populated successfully',
        results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error populating test data:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
