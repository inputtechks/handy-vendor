import { useState, useCallback, useRef } from "react";

/**
 * Hook to acquire camera stream directly from a user gesture (iOS-safe).
 * Call `requestStream` in an onClick handler, then pass `stream` to BarcodeScanner.
 */
export function useCameraStream() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const requestStream = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = mediaStream;
      setStream(mediaStream);
      return true;
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Camera access denied or unavailable.");
      return false;
    }
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStream(null);
    setError(null);
  }, []);

  return { stream, error, requestStream, stopStream };
}
