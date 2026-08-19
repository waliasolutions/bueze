Edit the access-credentials support email for Edgar Mkrtchyan (and all future support emails) so it clearly states that technical support is currently only available in German and English.

Scope
- Update the support paragraph in `src/lib/supportEmails.ts` (SSOT for manual admin support emails) to explicitly mention that technical support is only possible in German and English at this time.
- Keep the existing Büeze CI email format (SMTP2GO, `emailWrapper()`), BCC to `info@walia-solutions.ch`, and the current password/login instructions.
- Do not change the edge function; only the email body content changes.

Verification
- Confirm the edited text is present in `src/lib/supportEmails.ts`.
- Run typecheck to ensure no TS regressions.