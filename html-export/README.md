# HTML/CSS/JS Export - Büeze.ch

This folder contains a static HTML/CSS/JS version of the entire Büeze.ch application, designed for rebuilding in Laravel or other backend frameworks.

## Structure

```
html-export/
├── index.html              # Main landing page
├── css/
│   ├── design-system.css   # Color scheme, typography, design tokens
│   ├── components.css      # Reusable component styles
│   └── pages.css          # Page-specific styles
├── js/
│   ├── main.js            # Global scripts, navigation
│   ├── components.js      # Interactive components
│   └── mock-data.js       # Sample data for demos
├── pages/
│   ├── public/
│   │   ├── kategorien.html
│   │   ├── handwerker.html
│   │   ├── pricing.html
│   │   └── agb.html
│   └── app/
│       ├── dashboard.html
│       ├── browse-leads.html
│       ├── submit-lead.html
│       ├── lead-details.html
│       ├── profile.html
│       ├── messages.html
│       └── conversations.html
└── assets/
    └── (copy images from src/assets/)
```

## Features

- **No Authentication Logic**: All pages show UI only, ready for backend integration
- **Mock Data**: Sample data included for demonstration
- **Responsive Design**: Mobile-first, works on all screen sizes
- **Design System**: Consistent colors, typography, spacing
- **Swiss Timezone**: All time displays use CET/CEST
- **Icons**: Using Lucide icons via CDN

## Usage

1. **View locally**: Open any HTML file in a browser
2. **Laravel Integration**: Use these as Blade template references
3. **Styling**: All design tokens are in `design-system.css`
4. **Components**: Reusable UI components in `components.css`

## Notes for Laravel Migration

- Replace mock data with Laravel models
- Add authentication guards and middleware
- Implement form validation with Laravel
- Connect to database instead of mock data
- Add CSRF protection to all forms
- Implement file upload handling
- Add email notifications
- Set up proper routing
