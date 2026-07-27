import { useCallback, useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getZefixCompany, searchZefixCompanies, type ZefixCompany } from '@/lib/zefix';

interface ZefixCompanyNameInputProps {
  /** The company name — this input *is* the company name field. */
  value: string;
  onChange: (value: string) => void;
  /** Called with the full Zefix record once a suggestion is applied. */
  onSelect: (company: ZefixCompany) => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  onBlur?: () => void;
  className?: string;
  inputClassName?: string;
}

const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 500;
const SUCCESS_CHIP_MS = 3000;

/**
 * Company name field with Handelsregister (Zefix) autocomplete — SSOT UI for
 * every company lookup. Typing suggests matching companies; a subtle text link
 * lets the user re-run the lookup manually (e.g. to pull in a missing UID).
 *
 * Used by registration, the handwerker profile editor and both admin editors.
 */
export function ZefixCompanyNameInput({
  value,
  onChange,
  onSelect,
  id,
  placeholder = 'z.B. Muster Handwerk GmbH',
  disabled = false,
  onBlur,
  className,
  inputClassName,
}: ZefixCompanyNameInputProps) {
  const [results, setResults] = useState<ZefixCompany[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [justApplied, setJustApplied] = useState(false);

  // Only values the user typed trigger suggestions — a value written back by
  // onSelect (or loaded from the profile) must not reopen the dropdown.
  const typedValue = useRef<string | null>(null);
  // Guards against a slow response overwriting the results of a newer query.
  const latestQuery = useRef('');
  const chipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (chipTimer.current) clearTimeout(chipTimer.current);
    };
  }, []);

  const flashSuccess = useCallback(() => {
    setJustApplied(true);
    if (chipTimer.current) clearTimeout(chipTimer.current);
    chipTimer.current = setTimeout(() => setJustApplied(false), SUCCESS_CHIP_MS);
  }, []);

  const apply = useCallback(
    async (company: ZefixCompany) => {
      // Close dropdown and stop treating current value as "typed" immediately.
      setResults([]);
      setNotFound(false);
      setError(null);
      typedValue.current = null;

      // Optimistic: hand the caller what we already have so the form fills now.
      onSelect(company);
      flashSuccess();

      // Silently upgrade with the full record (address) in the background.
      if (company.uid && !company.street) {
        try {
          const full = await getZefixCompany(company.uid);
          if (full) onSelect(full);
        } catch {
          // The optimistic apply already succeeded — a failed detail fetch is
          // not worth surfacing an error for.
        }
      }
    },
    [onSelect, flashSuccess],
  );

  const runSearch = useCallback(
    async (query: string, { manual }: { manual: boolean }) => {
      latestQuery.current = query;
      setIsBusy(true);
      setError(null);

      try {
        const companies = await searchZefixCompanies(query);
        if (latestQuery.current !== query) return;

        // An explicit lookup with exactly one hit needs no picking.
        if (manual && companies.length === 1) {
          await apply(companies[0]);
          return;
        }

        setResults(companies);
        setNotFound(companies.length === 0);
      } catch (err) {
        if (latestQuery.current !== query) return;
        // Don't wipe the previous results on a transient error — keep them
        // visible so the dropdown doesn't collapse.
        setError(err instanceof Error ? err.message : 'Suche fehlgeschlagen');
      } finally {
        if (latestQuery.current === query) setIsBusy(false);
      }
    },
    [apply],
  );

  useEffect(() => {
    const trimmed = value.trim();

    // Only auto-search values the user typed. Don't clear the current dropdown
    // between keystrokes — a stale list under the spinner beats a flicker.
    if (typedValue.current !== value) return;

    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setNotFound(false);
      return;
    }

    const timer = setTimeout(() => runSearch(trimmed, { manual: false }), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value, runSearch]);

  const handleChange = (next: string) => {
    typedValue.current = next;
    setError(null);
    setJustApplied(false);
    onChange(next);
  };

  const canLookUp = value.trim().length >= MIN_QUERY_LENGTH;
  const showManualLink =
    !disabled && canLookUp && results.length === 0 && !isBusy && typedValue.current === null;

  return (
    <div className={className}>
      <div className="relative">
        <Input
          id={id}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          className={cn('pr-10', inputClassName)}
        />
        {isBusy ? (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : justApplied ? (
          <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600" />
        ) : null}
      </div>

      <div className="min-h-[1.25rem] mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
        {justApplied && (
          <Badge
            variant="outline"
            className="border-emerald-200 bg-emerald-50 text-emerald-700 gap-1"
          >
            <Check className="h-3 w-3" />
            Aus Handelsregister übernommen
          </Badge>
        )}

        {showManualLink && !justApplied && (
          <button
            type="button"
            onClick={() => runSearch(value.trim(), { manual: true })}
            className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Handelsregister neu abfragen
          </button>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {notFound && !error && (
          <p className="text-sm text-muted-foreground">
            Kein Treffer im Handelsregister — bitte andere Schreibweise versuchen (z.&nbsp;B. mit Bindestrich) oder Daten manuell erfassen.
          </p>
        )}
      </div>

      {results.length > 0 && (
        <ul className="mt-2 max-h-64 divide-y overflow-y-auto rounded-md border bg-background shadow-sm">
          {results.map((company) => (
            <li key={company.ehraid ?? company.uid ?? company.name}>
              <button
                type="button"
                onClick={() => apply(company)}
                disabled={isBusy}
                className="w-full px-3 py-2 text-left transition-colors hover:bg-muted disabled:opacity-60"
              >
                <span className="flex items-center gap-2">
                  <span className="text-sm font-medium">{company.name}</span>
                  {!company.isActive && (
                    <Badge variant="outline" className="text-xs">Gelöscht</Badge>
                  )}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {[company.uid, company.legalSeat].filter(Boolean).join(' · ')}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
