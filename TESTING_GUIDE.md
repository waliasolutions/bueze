# Büeze.ch Testing Guide

## 🧪 Test Data Population

### Prerequisites
- You must be logged in as an **admin user**
- Navigate to `/test-dashboard` in the application

### How to Populate Test Data

1. **Login as Admin**
   ```
   Email: [your admin email]
   Password: [your admin password]
   ```

2. **Navigate to Test Dashboard**
   - Go to `https://[your-domain]/test-dashboard`
   - Or click "Test Dashboard" in admin menu

3. **Click "Populate Test Data" Button**
   - This will create:
     - ✅ 5 homeowner accounts
     - ✅ 5 handwerker accounts (approved & verified)
     - ✅ 25 leads across all categories
     - ✅ 40+ proposals
     - ✅ Subscriptions for all handwerkers

4. **Wait for Completion**
   - The process takes 30-60 seconds
   - You'll see a success toast with created counts
   - Check the summary for any errors

### Test Accounts Created

#### Homeowners (Clients)
| Email | Name | Password | Phone |
|-------|------|----------|-------|
| homeowner1@test.ch | Max Müller | Test1234! | +41 79 123 45 67 |
| homeowner2@test.ch | Anna Schmidt | Test1234! | +41 79 234 56 78 |
| homeowner3@test.ch | Peter Weber | Test1234! | +41 79 345 67 89 |
| homeowner4@test.ch | Lisa Meyer | Test1234! | +41 79 456 78 90 |
| homeowner5@test.ch | Thomas Fischer | Test1234! | +41 79 567 89 01 |

#### Handwerkers (Craftsmen)
| Email | Name | Company | Category | Location | Password |
|-------|------|---------|----------|----------|----------|
| elektriker@test.ch | Hans Elektro | Elektro Hans GmbH | Electrician | Zürich (8001) | Test1234! |
| maler@test.ch | Maria Farben | Malermeister Farben | Painter | Bern (3011) | Test1234! |
| schreiner@test.ch | Karl Holz | Schreinerei Holz AG | Carpenter | Basel (4051) | Test1234! |
| heizung@test.ch | Stefan Warm | Heizung & Sanitär Warm | Plumber/Heating | Luzern (6003) | Test1234! |
| dachdecker@test.ch | Andreas Dach | Dachdeckerei Dach | Roofer | St. Gallen (9000) | Test1234! |

---

## 🔍 Manual Testing Scenarios

### Scenario 1: Client Journey (Lead Creation to Proposal Acceptance)

1. **Login as Homeowner**
   - Use any homeowner account from above
   - Navigate to dashboard

2. **Create a New Lead**
   - Click "Submit Lead" or "Auftrag erstellen"
   - Fill in details:
     - Category: Electrician
     - Title: "Install new light fixtures"
     - Description: "Need 5 LED fixtures installed in living room"
     - Location: Zürich, 8001
     - Budget: 500-1000 CHF
     - Urgency: Urgent
   - Upload photos (optional)
   - Submit lead

3. **Wait for Proposals**
   - Check dashboard for incoming proposals
   - Receive email notification when handwerkers submit proposals
   - View proposal details

4. **Review and Accept Proposal**
   - Compare proposals
   - Accept one proposal
   - Start conversation with handwerker

5. **Message Handwerker**
   - Send a message
   - Discuss project details
   - Schedule work

### Scenario 2: Handwerker Journey (Browsing to Submitting Proposal)

1. **Login as Handwerker**
   - Use any handwerker account from above
   - Navigate to dashboard

2. **Browse Available Leads**
   - View leads matching your categories
   - Filter by:
     - Location (service areas)
     - Budget range
     - Urgency level
   - View lead details

3. **Submit a Proposal**
   - Click on an interesting lead
   - Review requirements
   - Create proposal:
     - Message: Professional pitch
     - Price range: 800-1200 CHF
     - Estimated duration: 5 days
     - Attachments: Portfolio samples (optional)
   - Submit proposal

4. **Check Proposal Status**
   - Monitor proposal in "My Proposals"
   - Wait for client response
   - Receive notification on acceptance

5. **Communicate with Client**
   - Once accepted, message client
   - Coordinate project details
   - Finalize arrangements

### Scenario 3: Subscription Management

1. **Login as Handwerker**
   - Check current plan on profile/dashboard

2. **View Proposal Limits**
   - See remaining proposals for current period
   - Free plan: 5 proposals/month
   - Check usage counter

3. **Upgrade Subscription** (if payment integration ready)
   - Navigate to subscription settings
   - Choose plan:
     - Monthly: 20 proposals, 49 CHF
     - 6-Month: 30 proposals, 39 CHF/month
     - Annual: Unlimited, 29 CHF/month
   - Complete payment
   - Verify plan activation

### Scenario 4: Admin Tasks

1. **Login as Admin**

