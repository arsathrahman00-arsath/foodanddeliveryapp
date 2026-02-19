import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { ScanLine, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QrScannerProps {
  onScan: (result: string) => void;
  className?: string;
}

const QrScanner: React.FC<QrScannerProps> = ({ onScan, className }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = "qr-reader-container";

  const stopScanner = async () => {
    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
      }
      scannerRef.current?.clear();
    } catch {
      // ignore cleanup errors
    }
    scannerRef.current = null;
    setIsScanning(false);
  };

  const startScanner = async () => {
    setIsStarting(true);
    try {
      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          onScan(decodedText);
          stopScanner();
        },
        () => {
          // QR not found in frame — ignore
        }
      );
      setIsScanning(true);
    } catch (err) {
      console.error("QR Scanner failed:", err);
    } finally {
      setIsStarting(false);
    }
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  if (isScanning || isStarting) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="relative rounded-xl overflow-hidden border-2 border-primary/50 bg-black">
          <div id={containerId} className="w-full" />
          {isStarting && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
          <div className="absolute top-2 right-2">
            <Button size="icon" variant="secondary" className="rounded-full h-8 w-8" onClick={stopScanner}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center">Point camera at QR code</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <Button
        type="button"
        variant="outline"
        className="w-full gap-2"
        onClick={startScanner}
      >
        <ScanLine className="w-4 h-4" />
        Scan QR Code
      </Button>
    </div>
  );
};

export default QrScanner;
