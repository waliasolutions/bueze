import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Check,
  Search,
  Building2,
  RefreshCw,
  AlertCircle,
  SearchX,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getZefixCompany, searchZefixCompanies, type ZefixCompany } from '@/lib/zefix';

interface ZefixCompanyNameInputProps {
  /** The company name — this input *is* the company name field. */
  value: string;
  onChange: (value: string) => void;
  /** Called with the full Zefix record once a suggestion is applied. */
  onSelect: (company: ZefixCompany) => void;
  /** Notifies the parent while a Zefix request is in flight, so it can gate
   *  Rechtsform/UID inputs and show a skeleton. */
  onBusyChange?: (busy: boolean) => void;
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

/** Highlight matching substring in a suggestion. */
function highlightMatch(text: string, query: string) {
  const q = query.trim();
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-primary/15 text-foreground rounded-sm px-0.5">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

/**
 * Company name field with Handelsregister (Zefix) autocomplete — SSOT UI for
 * every company lookup.
 */
export function ZefixCompanyNameInput({
  value,
  onChange,
  onSelect,
  onBusyChange,
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
  const [isFocused, setIsFocused] = useState(false);

  // Only values the user typed trigger suggestions.
  const typedValue = useRef<string | null>(null);
  // Guards against a slow response overwriting the results of a newer query.
  const latestQuery = useRef('');
  const chipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (chipTimer.current) clearTimeout(chipTimer.current);
    };
  }, []);

  useEffect(() => {
    onBusyChange?.(isBusy);
  }, [isBusy, onBusyChange]);

  const flashSuccess = useCallback(() => {
    setJustApplied(true);
    if (chipTimer.current) clearTimeout(chipTimer.current);
    chipTimer.current = setTimeout(() => setJustApplied(false), SUCCESS_CHIP_MS);
  }, []);

  const apply = useCallback(
    async (company: ZefixCompany) => {
      setResults([]);
      setNotFound(false);
      setError(null);
      typedValue.current = null;

      onSelect(company);
      flashSuccess();

      if (company.uid && !company.street) {
        try {
          const full = await getZefixCompany(company.uid);
          if (full) onSelect(full);
        } catch {
          // optimistic apply already succeeded
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

        if (manual && companies.length === 1) {
          await apply(companies[0]);
          return;
        }

        setResults(companies);
        setNotFound(companies.length === 0);
      } catch (err) {
        if (latestQuery.current !== query) return;
        setError(err instanceof Error ? err.message : 'Suche fehlgeschlagen');
      } finally {
        if (latestQuery.current === query) setIsBusy(false);
      }
    },
    [apply],
  );

  useEffect(() => {
    const trimmed = value.trim();
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

  const trimmed = value.trim();
  const canLookUp = trimmed.length >= MIN_QUERY_LENGTH;
  const charsMissing = Math.max(0, MIN_QUERY_LENGTH - trimmed.length);
  const showResults = results.length > 0;
  const showSkeleton = isBusy && results.length === 0 && !error;

  const helperText = useMemo(() => {
    if (justApplied || error || notFound || isBusy || !trimmed || charsMissing === 0) return null;
    return `Noch ${charsMissing} Zeichen für die Handelsregister-Suche…`;
  }, [justApplied, error, notFound, isBusy, trimmed, charsMissing]);

  return (
    <div className={className}>
      {/* Input with leading search icon + trailing status */}
      <div
        className={cn(
          'relative rounded-md transition-shadow',
          isFocused && 'ring-2 ring-ring/40 ring-offset-0',
        )}
      >
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          id={id}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            onBlur?.();
          }}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          aria-busy={isBusy}
          aria-describedby={id ? `${id}-hint` : undefined}
          className={cn('pl-9 pr-10', inputClassName)}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isBusy ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-label="Suche läuft" />
          ) : justApplied ? (
            <Check className="h-4 w-4 text-emerald-600" aria-label="Übernommen" />
          ) : null}
        </div>
      </div>

