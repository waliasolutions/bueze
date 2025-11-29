/**
 * Comprehensive Test Data Population for Büeze.ch QA
 * Creates realistic test data for all scenarios
 */

import { supabase } from "@/integrations/supabase/client";
import { testUsers, testLeads } from "./testData";

export interface PopulationResult {
  success: boolean;
  message: string;
  created: {
    homeowners: number;
    handwerkers: number;
    leads: number;
    proposals: number;
    conversations: number;
  };
  errors: string[];
}

/**
 * Populate comprehensive test data for all scenarios
 */
export async function populateTestData(): Promise<PopulationResult> {
  const result: PopulationResult = {
    success: false,
    message: '',
    created: {
      homeowners: 0,
      handwerkers: 0,
      leads: 0,
      proposals: 0,
      conversations: 0,
    },
    errors: [],
  };

  try {
    console.log('🚀 Starting comprehensive test data population...');

    // Step 1: Create homeowner accounts
    const homeowners = testUsers.filter(u => u.role === 'homeowner');
    const createdHomeowners: string[] = [];

    for (const user of homeowners) {
      try {
        // Check if user exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('email', user.email)
          .maybeSingle();

        let userId: string;

        if (existingProfile) {
          console.log(`✓ Homeowner exists: ${user.email}`);
          userId = existingProfile.id;
        } else {
          // Create auth user
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: user.email,
            password: user.password,
            email_confirm: true,
          });

          if (authError) throw authError;
          userId = authData.user.id;

          // Update profile
          await supabase
            .from('profiles')
            .update({
              ...user.profile,
              canton: user.profile.canton as any, // Type cast for enum
            })
            .eq('id', userId);

          // Assign user role
          await supabase
            .from('user_roles')
            .insert({ user_id: userId, role: 'user' });

          console.log(`✓ Created homeowner: ${user.email}`);
        }

        createdHomeowners.push(userId);
        result.created.homeowners++;
      } catch (error: any) {
        result.errors.push(`Homeowner ${user.email}: ${error.message}`);
      }
    }

    // Step 2: Create handwerker accounts
    const handwerkers = testUsers.filter(u => u.role === 'handwerker');
    const createdHandwerkers: string[] = [];

    for (const user of handwerkers) {
      try {
        // Check if user exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('email', user.email)
          .maybeSingle();

        let userId: string;

        if (existingProfile) {
          console.log(`✓ Handwerker exists: ${user.email}`);
          userId = existingProfile.id;
        } else {
          // Create auth user
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: user.email,
            password: user.password,
            email_confirm: true,
          });

          if (authError) throw authError;
          userId = authData.user.id;

          // Update profile
          await supabase
            .from('profiles')
            .update({
              ...user.profile,
              canton: user.profile.canton as any, // Type cast for enum
            })
            .eq('id', userId);

          // Assign handwerker role
          await supabase
            .from('user_roles')
            .insert({ user_id: userId, role: 'handwerker' });

          console.log(`✓ Created handwerker: ${user.email}`);
        }

        // Create handwerker profile if not exists
        const { data: existingHWProfile } = await supabase
          .from('handwerker_profiles')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        if (!existingHWProfile && user.handwerkerProfile) {
          await supabase
            .from('handwerker_profiles')
            .insert({
              user_id: userId,
              first_name: user.profile.first_name,
              last_name: user.profile.last_name,
              email: user.email,
              phone_number: user.profile.phone,
              ...user.handwerkerProfile,
              verification_status: 'approved',
              is_verified: true,
            });

          // Create free subscription
          await supabase
            .from('handwerker_subscriptions')
            .insert({
              user_id: userId,
              plan_type: 'free',
              status: 'active',
              proposals_limit: 5,
              proposals_used_this_period: 0,
            });

          console.log(`✓ Created handwerker profile: ${user.email}`);
        }

        createdHandwerkers.push(userId);
        result.created.handwerkers++;
      } catch (error: any) {
        result.errors.push(`Handwerker ${user.email}: ${error.message}`);
      }
    }

    // Step 3: Create leads from homeowners
    const createdLeads: string[] = [];

    for (let i = 0; i < testLeads.length && i < 25; i++) {
      const lead = testLeads[i];
      const ownerId = createdHomeowners[i % createdHomeowners.length];

      try {
        const { data: newLead, error: leadError } = await supabase
          .from('leads')
          .insert({
            ...lead,
            owner_id: ownerId,
          })
          .select()
          .single();

        if (leadError) throw leadError;

        createdLeads.push(newLead.id);
        result.created.leads++;
        console.log(`✓ Created lead: ${lead.title}`);
      } catch (error: any) {
        result.errors.push(`Lead ${lead.title}: ${error.message}`);
      }
    }

    // Step 4: Create proposals from handwerkers
    for (const leadId of createdLeads) {
      // Get lead details
      const { data: lead } = await supabase
        .from('leads')
        .select('category')
        .eq('id', leadId)
        .single();

      if (!lead) continue;

      // Find matching handwerkers
      const matchingHandwerkers = createdHandwerkers.slice(0, Math.min(3, createdHandwerkers.length));

      for (const handwerkerId of matchingHandwerkers) {
        try {
          const proposalMessages = [
            'Gerne erstelle ich Ihnen eine professionelle Offerte für Ihr Projekt. Langjährige Erfahrung und faire Preise.',
            'Sehr geehrte Damen und Herren, ich verfüge über 15 Jahre Erfahrung in diesem Bereich und würde mich freuen, Ihr Projekt realisieren zu dürfen.',
            'Hallo! Ihr Projekt interessiert mich sehr. Ich kann Ihnen eine qualitativ hochwertige Ausführung garantieren.',
          ];

          await supabase
            .from('lead_proposals')
            .insert({
              lead_id: leadId,
              handwerker_id: handwerkerId,
              message: proposalMessages[Math.floor(Math.random() * proposalMessages.length)],
              price_min: 500 + Math.floor(Math.random() * 1000),
              price_max: 2000 + Math.floor(Math.random() * 3000),
              estimated_duration_days: 3 + Math.floor(Math.random() * 10),
              status: 'pending',
            });

          result.created.proposals++;
        } catch (error: any) {
          // Ignore duplicate proposals
          if (!error.message.includes('duplicate')) {
            result.errors.push(`Proposal for lead ${leadId}: ${error.message}`);
          }
        }
      }
    }

    console.log(`✅ Test data population complete!`);
    console.log(`Created: ${result.created.homeowners} homeowners, ${result.created.handwerkers} handwerkers`);
    console.log(`Created: ${result.created.leads} leads, ${result.created.proposals} proposals`);

    result.success = true;
    result.message = `Successfully populated test data: ${result.created.homeowners} homeowners, ${result.created.handwerkers} handwerkers, ${result.created.leads} leads, ${result.created.proposals} proposals`;

    return result;
  } catch (error: any) {
    console.error('❌ Test data population failed:', error);
    result.errors.push(`Fatal error: ${error.message}`);
    result.message = `Failed to populate test data: ${error.message}`;
    return result;
  }
}
