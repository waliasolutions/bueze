import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { Navigate } from "react-router-dom";
import { compressToWebP } from "@/lib/imageCompressor";

type Mode = "dry-run" | "apply";
type Bucket = "lead-media" | "handwerker-portfolio";

const BUCKETS: Bucket[] = ["lead-media", "handwerker-portfolio"];
// Progressive attempts: try higher quality first, then step down and/or shrink,
// so we only skip images that truly cannot be improved.
const COMPRESSION_ATTEMPTS: Array<{ quality: number; maxWidth: number }> = [
  { quality: 0.85, maxWidth: 1920 },
  { quality: 0.8, maxWidth: 1920 },
  { quality: 0.75, maxWidth: 1800 },
  { quality: 0.7, maxWidth: 1600 },
  { quality: 0.65, maxWidth: 1400 },
  { quality: 0.6, maxWidth: 1280 },
  { quality: 0.55, maxWidth: 1200 },
];

async function bestCompressedWebP(file: File, originalSize: number): Promise<File> {
  let best: File = file;
  for (const { quality, maxWidth } of COMPRESSION_ATTEMPTS) {
    const attempt = await compressToWebP(file, quality, maxWidth);
    if (attempt.type === "image/webp" && attempt.size < originalSize && attempt.size < best.size) {
      best = attempt;
    }
  }
  return best;
}

type Candidate = {
  name: string;
  size: number;
  mimetype: string;
  created_at?: string;
};

type BackfillResult = {
  path: string;
  originalSize?: number;
  newSize?: number;
  action: "would_replace" | "replaced" | "skipped_larger" | "skipped_not_candidate" | "failed";
  error?: string;
};

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

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? "").split(",").pop() ?? "");
    reader.onerror = () => reject(reader.error ?? new Error("Datei konnte nicht gelesen werden"));
    reader.readAsDataURL(file);
  });
}

async function getInvokeErrorMessage(error: unknown): Promise<string> {
  const maybeError = error as { message?: string; context?: { json?: () => Promise<unknown>; text?: () => Promise<string> } };
  try {
    const body = await maybeError.context?.json?.();
    if (body && typeof body === "object" && "error" in body) {
      return String((body as { error?: unknown }).error);
    }
  } catch {
    // fall through to text/message
  }
  try {
    const bodyText = await maybeError.context?.text?.();
    if (bodyText) return bodyText;
  } catch {
    // fall through to message
  }
  return maybeError.message || "Edge Function returned a non-2xx status code";
}

export default function ImageBackfill() {
  const { user, isChecking } = useAdminAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});

  if (isChecking) return null;
  if ((user?.email ?? "").toLowerCase() !== "info@walia-solutions.ch") {
    return <Navigate to="/admin" replace />;
  }


  const run = async (bucket: Bucket, mode: Mode, limit: number) => {
    const key = `${bucket}:${mode}`;
    setLoading(key);
    const aggregate = {
      bucket,
      mode,
      examined: 0,
      compressed: 0,
      skipped: 0,
      errors: 0,
      total_before_bytes: 0,
      total_after_bytes: 0,
      estimated_savings_bytes: 0,
      results: [] as BackfillResult[],
    };
    try {
      const { data: listData, error: listError } = await supabase.functions.invoke("backfill-image-compression", {
        body: { action: "list", bucket, limit },
      });
      if (listError) throw new Error(await getInvokeErrorMessage(listError));

      const candidates = (listData?.candidates ?? []) as Candidate[];
      aggregate.examined = candidates.length;
      setResults((r) => ({ ...r, [bucket]: { ...aggregate } }));

      for (const candidate of candidates) {
        const originalSize = Number(candidate.size ?? 0);
        try {
          const { data: blob, error: downloadError } = await supabase.storage
            .from(bucket)
            .download(candidate.name);

          if (downloadError || !blob) {
            throw new Error(downloadError?.message || "Download fehlgeschlagen");
          }

          const originalFile = new File([blob], candidate.name.split("/").pop() || "image", {
            type: candidate.mimetype,
            lastModified: Date.now(),
          });
          const compressed = await bestCompressedWebP(originalFile, originalSize);

          if (compressed.type !== "image/webp" || compressed.size >= originalSize) {
            aggregate.skipped += 1;
            aggregate.results.push({
              path: candidate.name,
              originalSize,
              newSize: compressed.size,
              action: "skipped_larger",
            });
            setResults((r) => ({ ...r, [bucket]: { ...aggregate } }));
            continue;
          }

          if (mode === "dry-run") {
            aggregate.compressed += 1;
            aggregate.total_before_bytes += originalSize;
            aggregate.total_after_bytes += compressed.size;
            aggregate.estimated_savings_bytes = aggregate.total_before_bytes - aggregate.total_after_bytes;
            aggregate.results.push({
              path: candidate.name,
              originalSize,
              newSize: compressed.size,
              action: "would_replace",
            });
            setResults((r) => ({ ...r, [bucket]: { ...aggregate } }));
            continue;
          }

          const contentBase64 = await fileToBase64(compressed);
          const { data: commitData, error: commitError } = await supabase.functions.invoke("backfill-image-compression", {
            body: {
              action: "commit",
              bucket,
              name: candidate.name,
              originalSize,
              compressedSize: compressed.size,
              contentType: compressed.type,
              contentBase64,
            },
          });

          if (commitError) {
            throw new Error(await getInvokeErrorMessage(commitError));
          }

          const result = commitData as BackfillResult & { success?: boolean };
          aggregate.results.push(result);
          if (result.action === "replaced") {
            aggregate.compressed += 1;
            aggregate.total_before_bytes += originalSize;
            aggregate.total_after_bytes += compressed.size;
            aggregate.estimated_savings_bytes = aggregate.total_before_bytes - aggregate.total_after_bytes;
          } else if (result.action === "failed") {
            aggregate.errors += 1;
          } else {
            aggregate.skipped += 1;
          }
          setResults((r) => ({ ...r, [bucket]: { ...aggregate } }));
        } catch (error) {
          aggregate.errors += 1;
          aggregate.results.push({
            path: candidate.name,
            originalSize,
            action: "failed",
            error: error instanceof Error ? error.message : String(error),
          });
          setResults((r) => ({ ...r, [bucket]: { ...aggregate } }));
        }
      }

      toast.success(`${bucket} · ${mode}: ${aggregate.examined} geprüft, ${aggregate.compressed} ${mode === "dry-run" ? "komprimierbar" : "komprimiert"}`);
    } catch (e: any) {
      const message = e?.message || "Fehler beim Backfill";
      toast.error(message);
      setResults((r) => ({ ...r, [bucket]: { ...aggregate, error: message } }));
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
