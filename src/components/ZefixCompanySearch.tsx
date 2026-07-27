import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, ShieldCheck } from 'lucide-react';
import { getZefixCompany, searchZefixCompanies, type ZefixCompany } from '@/lib/zefix';

interface ZefixCompanySearchProps {
  /** Called with the full Zefix record once the user picks a result. */
  onSelect: (company: ZefixCompany) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
}

const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 500;

/**
 * Handelsregister (Zefix) company search — SSOT UI for looking up a Swiss
 * company by name or UID. Used in registration and in every profile editor.
 */
export function ZefixCompanySearch({
  onSelect,
  label = 'Firma im Handelsregister suchen',
  placeholder = 'Firmenname oder UID (CHE-123.456.789)',
  disabled = false,
  className,
  inputClassName,
}: ZefixCompanySearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ZefixCompany[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectingUid, setSelectingUid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const inputId = useId();

  // Guards against a slow response overwriting the results of a newer query.
  const latestQuery = useRef('');

  useEffect(() => {
    const trimmed = query.trim();
    latestQuery.current = trimmed;

    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setHasSearched(false);
      setError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setError(null);
      try {
        const companies = await searchZefixCompanies(trimmed);
        if (latestQuery.current !== trimmed) return;
        setResults(companies);
        setHasSearched(true);
      } catch (err) {
        if (latestQuery.current !== trimmed) return;
        setResults([]);
        setError(err instanceof Error ? err.message : 'Suche fehlgeschlagen');
      } finally {
        if (latestQuery.current === trimmed) setIsSearching(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = useCallback(
    async (company: ZefixCompany) => {
      setError(null);

      // Search hits carry no address — fetch the full record before filling the form.
      if (company.uid && !company.street) {
        setSelectingUid(company.uid);
        try {
          const full = await getZefixCompany(company.uid);
          onSelect(full ?? company);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Firmendaten konnten nicht geladen werden');
          return;
        } finally {
          setSelectingUid(null);
        }
      } else {
        onSelect(company);
      }

      setQuery('');
      setResults([]);
      setHasSearched(false);
    },
    [onSelect],
  );

  return (
    <div className={className}>
      <Label htmlFor={inputId} className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-primary" />
        {label}
      </Label>

      <div className="relative mt-2">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={inputId}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          className={`pl-9 ${inputClassName ?? ''}`}
        />
        {(isSearching || selectingUid) && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      <p className="mt-1 text-xs text-muted-foreground">
        Firmendaten werden direkt aus dem Schweizerischen Handelsregister übernommen.
      </p>

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

      {results.length > 0 && (
        <ul className="mt-2 max-h-64 divide-y overflow-y-auto rounded-md border bg-background">
          {results.map((company) => (
            <li key={company.ehraid ?? company.uid ?? company.name}>
              <button
                type="button"
                onClick={() => handleSelect(company)}
                disabled={selectingUid !== null}
                className="w-full px-3 py-2 text-left transition-colors hover:bg-muted disabled:opacity-60"
              >
                <span className="flex items-center gap-2">
                  <span className="text-sm font-medium">{company.name}</span>
                  {!company.isActive && (
                    <Badge variant="outline" className="text-xs">
                      Gelöscht
                    </Badge>
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

      {hasSearched && !isSearching && results.length === 0 && !error && (
        <p className="mt-2 text-sm text-muted-foreground">
          Keine Einträge im Handelsregister gefunden. Sie können die Daten manuell erfassen.
        </p>
      )}
    </div>
  );
}
