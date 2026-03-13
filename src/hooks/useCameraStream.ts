import { useState, useCallback } from "react";

const SCAN_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    facingMode: { ideal: "environment" },
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30, min: 15 },
    // @ts-ignore
    focusMode: { ideal: "continuous" },
  },
};

export function useCameraStream() {
  const [cameraId, setCameraId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestCamera = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);

      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(SCAN_CONSTRAINTS);
      } catch {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
      }

      const track = mediaStream.getVideoTracks()[0];

      // Apply continuous autofocus + white balance immediately + after delay for iOS
      const applyOptimizations = () => {
        try {
          // @ts-ignore
          const capabilities = track.getCapabilities?.();
          const advanced: any[] = [];
          // @ts-ignore
          if (capabilities?.focusMode?.includes("continuous")) {
            advanced.push({ focusMode: "continuous" });
          }
          // @ts-ignore
          if (capabilities?.whiteBalanceMode?.includes("continuous")) {
            advanced.push({ whiteBalanceMode: "continuous" });
          }
          if (advanced.length > 0) {
            // @ts-ignore
            track.applyConstraints({ advanced });
          }
        } catch {}
      };
      applyOptimizations();
      setTimeout(applyOptimizations, 800);

      let deviceId = track?.getSettings()?.deviceId || null;
      mediaStream.getTracks().forEach((t) => t.stop());

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
