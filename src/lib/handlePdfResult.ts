import type { PdfSaveResult } from "./savePdfFile";
import { toast } from "@/hooks/use-toast";

/**
 * Unified handler for PDF save results.
 * Shows appropriate toast with Open/Share actions on mobile.
 */
export function handlePdfResult(result: PdfSaveResult): void {
  if (result.platform === "mobile" && result.uri) {
    toast({
      title: "PDF Saved",
      description: `${result.filename} saved to device`,
    });

    // Attempt to open/share using Capacitor plugins if available
    tryOpenOrShare(result.uri, result.filename);
  } else {
    toast({
      title: "Success",
      description: "PDF downloaded successfully",
    });
  }
}

async function tryOpenOrShare(uri: string, filename: string): Promise<void> {
  try {
    const { Share } = await import("@capacitor/share");
    await Share.share({
      title: filename,
      url: uri,
    });
  } catch (error) {
    console.log("Share not available:", error);
  }
}