2. **Handwerker Verification**
   - Navigate to admin panel
   - Review pending handwerker registrations
   - Check verification documents
   - Approve or reject with reason

3. **Monitor Platform Activity**
   - View recent leads
   - Check proposal statistics
   - Review user activity
   - Manage content

4. **Content Management**
   - Update page content
   - Manage SEO metadata
   - Configure GTM tags
   - Update legal pages

---

## 🧪 Automated Tests

### Running Test Suites

Navigate to `/test-dashboard` → "Test Execution" tab

1. **Registration Tests**
   - Validates user creation
   - Checks role assignment
   - Verifies profile setup

2. **Lead Management Tests**
   - Tests lead creation
   - Validates lead data
   - Checks status transitions

3. **Search Functionality Tests**
   - Tests category filters
   - Validates location search
   - Checks budget range filtering

4. **Handwerker Profile Tests**
   - Validates profile completion
   - Checks verification status
   - Tests service area configuration

### Expected Test Results

All tests should pass with:
- ✅ Registration flow working
- ✅ Lead creation successful
- ✅ Search returning correct results
- ✅ Handwerker profiles properly configured

---

## 🔒 Security Checks

### Pre-Production Checklist

- [x] RLS policies enabled on all tables
- [x] Admin-only access to sensitive operations
- [x] Service role properly secured
- [x] JWT verification on protected endpoints
- [ ] Enable leaked password protection (Supabase dashboard)
- [ ] Reduce OTP expiry to 15-30 minutes
- [ ] Upgrade Postgres to latest version

### Testing Security

1. **Test Unauthorized Access**
   - Try accessing admin pages without login → Should redirect
   - Try accessing other users' data → Should fail
   - Try modifying RLS-protected tables → Should fail

2. **Test Role-Based Access**
   - Handwerkers can't access admin panel
   - Clients can't access handwerker-only features
   - Users can only modify their own data

3. **Test Authentication Flow**
   - Login/logout works correctly
   - Session management proper
   - Password reset functional

---

## 📊 Database Verification

After populating test data, verify in Supabase SQL Editor:

```sql
-- Check total counts
SELECT 
  'profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'leads', COUNT(*) FROM leads
UNION ALL
SELECT 'lead_proposals', COUNT(*) FROM lead_proposals
UNION ALL
SELECT 'handwerker_profiles', COUNT(*) FROM handwerker_profiles
UNION ALL
SELECT 'handwerker_subscriptions', COUNT(*) FROM handwerker_subscriptions;

-- Expected results:
-- profiles: 11+ (6 existing + 5 new)
-- leads: 26+ (1 existing + 25 new)
-- lead_proposals: 40+
-- handwerker_profiles: 8+ (3 existing + 5 new)
-- handwerker_subscriptions: 5+
```

---

## 🐛 Troubleshooting

### "Missing authorization header" Error
- Ensure you're logged in as admin
- Clear browser cache and login again
- Check admin role in user_roles table

### "Failed to populate test data" Error
- Check edge function logs in Supabase
- Verify SUPABASE_SERVICE_ROLE_KEY is set
- Check for duplicate email errors (re-run if accounts exist)

### Proposals Not Creating
- Verify handwerker accounts are approved
- Check subscription status (should be 'active')
- Ensure leads are in 'active' status

### Email Notifications Not Sending
- Check SMTP2GO_API_KEY is configured
- Verify email templates in edge functions
- Check edge function logs for errors

---

## 📧 Email Testing

### Emails to Test

1. **Lead Notification** (to handwerkers)
   - Triggered when: New lead created
   - Recipients: Matching handwerkers
   - Content: Lead details, CTA to view

2. **Proposal Notification** (to client)
   - Triggered when: Handwerker submits proposal
   - Recipients: Lead owner
   - Content: Proposal summary, CTA to review

3. **Acceptance Emails** (both parties)
   - Triggered when: Client accepts proposal
   - Recipients: Both client and handwerker
   - Content: Next steps, contact info

---

## 🚀 Production Readiness Status

### ✅ Completed
- Test data population system (via edge function)
- Admin authentication and role checking
- RLS policies for all core tables
- Subscription management system
- Email notification system
- Security definer functions for role checking

### ⚠️ Manual Configuration Required
- [ ] Enable leaked password protection in Supabase Auth
- [ ] Reduce OTP expiry time
- [ ] Upgrade Postgres version
- [ ] Configure production SMTP settings
- [ ] Set up domain email (info@bueeze.ch)

### 💳 Payment Integration (Ready for Implementation)
- Subscription plans configured
- useSubscription hook ready
- Checkout page exists
- Ready for Stripe/payment provider integration

---

## 📝 Notes

- All test accounts use password: **Test1234!**
- Test data can be repopulated multiple times
- Existing accounts will be skipped (won't duplicate)
- Admin access required for test data population
- Production-ready with proper security measures in place
