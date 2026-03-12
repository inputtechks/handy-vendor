import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  active: boolean;
  stream?: MediaStream | null;
}

export function BarcodeScanner({ onScan, active, stream }: BarcodeScannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

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

    const qrboxFunction = (viewfinderWidth: number, viewfinderHeight: number) => {
      const w = Math.min(Math.floor(viewfinderWidth * 0.85), 320);
      const h = Math.min(Math.floor(viewfinderHeight * 0.6), 180);
      return { width: Math.max(w, 150), height: Math.max(h, 100) };
    };

    const startScanner = async () => {
      try {
        if (stream) {
          // Use the pre-acquired stream (iOS-safe: obtained from user gesture)
          const videoTrack = stream.getVideoTracks()[0];
          if (!videoTrack) throw new Error("No video track in stream");
          const settings = videoTrack.getSettings();
          const cameraId = settings.deviceId;

          if (cameraId) {
            await scanner.start(
              cameraId,
              { fps: 15, qrbox: qrboxFunction, disableFlip: false, aspectRatio: 1.777 },
              onSuccess,
              () => {}
            );
          } else {
            // Fallback: use facingMode
            await scanner.start(
              { facingMode: "environment" },
              { fps: 15, qrbox: qrboxFunction, disableFlip: false, aspectRatio: 1.777 },
              onSuccess,
              () => {}
            );
          }
        } else {
          // No stream provided, try directly (works on Android/desktop)
          await scanner.start(
            { facingMode: "environment" },
            { fps: 15, qrbox: qrboxFunction, disableFlip: false, aspectRatio: 1.777 },
            onSuccess,
            () => {}
          );
        }

        if (cancelled) {
          scanner.stop().catch(() => {});
          return;
        }
        running = true;
      } catch (err) {
        if (!cancelled) {
          console.error("Scanner error:", err);
          setError("Camera access denied or unavailable. Please allow camera access and try again.");
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
    };
  }, [active, stream, onScan]);

  const handleRetry = async () => {
    setError(null);
    setRetrying(true);
    try {
      // Request camera directly from this click (user gesture)
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      // Stop the stream immediately — the scanner will request its own
      newStream.getTracks().forEach((t) => t.stop());
      setRetrying(false);
      // Force remount by toggling error
      setError(null);
    } catch {
      setRetrying(false);
      setError("Camera access denied. Please check your browser settings and allow camera access.");
    }
  };

  if (!active) return null;

  return (
    <div className="w-full">
      {error ? (
        <div className="rounded-lg bg-destructive/20 p-4 text-center space-y-3">
          <p className="text-destructive text-sm font-medium">{error}</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRetry}
            disabled={retrying}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${retrying ? "animate-spin" : ""}`} />
            {retrying ? "Retrying..." : "Try Again"}
          </Button>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="mx-auto w-full max-w-sm overflow-hidden rounded-lg border-2 border-primary/30"
        />
      )}
    </div>
  );
}
