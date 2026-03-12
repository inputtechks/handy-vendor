import { useState, useCallback, useRef } from "react";

/**
 * Hook to acquire camera permission directly from a user gesture (iOS-safe).
 * Requests getUserMedia, extracts cameraId, then immediately releases the stream
 * so html5-qrcode can open the camera cleanly without double-session conflicts.
 */
export function useCameraStream() {
  const [cameraId, setCameraId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestCamera = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      // Must be called directly from user gesture for iOS Safari
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      // Extract cameraId from the granted track
      const track = mediaStream.getVideoTracks()[0];
      const deviceId = track?.getSettings()?.deviceId || null;
      // Release immediately — html5-qrcode will open its own session
      mediaStream.getTracks().forEach((t) => t.stop());
      setCameraId(deviceId);
      return true;
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Camera access denied or unavailable.");
      return false;
    }
  }, []);

  const reset = useCallback(() => {
    setCameraId(null);
    setError(null);
  }, []);

  return { cameraId, error, requestCamera, reset };
}
