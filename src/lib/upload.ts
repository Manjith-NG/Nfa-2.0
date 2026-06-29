import { mkdir, writeFile, readFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const MAX_FILE_SIZE = 2 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
]);

const ALLOWED_EXTENSIONS = new Set([".pdf", ".jpg", ".jpeg", ".png"]);

export function getUploadDir(): string {
  return process.env.UPLOAD_DIR ?? "./uploads";
}

export function validateUploadFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return "File size must be less than 2 MB";
  }

  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return "Only PDF, JPG, and PNG files are allowed";
  }

  if (file.type && file.type !== "application/octet-stream" && !ALLOWED_MIME_TYPES.has(file.type)) {
    return "Invalid file type. Only PDF, JPG, and PNG files are allowed";
  }

  return null;
}

export async function saveRequestUpload(
  requestId: string,
  file: File
): Promise<{ fileName: string; filePath: string; fileSize: number; mimeType: string }> {
  const validationError = validateUploadFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const uploadRoot = path.resolve(getUploadDir(), "requests", requestId);
  await mkdir(uploadRoot, { recursive: true });

  const ext = path.extname(file.name).toLowerCase();
  const storedName = `${randomUUID()}${ext}`;
  const absolutePath = path.join(uploadRoot, storedName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absolutePath, buffer);

  const relativePath = path.join("requests", requestId, storedName);

  return {
    fileName: file.name,
    filePath: relativePath.replace(/\\/g, "/"),
    fileSize: file.size,
    mimeType: file.type || "application/octet-stream",
  };
}

export function resolveUploadPath(relativePath: string): string {
  return path.resolve(getUploadDir(), relativePath);
}

export async function readRequestUpload(relativePath: string): Promise<Buffer> {
  return readFile(resolveUploadPath(relativePath));
}
