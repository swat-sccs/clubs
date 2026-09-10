import "server-only";

import { randomUUID } from "node:crypto";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import sharp from "sharp";

export const IMAGE_MAX_BYTES = 8 * 1024 * 1024;

function storageSetting(name: string, developmentFallback: string) {
  const value = process.env[name]?.trim();
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error(`${name} must be configured in production`);
  }
  return developmentFallback;
}

let storage:
  | { bucket: string; client: S3Client }
  | undefined;

function getStorage() {
  if (storage) return storage;
  storage = {
    bucket: storageSetting("S3_BUCKET_NAME", "club-uploads"),
    client: new S3Client({
      region: storageSetting("S3_REGION", "us-east-1"),
      endpoint: storageSetting("S3_ENDPOINT", "http://localhost:8333"),
      credentials: {
        accessKeyId: storageSetting("S3_ACCESS_KEY_ID", "clubs-dev"),
        secretAccessKey: storageSetting(
          "S3_SECRET_ACCESS_KEY",
          "clubs-development-secret",
        ),
      },
      forcePathStyle: true,
    }),
  };
  return storage;
}

let bucketReady: Promise<void> | null = null;

async function ensureBucket() {
  if (!bucketReady) {
    bucketReady = (async () => {
      const { bucket, client } = getStorage();
      await client.send(new HeadBucketCommand({ Bucket: bucket }));
    })().catch((error) => {
      bucketReady = null;
      throw error;
    });
  }
  await bucketReady;
}

export type ValidatedImage = {
  bytes: Uint8Array;
  contentType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
  extension: "jpg" | "png" | "webp" | "gif";
};

function detectImage(bytes: Uint8Array): Omit<ValidatedImage, "bytes"> | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { contentType: "image/jpeg", extension: "jpg" };
  }
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { contentType: "image/png", extension: "png" };
  }
  const signature = Buffer.from(bytes.subarray(0, 12)).toString("ascii");
  if (signature.startsWith("GIF87a") || signature.startsWith("GIF89a")) {
    return { contentType: "image/gif", extension: "gif" };
  }
  if (signature.startsWith("RIFF") && signature.slice(8, 12) === "WEBP") {
    return { contentType: "image/webp", extension: "webp" };
  }
  return null;
}

export async function validateImage(
  value: FormDataEntryValue | null,
): Promise<{ image: ValidatedImage | null; error: string | null }> {
  if (!(value instanceof File) || value.size === 0) {
    return { image: null, error: null };
  }
  if (value.size > IMAGE_MAX_BYTES) {
    return { image: null, error: "Images must be 8 MB or smaller." };
  }
  const bytes = new Uint8Array(await value.arrayBuffer());
  const detected = detectImage(bytes);
  if (!detected) {
    return {
      image: null,
      error: "Use a JPEG, PNG, WebP, or GIF image.",
    };
  }
  try {
    const metadata = await sharp(Buffer.from(bytes), {
      limitInputPixels: 25_000_000,
    }).metadata();
    if (!metadata.width || !metadata.height) throw new Error("Missing dimensions");
    if ((metadata.pages ?? 1) > 1) {
      return {
        image: null,
        error: "Animated images are not supported.",
      };
    }
  } catch {
    return {
      image: null,
      error: "That image is damaged or has dimensions that are too large.",
    };
  }
  return { image: { bytes, ...detected }, error: null };
}

export async function uploadImage(prefix: string, image: ValidatedImage) {
  await ensureBucket();
  const { bucket, client } = getStorage();
  const key = `${prefix}/${randomUUID()}.${image.extension}`;
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: image.bytes,
      ContentType: image.contentType,
      // Objects are only served through authorization-aware application
      // routes, never directly from the storage service.
      CacheControl: "private, no-store",
    }),
  );
  return key;
}

export async function deleteImage(key: string | null | undefined) {
  if (!key) return;
  const { bucket, client } = getStorage();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export async function getImage(key: string) {
  const { bucket, client } = getStorage();
  return client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
}