      {/* Status / helper row */}
      <div
        id={id ? `${id}-hint` : undefined}
        className="min-h-[1.5rem] mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1"
      >
        {justApplied && (
          <Badge
            variant="outline"
            className="border-emerald-200 bg-emerald-50 text-emerald-700 gap-1"
          >
            <ShieldCheck className="h-3 w-3" />
            Aus Handelsregister übernommen
          </Badge>
        )}

        {isBusy && !justApplied && (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Handelsregister wird abgefragt…
          </span>
        )}

        {!isBusy && !justApplied && canLookUp && results.length === 0 && !notFound && !error && typedValue.current === null && (
          <button
            type="button"
            onClick={() => runSearch(trimmed, { manual: true })}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-2 hover:underline"
          >
            <RefreshCw className="h-3 w-3" />
            Handelsregister neu abfragen
          </button>
        )}

        {error && (
          <span className="inline-flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-sm text-destructive">
              <AlertCircle className="h-3.5 w-3.5" />
              Handelsregister nicht erreichbar — {error}
            </span>
            <button
              type="button"
              onClick={() => runSearch(trimmed, { manual: true })}
              disabled={isBusy || !canLookUp}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-2 hover:underline disabled:opacity-50"
            >
              <RefreshCw className="h-3 w-3" />
              Erneut versuchen
            </button>
          </span>
        )}

        {notFound && !error && (
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <SearchX className="h-4 w-4" />
            Kein Treffer — andere Schreibweise versuchen (z.&nbsp;B. mit Bindestrich) oder Daten manuell erfassen.
          </span>
        )}

        {helperText && (
          <span className="text-xs text-muted-foreground">{helperText}</span>
        )}
      </div>

      {/* Suggestions dropdown */}
      {(showResults || showSkeleton) && (
        <div className="relative mt-2">
          <div className="overflow-hidden rounded-lg border bg-popover shadow-lg">
            <div className="flex items-center justify-between border-b bg-muted/40 px-3 py-1.5">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" />
                Schweizerisches Handelsregister
              </span>
              {showResults && (
                <span className="text-xs text-muted-foreground">
                  {results.length} Treffer
                </span>
              )}
            </div>

            {showSkeleton ? (
              <ul className="divide-y">
                {[0, 1, 2].map((i) => (
                  <li key={i} className="flex items-center gap-3 px-3 py-2.5">
                    <div className="h-8 w-8 shrink-0 rounded-md bg-muted animate-pulse" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
                      <div className="h-2.5 w-1/2 rounded bg-muted/70 animate-pulse" />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="max-h-72 divide-y overflow-y-auto">
                {results.map((company) => (
                  <li key={company.ehraid ?? company.uid ?? company.name}>
                    <button
                      type="button"
                      onClick={() => apply(company)}
                      disabled={isBusy}
                      className="group flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-60"
                    >
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary group-hover:bg-primary/15">
                        <Building2 className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-1.5">
                          <span className="truncate text-sm font-medium">
                            {highlightMatch(company.name, trimmed)}
                          </span>
                          {!company.isActive && (
                            <Badge variant="outline" className="text-[10px] font-normal">
                              Gelöscht
                            </Badge>
                          )}
                        </span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                          {company.uid && (
                            <span className="font-mono">{company.uid}</span>
                          )}
                          {company.legalSeat && (
                            <span className="inline-flex items-center gap-1">
                              <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                              {company.legalSeat}
                            </span>
                          )}
                        </span>
                      </span>
                      <span className="mt-1 hidden text-[10px] font-medium uppercase tracking-wide text-primary opacity-0 transition-opacity group-hover:opacity-100 sm:block">
                        Übernehmen
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="border-t bg-muted/30 px-3 py-1.5 text-[10px] text-muted-foreground">
              Daten live aus zefix.ch — Auswahl übernimmt Firma, UID und Adresse.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
