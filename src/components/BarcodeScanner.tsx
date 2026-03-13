import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { RefreshCw, Flashlight, FlashlightOff } from "lucide-react";
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

// Beep sound using Web Audio API
function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.type = "square";
    oscillator.frequency.value = 1800;
    gain.gain.value = 0.3;
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.12);
    setTimeout(() => ctx.close(), 200);
  } catch {}
}

// Haptic feedback
function triggerHaptic() {
  try {
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  } catch {}
}

/** Apply continuous autofocus + white balance to the active video track */
function applyTrackOptimizations(containerRef: React.RefObject<HTMLDivElement | null>) {
  try {
    const videoEl = containerRef.current?.querySelector("video");
    const track =
      videoEl?.srcObject instanceof MediaStream
        ? videoEl.srcObject.getVideoTracks()[0]
        : undefined;
    if (!track) return;
    // @ts-ignore
    const caps = track.getCapabilities?.();
    const advanced: any[] = [];
    // @ts-ignore
    if (caps?.focusMode?.includes("continuous")) {
      advanced.push({ focusMode: "continuous" });
    }
    // @ts-ignore
    if (caps?.whiteBalanceMode?.includes("continuous")) {
      advanced.push({ whiteBalanceMode: "continuous" });
    }
    if (advanced.length > 0) {
      // @ts-ignore
      track.applyConstraints({ advanced });
    }
  } catch {}
}

/** Try to toggle torch on the active video track */
function setTorch(containerRef: React.RefObject<HTMLDivElement | null>, on: boolean): boolean {
  try {
    const videoEl = containerRef.current?.querySelector("video");
    const track =
      videoEl?.srcObject instanceof MediaStream
        ? videoEl.srcObject.getVideoTracks()[0]
        : undefined;
    if (!track) return false;
    // @ts-ignore
    const caps = track.getCapabilities?.();
    // @ts-ignore
    if (!caps?.torch) return false;
    // @ts-ignore
    track.applyConstraints({ advanced: [{ torch: on }] });
    return true;
  } catch {
    return false;
  }
}

export function BarcodeScanner({ onScan, active, cameraId }: BarcodeScannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
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
      // Haptic + beep feedback
      triggerHaptic();
      playBeep();
      scanner.stop().catch(() => {});
      onScan(decodedText);
    };

    // Scan region: central bounding box — reduces CPU by only analyzing center pixels
    const qrboxFunction = (viewfinderWidth: number, viewfinderHeight: number) => {
      const w = Math.floor(viewfinderWidth * 0.85);
      const h = Math.floor(viewfinderHeight * 0.45);
      return { width: Math.max(w, 250), height: Math.max(h, 120) };
    };

    const config = {
      fps: 30,
      qrbox: qrboxFunction,
      disableFlip: false,
      aspectRatio: 16 / 9,
      videoConstraints: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30, min: 15 },
        // @ts-ignore – iOS Safari constraint
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

        // Multi-interval autofocus + white balance for iOS Safari
        const timers = [300, 1000, 2000, 4000].map((ms) =>
          setTimeout(() => {
            applyTrackOptimizations(containerRef);
            // Check torch support after camera is ready
            if (ms === 1000) {
              const supported = setTorch(containerRef, false);
              setTorchSupported(supported);
            }
          }, ms)
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
      setTorchOn(false);
      setTorchSupported(false);
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

  const handleToggleTorch = useCallback(() => {
    const newState = !torchOn;
    const ok = setTorch(containerRef, newState);
    if (ok) setTorchOn(newState);
  }, [torchOn]);

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
          <div className="relative mx-auto w-full max-w-md">
            {/* Camera feed */}
            <div
              ref={containerRef}
              className="w-full overflow-hidden rounded-lg border-2 border-primary/30"
              style={{ minHeight: "280px" }}
            />
            {/* Scan region overlay with animated laser line */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative" style={{ width: "85%", height: "45%" }}>
                {/* Corner brackets */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-3 border-l-3 border-destructive rounded-tl" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-3 border-r-3 border-destructive rounded-tr" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-3 border-l-3 border-destructive rounded-bl" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-3 border-r-3 border-destructive rounded-br" />
                {/* Animated scanning laser line */}
                <div className="absolute left-2 right-2 h-0.5 bg-destructive/90 shadow-[0_0_8px_2px_hsl(var(--destructive)/0.6)] animate-scan-line" />
              </div>
            </div>
            {/* Torch toggle button */}
            {torchSupported && (
              <Button
                variant={torchOn ? "default" : "secondary"}
                size="icon"
                onClick={handleToggleTorch}
                className="absolute top-2 right-2 z-10 h-10 w-10 rounded-full shadow-lg"
              >
                {torchOn ? <FlashlightOff className="h-5 w-5" /> : <Flashlight className="h-5 w-5" />}
              </Button>
            )}
          </div>
          <p className="text-center text-xs text-muted-foreground">{t("scanner.hint")}</p>
        </>
      )}
    </div>
  );
}
