-- Update site_seo_settings with current robots.txt content
UPDATE site_seo_settings
SET robots_txt = 'User-agent: *
Allow: /

# Disallow authentication and account pages
Disallow: /auth
Disallow: /reset-password

# Disallow admin panel
Disallow: /admin/

# Disallow user dashboards
Disallow: /dashboard
Disallow: /handwerker-dashboard

# Disallow transactional pages
Disallow: /submit-lead
Disallow: /browse-leads
Disallow: /lead-details/
Disallow: /edit-lead/
Disallow: /opportunity-view/

# Disallow messaging
Disallow: /messages
Disallow: /conversations

# Disallow account management
Disallow: /profile
Disallow: /handwerker-profile-edit
Disallow: /handwerker-onboarding

# Disallow payment flow
Disallow: /checkout

# Disallow proposals management
Disallow: /proposals-management
Disallow: /proposal-review/

# Disallow test pages
Disallow: /test-dashboard

# Disallow API endpoints
Disallow: /api/

Sitemap: https://bueeze.ch/sitemap.xml',
    updated_at = now()
WHERE id = (SELECT id FROM site_seo_settings LIMIT 1);

-- Insert default settings if none exist
INSERT INTO site_seo_settings (robots_txt)
SELECT 'User-agent: *
Allow: /

# Disallow authentication and account pages
Disallow: /auth
Disallow: /reset-password

# Disallow admin panel
Disallow: /admin/

# Disallow user dashboards
Disallow: /dashboard
Disallow: /handwerker-dashboard

# Disallow transactional pages
Disallow: /submit-lead
Disallow: /browse-leads
Disallow: /lead-details/
Disallow: /edit-lead/
Disallow: /opportunity-view/

# Disallow messaging
Disallow: /messages
Disallow: /conversations

# Disallow account management
Disallow: /profile
Disallow: /handwerker-profile-edit
Disallow: /handwerker-onboarding

# Disallow payment flow
Disallow: /checkout

# Disallow proposals management
Disallow: /proposals-management
Disallow: /proposal-review/

# Disallow test pages
Disallow: /test-dashboard

# Disallow API endpoints
Disallow: /api/

Sitemap: https://bueeze.ch/sitemap.xml'
WHERE NOT EXISTS (SELECT 1 FROM site_seo_settings);