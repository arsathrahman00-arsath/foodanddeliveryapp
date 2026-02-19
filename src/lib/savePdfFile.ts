import type jsPDF from "jspdf";

export interface PdfSaveResult {
  filename: string;
  uri: string | null;
  platform: "web" | "mobile";
}

/**
 * Platform-aware PDF save utility.
 * - On web: triggers browser download via doc.save()
 * - On mobile (Capacitor): writes to filesystem and returns URI for open/share
 */
export async function savePdfFile(
  doc: jsPDF,
  filename: string
): Promise<PdfSaveResult> {
  const isMobile = typeof (window as any).Capacitor !== "undefined";

  if (isMobile) {
    try {
      const { Filesystem, Directory } = await import("@capacitor/filesystem");

      const base64 = doc.output("datauristring").split(",")[1];
      const saved = await Filesystem.writeFile({
        path: filename,
        data: base64,
        directory: Directory.External,
      });

      return {
        filename,
        uri: saved.uri,
        platform: "mobile",
      };
    } catch (error) {
      console.error("Mobile PDF save failed:", error);
      // Fallback to web download
      doc.save(filename);
      return { filename, uri: null, platform: "web" };
    }
  }

  // Web: standard browser download
  doc.save(filename);
  return { filename, uri: null, platform: "web" };
}
