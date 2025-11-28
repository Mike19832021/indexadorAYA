/**
 * Handles the decompression of .tar.gz and .gz files in the browser.
 * Uses native DecompressionStream.
 */

import { LogFile } from "../types";

const extractTarGz = async (file: File): Promise<LogFile[]> => {
  const extractedFiles: LogFile[] = [];

  try {
    // 1. Decompress GZIP
    const ds = new DecompressionStream("gzip");
    const stream = file.stream().pipeThrough(ds);
    const buffer = await new Response(stream).arrayBuffer();

    // 2. Parse TAR
    const view = new DataView(buffer);
    let offset = 0;

    while (offset + 512 < buffer.byteLength) {
      // Check for end of archive (two empty blocks)
      if (view.getUint32(offset, true) === 0 && view.getUint32(offset + 4, true) === 0) {
        // Just a check, strictly we might continue checking but usually this indicates end
      }

      // Read File Name (0-100)
      const fileNameBytes = new Uint8Array(buffer, offset, 100);
      let fileName = "";
      for (let i = 0; i < fileNameBytes.length; i++) {
        if (fileNameBytes[i] === 0) break;
        fileName += String.fromCharCode(fileNameBytes[i]);
      }

      if (!fileName) {
        offset += 512;
        continue;
      }

      // Read File Size (124-136, stored as octal string)
      const sizeBytes = new Uint8Array(buffer, offset + 124, 12);
      let sizeStr = "";
      for (let i = 0; i < sizeBytes.length; i++) {
        if (sizeBytes[i] === 0) break;
        sizeStr += String.fromCharCode(sizeBytes[i]);
      }
      const fileSize = parseInt(sizeStr.trim(), 8);

      // Read Type Flag (156) - '0' or '\0' is normal file
      const typeFlag = String.fromCharCode(view.getUint8(offset + 156));

      // Calculate content offset
      const contentOffset = offset + 512;

      // Only process normal files and logs/txt
      if ((typeFlag === '0' || typeFlag === '\0') && (fileName.endsWith('.log') || fileName.endsWith('.txt'))) {
        const contentBytes = new Uint8Array(buffer, contentOffset, fileSize);
        const decoder = new TextDecoder("utf-8");
        const content = decoder.decode(contentBytes);

        extractedFiles.push({
          id: `${file.name}-${fileName}-${Date.now()}-${Math.random()}`,
          name: fileName,
          content: content,
          size: fileSize,
          originalArchive: file.name
        });
      }

      // Move to next header. 
      // File data is padded to 512 byte boundary.
      const blocks = Math.ceil(fileSize / 512);
      offset += 512 + (blocks * 512);
    }

  } catch (error) {
    console.error("Error extracting tar.gz:", error);
    throw new Error(`Error al procesar TAR ${file.name}: ${(error as Error).message}`);
  }

  return extractedFiles;
};

const extractSimpleGz = async (file: File): Promise<LogFile[]> => {
  try {
    // 1. Decompress GZIP directly
    const ds = new DecompressionStream("gzip");
    const stream = file.stream().pipeThrough(ds);
    const buffer = await new Response(stream).arrayBuffer();
    
    const decoder = new TextDecoder("utf-8");
    const content = decoder.decode(buffer);

    // Remove .gz from filename to get the "inner" filename
    // e.g., "server.log.gz" -> "server.log"
    const fileName = file.name.endsWith('.gz') 
      ? file.name.slice(0, -3) 
      : `${file.name}.txt`;

    return [{
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      name: fileName,
      content: content,
      size: buffer.byteLength,
      originalArchive: file.name
    }];
    
  } catch (error) {
    console.error("Error extracting gz:", error);
    throw new Error(`Error al procesar GZ ${file.name}: ${(error as Error).message}`);
  }
};

/**
 * Main entry point to process archives.
 * Determines strategy based on file extension.
 */
export const processLogArchive = async (file: File): Promise<LogFile[]> => {
  const name = file.name.toLowerCase();
  
  if (name.endsWith('.tar.gz') || name.endsWith('.tgz')) {
    return extractTarGz(file);
  } else if (name.endsWith('.gz')) {
    return extractSimpleGz(file);
  } else {
    throw new Error(`Formato de archivo no soportado: ${file.name}`);
  }
};