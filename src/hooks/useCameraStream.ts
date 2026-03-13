import { useState, useCallback } from "react";

export function useCameraStream() {
  const [cameraId, setCameraId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestCamera = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      const track = mediaStream.getVideoTracks()[0];
      let deviceId = track?.getSettings()?.deviceId || null;
      mediaStream.getTracks().forEach((t) => t.stop());

      // Huawei fallback: getSettings().deviceId may be empty
      if (!deviceId) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter((d) => d.kind === "videoinput");
          if (videoDevices.length > 0) {
            // Last video device is typically the rear camera
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
