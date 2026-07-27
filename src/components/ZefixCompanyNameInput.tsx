import { useCallback, useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
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

/**
 * Company name field with Handelsregister (Zefix) autocomplete — SSOT UI for
 * every company lookup. Typing suggests matching companies; the refresh button
 * re-runs the lookup for an already-filled name (e.g. to pull in a missing
 * UID) and applies a unique match straight away.
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

  // Only values the user typed trigger suggestions — a value written back by
  // onSelect (or loaded from the profile) must not reopen the dropdown.
  const typedValue = useRef<string | null>(null);
  // Guards against a slow response overwriting the results of a newer query.
  const latestQuery = useRef('');

  const apply = useCallback(
    async (company: ZefixCompany) => {
      setResults([]);
      setNotFound(false);
      typedValue.current = null;

      // Search hits carry no address — fetch the full record before filling the form.
      if (company.uid && !company.street) {
        setIsBusy(true);
        try {
          onSelect((await getZefixCompany(company.uid)) ?? company);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Firmendaten konnten nicht geladen werden');
        } finally {
          setIsBusy(false);
        }
      } else {
        onSelect(company);
      }
    },
    [onSelect],
  );

  const runSearch = useCallback(
    async (query: string, { manual }: { manual: boolean }) => {
      latestQuery.current = query;
      setIsBusy(true);
      setError(null);
      setNotFound(false);

      try {
        const companies = await searchZefixCompanies(query);
        if (latestQuery.current !== query) return;

        // An explicit lookup with exactly one hit needs no picking.
        if (manual && companies.length === 1) {
          await apply(companies[0]);
          return;
        }

        setResults(companies);
        setNotFound(manual && companies.length === 0);
      } catch (err) {
        if (latestQuery.current !== query) return;
        setResults([]);
        setError(err instanceof Error ? err.message : 'Suche fehlgeschlagen');
      } finally {
        if (latestQuery.current === query) setIsBusy(false);
      }
    },
    [apply],
  );

  useEffect(() => {
    const trimmed = value.trim();

    if (typedValue.current !== value || trimmed.length < MIN_QUERY_LENGTH) {
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
    onChange(next);
  };

  const canLookUp = value.trim().length >= MIN_QUERY_LENGTH;

  return (
    <div className={className}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            id={id}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete="off"
            className={inputClassName}
          />
          {isBusy && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={disabled || isBusy || !canLookUp}
          onClick={() => runSearch(value.trim(), { manual: true })}
          title="Im Handelsregister suchen"
          aria-label="Im Handelsregister suchen"
          className={cn('shrink-0', inputClassName)}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
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

      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}

      {notFound && !error && (
        <p className="mt-1 text-sm text-muted-foreground">
          Kein Eintrag im Handelsregister gefunden. Daten bitte manuell erfassen.
        </p>
      )}
    </div>
  );
}
