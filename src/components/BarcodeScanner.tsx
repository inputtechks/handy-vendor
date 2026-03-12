import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  active: boolean;
  /** Preferred cameraId obtained from user gesture (iOS-safe). */
  cameraId?: string | null;
}

export function BarcodeScanner({ onScan, active, cameraId }: BarcodeScannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const scannerId = "barcode-scanner-" + Math.random().toString(36).slice(2);
    containerRef.current.id = scannerId;

    const scanner = new Html5Qrcode(scannerId);
    scannerRef.current = scanner;

    let cancelled = false;
    let running = false;
    let scanned = false;

    const onSuccess = (decodedText: string) => {
      if (scanned || cancelled) return;
      scanned = true;
      running = false;
      scanner.stop().catch(() => {});
      onScan(decodedText);
    };

    // Large responsive scan area — fills most of the viewfinder for easy positioning
    const qrboxFunction = (viewfinderWidth: number, viewfinderHeight: number) => {
      const w = Math.min(Math.floor(viewfinderWidth * 0.9), 400);
      const h = Math.min(Math.floor(viewfinderHeight * 0.7), 250);
      return { width: Math.max(w, 200), height: Math.max(h, 120) };
    };

    const config = {
      fps: 10,
      qrbox: qrboxFunction,
      disableFlip: false,
      // No fixed aspectRatio — let the camera use its native resolution (better for portrait iPhones)
    };

    const startScanner = async () => {
      try {
        // Priority 1: Use cameraId from warm-up (most reliable on iOS)
        if (cameraId) {
          await scanner.start(cameraId, config, onSuccess, () => {});
        } else {
          // Priority 2: facingMode with exact (works on most devices)
          try {
            await scanner.start(
              { facingMode: { exact: "environment" } },
              config,
              onSuccess,
              () => {}
            );
          } catch {
            // Priority 3: loose facingMode (fallback for front-only cameras)
            await scanner.start(
              { facingMode: "environment" },
              config,
              onSuccess,
              () => {}
            );
          }
        }

        if (cancelled) {
          scanner.stop().catch(() => {});
          return;
        }
        running = true;
      } catch (err) {
        if (!cancelled) {
          console.error("Scanner error:", err);
          setError("Camera unavailable. Please allow camera access and try again.");
        }
      }
    };

    startScanner();

    return () => {
      cancelled = true;
      if (running) {
        running = false;
        scanner.stop().catch(() => {});
      }
      // Full cleanup to avoid stale DOM state
      try {
        scanner.clear();
      } catch {}
      scannerRef.current = null;
    };
  }, [active, cameraId, onScan, retryKey]);

  const handleRetry = async () => {
    setError(null);
    try {
      // Request camera from this click (user gesture for iOS)
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      newStream.getTracks().forEach((t) => t.stop());
      // Bump retryKey to force a full scanner remount
      setRetryKey((k) => k + 1);
    } catch {
      setError("Camera access denied. Please check your browser settings.");
    }
  };

  if (!active) return null;

  return (
    <div className="w-full space-y-2">
      {error ? (
        <div className="rounded-lg bg-destructive/20 p-4 text-center space-y-3">
          <p className="text-destructive text-sm font-medium">{error}</p>
          <Button variant="secondary" size="sm" onClick={handleRetry} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      ) : (
        <>
          <div
            ref={containerRef}
            className="mx-auto w-full max-w-md overflow-hidden rounded-lg border-2 border-primary/30"
            style={{ minHeight: "280px" }}
          />
          <p className="text-center text-xs text-muted-foreground">
            Hold the barcode 15–25 cm from the camera
          </p>
        </>
      )}
    </div>
  );
}
