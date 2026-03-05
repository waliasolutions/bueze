

# Plan v5.2 — B1 Fix Refined (Schema Timing Verified)

## Verification Result

The user's concern is valid and important. After guest account creation at Step 1:
- Line 418: `setIsAuthenticated(true)` — state changes
- Line 427: `setStep(2)` — component stays mounted, no remount
- Line 157: `useForm({ resolver: zodResolver(leadSchema) })` — resolver bound once at mount

If we use `useMemo(() => createLeadSchema(!!user), [user])`, the schema object changes when auth state changes, but **React Hook Form does not re-read the resolver after mount**. The `zodResolver(schema)` closure captures the initial schema. A `useMemo`-based swap would silently fail — the old (guest) schema would still run on final submit, which actually works fine for guests-turned-authenticated (contact fields are filled), but the architectural intent would be wrong.

## Corrected B1 Implementation

**Use `startedAsGuest` instead of reactive auth state.** The component already tracks this (line 188: `setStartedAsGuest(!user)`), set once at mount and never changed. This is the correct discriminator:

```typescript
function createLeadSchema(isGuest: boolean) {
  return z.object({
    // ... non-contact fields unchanged ...
    contactEmail: z.string().default(''),
    contactPhone: z.string().optional().default(''),
    contactFirstName: z.string().default(''),
    contactLastName: z.string().default(''),
    contactPassword: z.string().default(''),
    website: z.string().max(0, 'Spam erkannt').optional().default(''),
  })
  .refine(/* existing budget refine */)
  .superRefine((data, ctx) => {
    // Guest validation: contact fields required.
    // These are also validated per-field in handleCreateAccountAndProceed
    // via form.trigger(). This superRefine is a safety net for final submit.
    if (!isGuest) return; // Authenticated at mount — no contact fields needed

    if (!data.contactEmail || !z.string().email().safeParse(data.contactEmail).success) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Gültige E-Mail erforderlich', path: ['contactEmail'] });
    }
    if (!data.contactFirstName) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Vorname ist erforderlich', path: ['contactFirstName'] });
    }
    if (!data.contactLastName) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Nachname ist erforderlich', path: ['contactLastName'] });
    }
    if (!data.contactPassword || data.contactPassword.length < PASSWORD_MIN_LENGTH) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Passwort mind. ${PASSWORD_MIN_LENGTH} Zeichen`, path: ['contactPassword'] });
    }
  });
}
```

Schema created once at component init, not reactively:

```typescript
// Determine auth state synchronously from session cache for schema creation
const initialUser = supabase.auth.getSession(); // sync check not possible — see below
```

**Problem**: `supabase.auth.getSession()` is async. At line 157, `useForm` runs synchronously. We can't await auth state before creating the form.

**Solution**: Use a two-phase approach:
1. Schema always uses `superRefine` with a **ref** for the auth flag (not state)
2. The ref is set once on mount and read at validation time (closure over ref, not over value)

```typescript
const isAuthenticatedRef = useRef(false);

// Set once on mount (line 183-191 already does this)
useEffect(() => {
  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    isAuthenticatedRef.current = !!user;
    setIsAuthenticated(!!user);
    setStartedAsGuest(!user);
  };
  checkAuth();
}, []);

// Schema reads ref at validation time, not at creation time
const leadSchema = useMemo(() => z.object({
  // ... all fields with .default('') for contact fields ...
})
.refine(/* budget */)
.superRefine((data, ctx) => {
  if (isAuthenticatedRef.current) return;
  // ... guest validation ...
}), []); // Empty deps — created once, reads ref dynamically

const form = useForm<LeadFormData>({
  resolver: zodResolver(leadSchema),
  // ...
});
```

This way:
- Schema created once (no resolver rebinding issue)
- `superRefine` reads `isAuthenticatedRef.current` at validation time
- Guest who creates account at Step 1: ref flips to `true`, subsequent `form.handleSubmit` skips contact validation
- Already-authenticated user: ref is `true` from mount, contact validation never runs
- No `useMemo` dependency on `user` — no stale resolver problem

### Comment block for the schema:

```typescript
/**
 * DUAL VALIDATION STRATEGY:
 * - Guest users: Contact fields validated via superRefine (isAuthenticatedRef=false)
 *   AND per-field via form.trigger() in handleCreateAccountAndProceed (Step 1).
 *   After account creation, isAuthenticatedRef flips to true — subsequent
 *   form.handleSubmit() skips contact validation.
 * - Authenticated users: isAuthenticatedRef is true from mount. Contact fields
 *   use .default('') and superRefine skips them entirely.
 *
 * WHY a ref instead of useMemo: React Hook Form binds the resolver once at mount.
 * A useMemo-based schema swap doesn't propagate to the resolver. The ref is read
 * at validation time (inside superRefine closure), so it always reflects current state.
 */
```

## Other Phase 0 Fixes (unchanged)

- **B2**: Dashboard name bug — template literal with fallbacks
- **B3**: ProposalReview `pt-24` for fixed header
- **B4**: Dashboard redirect respects ViewMode

## Files Changed in Phase 0

| File | Change |
|------|--------|
| `src/pages/SubmitLead.tsx` | Schema factory with ref-based superRefine |
| `src/pages/Dashboard.tsx` | Name bug fix + ViewMode redirect |
| `src/pages/ProposalReview.tsx` | `pt-24 pb-8` on 3 main elements |

## Remaining Phases — unchanged from v5.1

