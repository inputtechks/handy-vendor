import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  active: boolean;
  cameraId?: string | null;
}

const BARCODE_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.ITF,
];

/** Apply continuous autofocus to the active video track via container lookup */
function tryEnableAutofocus(containerRef: React.RefObject<HTMLDivElement | null>) {
  try {
    const videoEl = containerRef.current?.querySelector("video");
    const track =
      videoEl?.srcObject instanceof MediaStream
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

    const scanner = new Html5Qrcode(scannerId, {
      formatsToSupport: BARCODE_FORMATS,
      experimentalFeatures: { useBarCodeDetectorIfSupported: true },
      verbose: false,
    } as any);
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
      const w = Math.floor(viewfinderWidth * 0.98);
      const h = Math.floor(viewfinderHeight * 0.80);
      return { width: Math.max(w, 250), height: Math.max(h, 150) };
    };

    const config = {
      fps: 30,
      qrbox: qrboxFunction,
      disableFlip: false,
      aspectRatio: 16 / 9,
      videoConstraints: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        // @ts-ignore
        focusMode: { ideal: "continuous" },
      },
    };

    const startScanner = async () => {
      try {
        if (cameraId) {
          await scanner.start(cameraId, config, onSuccess, () => {});
        } else {
          let started = false;
          try {
            await scanner.start({ facingMode: { exact: "environment" } }, config, onSuccess, () => {});
            started = true;
          } catch {}
          if (!started) {
            try {
              await scanner.start({ facingMode: "environment" }, config, onSuccess, () => {});
              started = true;
            } catch {}
          }
          if (!started) {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter((d) => d.kind === "videoinput");
            if (videoDevices.length > 0) {
              await scanner.start(videoDevices[videoDevices.length - 1].deviceId, config, onSuccess, () => {});
              started = true;
            }
          }
          if (!started) throw new Error("All camera start attempts failed");
        }

        if (cancelled) { scanner.stop().catch(() => {}); return; }
        running = true;

        // Multi-interval autofocus for iOS Safari
        const timers = [500, 1500, 3000].map((ms) =>
          setTimeout(() => tryEnableAutofocus(containerRef), ms)
        );
        return () => timers.forEach(clearTimeout);
      } catch (err) {
        if (!cancelled) {
          console.error("Scanner error:", err);
          setError(t("scanner.cameraUnavailable"));
        }
      }
    };

    const cleanupPromise = startScanner();

    return () => {
      cancelled = true;
      cleanupPromise?.then((cleanup) => cleanup?.());
      if (running) { running = false; scanner.stop().catch(() => {}); }
      try { scanner.clear(); } catch {}
      scannerRef.current = null;
    };
  }, [active, cameraId, onScan, retryKey, t]);

  const handleRetry = async () => {
    setError(null);
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
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
