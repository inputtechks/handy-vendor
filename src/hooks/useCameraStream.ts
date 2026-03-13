import { useState, useCallback } from "react";

/** Optimal video constraints for barcode scanning – prioritises autofocus + high res */
const SCAN_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    facingMode: { ideal: "environment" },
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    // @ts-ignore – focusMode is valid but not in TS lib types
    focusMode: { ideal: "continuous" },
  },
};

export function useCameraStream() {
  const [cameraId, setCameraId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestCamera = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);

      // 1. Open camera with ideal autofocus + HD constraints
      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(SCAN_CONSTRAINTS);
      } catch {
        // Fallback for devices that reject advanced constraints
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
      }

      const track = mediaStream.getVideoTracks()[0];

      // 2. Try to enable continuous autofocus via applyConstraints (iOS Safari)
      try {
        // @ts-ignore
        const capabilities = track.getCapabilities?.();
        // @ts-ignore
        if (capabilities?.focusMode?.includes("continuous")) {
          // @ts-ignore
          await track.applyConstraints({ advanced: [{ focusMode: "continuous" }] });
        }
      } catch {}

      let deviceId = track?.getSettings()?.deviceId || null;
      mediaStream.getTracks().forEach((t) => t.stop());

      // Huawei fallback: getSettings().deviceId may be empty
      if (!deviceId) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter((d) => d.kind === "videoinput");
          if (videoDevices.length > 0) {
            deviceId = videoDevices[videoDevices.length - 1].deviceId;
          }
        } catch {}
      }

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
