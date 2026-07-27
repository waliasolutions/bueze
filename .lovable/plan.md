## Smooth out the Zefix company lookup UI

The lookup works correctly, but the interaction has three visible pain points captured in the session replay:

1. **Dropdown collapses on every keystroke.** `ZefixCompanyNameInput` clears `results` on every character while debouncing, so the suggestion list flickers open/closed between typed letters.
2. **Two spinners back-to-back.** After picking a match, the component runs a second detail fetch (to get the address) before firing `onSelect`. The user sees spinner → dropdown gone → spinner again → toast.
3. **Refresh button flickers.** The adjacent icon button toggles `disabled` on every search cycle (this is the `1607` disabling in the replay), which reads as "something broke" next to the input.
4. **Silent zero-results while typing.** A query with a space (`quellenhof stiftung`) returns nothing from Zefix; the user has to guess to add the hyphen because nothing tells them the auto-search ran.

### Fix (frontend only, `src/components/ZefixCompanyNameInput.tsx`)

1. **Stop clearing results mid-typing.** Only replace the dropdown when the next search resolves (success or explicit no-results). Between keystrokes the previous list stays visible under the spinner, so there's no collapse/reopen.
2. **Optimistic apply on click.** Fill the form immediately with the fields the search hit already carries (`name`, `uid`, `legalFormName`, `legalSeat`), close the dropdown, then upgrade with the full record (`street`, `zip`, `city`) in the background. The visible result: one spinner cycle at most, no gap between click and filled form.
3. **Quieter refresh button.** Move the manual re-lookup into a subtle text link ("Handelsregister neu abfragen") shown only when the field already has a value and no dropdown is open — removes the flexed button that visibly disables/enables on each keystroke. Layout stays stable.
4. **Inline hint for zero results while typing.** When debounced search returns no companies, show a soft "Kein Treffer — versuchen Sie eine andere Schreibweise (z. B. mit Bindestrich)" under the input. Currently that hint only appears for the manual button.
5. **Success chip.** After a successful apply, render a small green "Aus Handelsregister übernommen ✓" chip next to the field for ~3s so the transition has a clear endpoint (complements the existing toast, doesn't replace it).
6. **Reserve vertical space** for the hint/dropdown container (`min-h`) so surrounding form fields don't jump when the dropdown opens.

No changes to `src/lib/zefix.ts`, the edge function, or the onboarding page's data flow. `onSelect(company)` is still called exactly once per pick.

### Verification

- Load `/handwerker-onboarding`, type `quellenhof stiftung` slowly — dropdown should not close between letters, and a "kein Treffer, Bindestrich versuchen" hint should show.
- Type `quellenhof-stiftung`, click the result — form fills once, no second spinner, chip appears next to the field.
- Check same behavior in the three other consumers (`HandwerkerProfileEdit`, `admin/HandwerkerEditDialog`, admin `HandwerkerManagement`) — same component, no per-caller code changes needed.
