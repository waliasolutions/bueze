import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { Navigate } from "react-router-dom";

type Mode = "dry-run" | "apply";
type Bucket = "lead-media" | "handwerker-portfolio";

const BUCKETS: Bucket[] = ["lead-media", "handwerker-portfolio"];

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(2)} ${units[i]}`;
}

export default function ImageBackfill() {
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});

  const run = async (bucket: Bucket, mode: Mode, limit: number) => {
    const key = `${bucket}:${mode}`;
    setLoading(key);
    try {
      const { data, error } = await supabase.functions.invoke("backfill-image-compression", {
        body: { bucket, mode, limit },
      });
      if (error) throw error;
      setResults((r) => ({ ...r, [bucket]: data }));
      toast.success(`${bucket} · ${mode}: ${data?.examined ?? 0} geprüft, ${data?.compressed ?? 0} komprimiert`);
    } catch (e: any) {
      toast.error(e?.message || "Fehler beim Backfill");
      setResults((r) => ({ ...r, [bucket]: { error: e?.message || String(e) } }));
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Bild-Backfill (WebP-Kompression)</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Rekomprimiert bestehende JPEG/PNG-Bilder in Storage zu WebP (Q=0.85, max 1920 px).
          Datenbank-Referenzen bleiben unverändert (Overwrite in-place).
        </p>
      </div>

      {BUCKETS.map((bucket) => {
        const res = results[bucket];
        return (
          <Card key={bucket}>
            <CardHeader>
              <CardTitle className="text-lg">{bucket}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  disabled={loading !== null}
                  onClick={() => run(bucket, "dry-run", 10)}
                >
                  {loading === `${bucket}:dry-run` && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Dry-Run (10)
                </Button>
                <Button
                  disabled={loading !== null}
                  onClick={() => run(bucket, "apply", 25)}
                >
                  {loading === `${bucket}:apply` && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Apply (25)
                </Button>
                <Button
                  variant="secondary"
                  disabled={loading !== null}
                  onClick={() => run(bucket, "apply", 50)}
                >
                  {loading === `${bucket}:apply` && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Apply (50)
                </Button>
              </div>

              {res && (
                <div className="rounded border bg-muted/40 p-3 text-sm space-y-1">
                  {res.error ? (
                    <div className="text-destructive">Fehler: {res.error}</div>
                  ) : (
                    <>
                      <div>Geprüft: <strong>{res.examined ?? 0}</strong></div>
                      <div>Komprimiert: <strong>{res.compressed ?? 0}</strong></div>
                      <div>Übersprungen: <strong>{res.skipped ?? 0}</strong></div>
                      <div>Fehler: <strong>{res.errors ?? 0}</strong></div>
                      <div>Vorher: <strong>{formatBytes(res.total_before_bytes ?? 0)}</strong></div>
                      <div>Nachher: <strong>{formatBytes(res.total_after_bytes ?? 0)}</strong></div>
                      <div className="text-primary">
                        Ersparnis: <strong>{formatBytes(res.estimated_savings_bytes ?? 0)}</strong>
                      </div>
                    </>
                  )}
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-muted-foreground">JSON</summary>
                    <pre className="mt-2 text-xs overflow-x-auto">{JSON.stringify(res, null, 2)}</pre>
                  </details>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      <p className="text-xs text-muted-foreground">
        Tipp: Apply so oft ausführen bis „Geprüft: 0" erscheint — dann ist der Bucket fertig konvertiert.
      </p>
    </div>
  );
}
