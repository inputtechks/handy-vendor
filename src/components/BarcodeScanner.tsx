import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  active: boolean;
  cameraId?: string | null;
}

/** Apply continuous autofocus to the active video track when possible */
function tryEnableAutofocus(scanner: Html5Qrcode) {
  try {
    // @ts-ignore – internal access to running video element
    const videoEl: HTMLVideoElement | undefined =
      (scanner as any)?.getRunningTrackCameraCapabilities?.()?.track?.
        // Alternative: grab from DOM
        undefined ??
      document.querySelector(`video`)
    ;
    const track = videoEl?.srcObject instanceof MediaStream
      ? videoEl.srcObject.getVideoTracks()[0]
      : undefined;

    if (!track) return;

    // @ts-ignore
    const caps = track.getCapabilities?.();
    // @ts-ignore
    if (caps?.focusMode?.includes("continuous")) {
      // @ts-ignore
      track.applyConstraints({ advanced: [{ focusMode: "continuous" }] });
    }
  } catch {}
}

export function BarcodeScanner({ onScan, active, cameraId }: BarcodeScannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const { t } = useLanguage();

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
      // Wide scan area for easier barcode targeting
      const w = Math.min(Math.floor(viewfinderWidth * 0.92), 420);
      const h = Math.min(Math.floor(viewfinderHeight * 0.55), 200);
      return { width: Math.max(w, 220), height: Math.max(h, 100) };
    };

    // Higher FPS + aspect ratio hint for sharper frames
    const config = {
      fps: 15,
      qrbox: qrboxFunction,
      disableFlip: false,
      aspectRatio: 16 / 9,
      videoConstraints: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1920, min: 1280 },
        height: { ideal: 1080, min: 720 },
        // @ts-ignore
        focusMode: { ideal: "continuous" },
      },
    };

    const startScanner = async () => {
      try {
        if (cameraId) {
          // When we have an explicit cameraId, pass resolution constraints via config
          await scanner.start(cameraId, config, onSuccess, () => {});
        } else {
          let started = false;

          // Attempt 1: exact environment with HD
          try {
            await scanner.start(
              { facingMode: { exact: "environment" } },
              config,
              onSuccess,
              () => {}
            );
            started = true;
          } catch {}

          // Attempt 2: ideal environment
          if (!started) {
            try {
              await scanner.start(
                { facingMode: "environment" },
                config,
                onSuccess,
                () => {}
              );
              started = true;
            } catch {}
          }

          // Attempt 3: enumerate and pick last (rear) camera
          if (!started) {
            try {
              const devices = await navigator.mediaDevices.enumerateDevices();
              const videoDevices = devices.filter((d) => d.kind === "videoinput");
              if (videoDevices.length > 0) {
                const fallbackId = videoDevices[videoDevices.length - 1].deviceId;
                await scanner.start(fallbackId, config, onSuccess, () => {});
                started = true;
              }
            } catch {}
          }

          if (!started) throw new Error("All camera start attempts failed");
        }

        if (cancelled) {
          scanner.stop().catch(() => {});
          return;
        }
        running = true;

        // Post-start: force continuous autofocus on the live track
        setTimeout(() => tryEnableAutofocus(scanner), 500);
      } catch (err) {
        if (!cancelled) {
          console.error("Scanner error:", err);
          setError(t("scanner.cameraUnavailable"));
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
      try { scanner.clear(); } catch {}
      scannerRef.current = null;
    };
  }, [active, cameraId, onScan, retryKey, t]);

  const handleRetry = async () => {
    setError(null);
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      newStream.getTracks().forEach((tr) => tr.stop());
      setRetryKey((k) => k + 1);
    } catch {
      setError(t("scanner.cameraDenied"));
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
            {t("scanner.tryAgain")}
          </Button>
        </div>
      ) : (
        <>
          <div
            ref={containerRef}
            className="mx-auto w-full max-w-md overflow-hidden rounded-lg border-2 border-primary/30"
            style={{ minHeight: "280px" }}
          />
          <p className="text-center text-xs text-muted-foreground">{t("scanner.hint")}</p>
        </>
      )}
    </div>
  );
}
