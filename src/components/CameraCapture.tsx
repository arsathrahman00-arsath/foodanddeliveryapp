import React, { useState, useRef, useCallback } from "react";
import { Camera, Video, Square, RotateCcw, Check, X, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CameraCaptureProps {
  mode: "photo" | "video";
  onCapture: (file: File) => void;
  capturedFile: File | null;
  onClear: () => void;
  label: string;
  maxMB?: number;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({
  mode,
  onCapture,
  capturedFile,
  onClear,
  label,
  maxMB,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    setIsRecording(false);
  }, []);

  const startCamera = useCallback(async (facing: "environment" | "user" = facingMode) => {
    setIsStarting(true);
    try {
      stopStream();
      const constraints: MediaStreamConstraints = {
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: mode === "video",
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsStreaming(true);
      setFacingMode(facing);
    } catch (err) {
      console.error("Camera access failed:", err);
    } finally {
      setIsStarting(false);
    }
  }, [facingMode, mode, stopStream]);

  const flipCamera = useCallback(() => {
    const next = facingMode === "environment" ? "user" : "environment";
    startCamera(next);
  }, [facingMode, startCamera]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `photo_${Date.now()}.jpg`, { type: "image/jpeg" });
      setPreviewUrl(URL.createObjectURL(blob));
      stopStream();
      onCapture(file);
    }, "image/jpeg", 0.85);
  }, [stopStream, onCapture]);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current, { mimeType: "video/webm" });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const file = new File([blob], `video_${Date.now()}.webm`, { type: "video/webm" });
      setPreviewUrl(URL.createObjectURL(blob));
      stopStream();
      onCapture(file);
    };
    mediaRecorderRef.current = recorder;
    recorder.start();
    setIsRecording(true);
  }, [stopStream, onCapture]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    onCapture(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [onCapture]);

  const handleClear = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    onClear();
  }, [previewUrl, onClear]);

  // If captured, show preview
  if (capturedFile && previewUrl) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium">{label}</label>
        <div className="relative rounded-xl overflow-hidden border border-primary/30 bg-primary/5">
          {mode === "photo" ? (
            <img src={previewUrl} alt="Captured" className="w-full max-h-48 object-cover" />
          ) : (
            <video src={previewUrl} controls className="w-full max-h-48" />
          )}
          <div className="absolute top-2 right-2 flex gap-1">
            <Button size="icon" variant="destructive" className="h-8 w-8" onClick={handleClear}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="p-2 flex items-center gap-2 text-primary text-sm">
            <Check className="w-4 h-4" />
            <span className="truncate">{capturedFile.name}</span>
          </div>
        </div>
      </div>
    );
  }

  // Camera live view
  if (isStreaming || isStarting) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium">{label}</label>
        <div className="relative rounded-xl overflow-hidden border-2 border-primary/50 bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={mode === "photo"}
            className="w-full max-h-64 object-cover"
          />
          {isStarting && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
            {mode === "photo" ? (
              <Button
                size="lg"
                className="rounded-full h-14 w-14 bg-white hover:bg-white/90 text-black shadow-lg"
                onClick={capturePhoto}
                disabled={isStarting}
              >
                <Camera className="w-6 h-6" />
              </Button>
            ) : isRecording ? (
              <Button
                size="lg"
                variant="destructive"
                className="rounded-full h-14 w-14 shadow-lg animate-pulse"
                onClick={stopRecording}
              >
                <Square className="w-5 h-5 fill-current" />
              </Button>
            ) : (
              <Button
                size="lg"
                className="rounded-full h-14 w-14 bg-red-500 hover:bg-red-600 text-white shadow-lg"
                onClick={startRecording}
                disabled={isStarting}
              >
                <Video className="w-6 h-6" />
              </Button>
            )}
            <Button
              size="icon"
              variant="secondary"
              className="rounded-full h-10 w-10 absolute right-3 bottom-0"
              onClick={flipCamera}
              disabled={isStarting || isRecording}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="rounded-full h-10 w-10 absolute left-3 bottom-0"
              onClick={stopStream}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          {isRecording && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              REC
            </div>
          )}
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  // Default: capture or upload options
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <input
        ref={fileInputRef}
        type="file"
        accept={mode === "photo" ? "image/*" : "video/*"}
        className="hidden"
        onChange={handleFileUpload}
      />
      <div className="grid grid-cols-2 gap-3">
        <div
          onClick={() => startCamera()}
          className={cn(
            "border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors",
            "border-border hover:border-primary/30 active:bg-primary/5"
          )}
        >
          <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
            {mode === "photo" ? <Camera className="w-7 h-7" /> : <Video className="w-7 h-7" />}
            <span className="text-xs font-medium">
              {mode === "photo" ? "Capture Photo" : "Record Video"}
            </span>
          </div>
        </div>
        <div
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors",
            "border-border hover:border-primary/30 active:bg-primary/5"
          )}
        >
          <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
            <Upload className="w-7 h-7" />
            <span className="text-xs font-medium">
              {mode === "photo" ? "Upload Photo" : "Upload Video"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraCapture;
