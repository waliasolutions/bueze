

# Fix: "Andere E-Mail verwenden" flow is not intuitive

## Root Cause
When the user sees the "E-Mail bereits registriert" login form and changes the email to a new one, clicking "Anmelden" tries to **log in** with that new email (which has no account). The user expected it to **register** with the new email instead. The "Andere E-Mail verwenden" link exists but is small and easy to miss.

## Fix (in `HandwerkerOnboarding.tsx`)

**Auto-detect email change in login form and switch back to registration:**

1. In the login form's email `<Input>` onChange handler (line ~698), detect when `loginEmail` differs from the original `formData.email`. When the user changes it, automatically:
   - Set `showLoginForm(false)` 
   - Update `formData.email` with the new email
   - This returns them to the registration form with the new email pre-filled

2. Concretely: wrap the `setLoginEmail` call with logic:
```typescript
onChange={(e) => {
  const newEmail = e.target.value;
  setLoginEmail(newEmail);
  // If user clears or changes email significantly, switch back to registration
  if (newEmail.trim().toLowerCase() !== formData.email.trim().toLowerCase()) {
    // Debounce or trigger on blur — for now, add a visible "Neue E-Mail registrieren" button
  }
}}
```

3. **Better approach**: Make "Andere E-Mail verwenden" more prominent — change it from a small text link to a full-width outline `<Button>` with clear labeling like "Mit anderer E-Mail registrieren". When clicked, it already calls `setShowLoginForm(false)` but should also clear/update `formData.email` so the user can type a new one.

4. Apply the same pattern to `SubmitLead.tsx` for consistency (line ~784, "Zurück zur Registrierung" button).

## Files Changed
- `src/pages/HandwerkerOnboarding.tsx` — Make "Andere E-Mail verwenden" a prominent button + pre-fill registration form with changed email
- `src/pages/SubmitLead.tsx` — Same pattern for consistency

## No database or edge function changes needed.

