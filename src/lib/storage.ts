import "server-only";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface StoredDocumentResult {
  key: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

/**
 * Validates and securely stores private verification documents.
 * Files are kept strictly in a private directory inaccessible from public web requests.
 */
export async function storePrivateDocument(
  file: File,
  prefix: "cnic_front" | "cnic_back"
): Promise<StoredDocumentResult> {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error("Invalid document format. Only JPEG, PNG, and WebP images are permitted.");
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("File size exceeds 5MB limit.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Check magic bytes to reject disguised executables or scripts
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8;
  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47;
  const isWebp =
    buffer.length > 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP";

  if (!isJpeg && !isPng && !isWebp) {
    throw new Error("Invalid image binary signature. Executable or corrupted files are rejected.");
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const uniqueId = crypto.randomBytes(16).toString("hex");
  const filename = `${prefix}_${Date.now()}_${uniqueId}.${ext}`;

  // Private directory outside of web root / public
  const privateDir = path.join(process.cwd(), "private_storage", "verifications");
  await fs.mkdir(privateDir, { recursive: true });

  const destinationPath = path.join(privateDir, filename);
  await fs.writeFile(destinationPath, buffer);

  return {
    key: filename,
    originalName: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
  };
}

/**
 * Reads a private document by key. Access must be verified prior to calling.
 */
export async function getPrivateDocument(
  key: string
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  // Prevent directory traversal
  const sanitizedKey = path.basename(key);
  const filePath = path.join(process.cwd(), "private_storage", "verifications", sanitizedKey);

  try {
    const buffer = await fs.readFile(filePath);
    let mimeType = "image/jpeg";
    if (sanitizedKey.endsWith(".png")) mimeType = "image/png";
    if (sanitizedKey.endsWith(".webp")) mimeType = "image/webp";

    return { buffer, mimeType };
  } catch {
    return null;
  }
}

/**
 * Formats and masks sensitive CNIC numbers.
 * Example input: "4210112345671" -> "42101-*******-1"
 */
export function maskCnic(cnicRaw: string): string {
  const cleaned = cnicRaw.replace(/\D/g, "");
  if (cleaned.length !== 13) {
    // Return generic masked string if format is non-standard
    return "•••••-•••••••-•";
  }
  const part1 = cleaned.substring(0, 5);
  const part3 = cleaned.substring(12, 13);
  return `${part1}-*******-${part3}`;
}
