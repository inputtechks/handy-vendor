import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  active: boolean;
}

export function BarcodeScanner({ onScan, active }: BarcodeScannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const scannerId = "barcode-scanner-" + Math.random().toString(36).slice(2);
    containerRef.current.id = scannerId;

    const scanner = new Html5Qrcode(scannerId);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 280, height: 150 } },
        (decodedText) => {
          onScan(decodedText);
        },
        () => {}
      )
      .catch((err) => {
        setError("Camera access denied or unavailable. Please allow camera access.");
        console.error("Scanner error:", err);
      });

    return () => {
      scanner
        .stop()
        .catch(() => {});
    };
  }, [active, onScan]);

  if (!active) return null;

  return (
    <div className="w-full">
      {error ? (
        <div className="rounded-lg bg-destructive/20 p-4 text-center text-destructive text-sm font-medium">
          {error}
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
