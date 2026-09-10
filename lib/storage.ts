import "server-only";

import { randomUUID } from "node:crypto";
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import sharp from "sharp";

export const IMAGE_MAX_BYTES = 8 * 1024 * 1024;

const bucket = process.env.S3_BUCKET_NAME ?? "club-uploads";

export const s3Client = new S3Client({
  region: process.env.S3_REGION ?? "us-east-1",
  endpoint: process.env.S3_ENDPOINT ?? "http://localhost:9000",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "minioadmin",
    secretAccessKey:
      process.env.S3_SECRET_ACCESS_KEY ?? "minioadminpassword",
  },
  forcePathStyle: true,
});

let bucketReady: Promise<void> | null = null;

async function ensureBucket() {
  if (!bucketReady) {
    bucketReady = (async () => {
      try {
        await s3Client.send(new HeadBucketCommand({ Bucket: bucket }));
      } catch {
        try {
          await s3Client.send(new CreateBucketCommand({ Bucket: bucket }));
        } catch {
          // Another app instance may have created it between HeadBucket and
          // CreateBucket. A final head request distinguishes that race from a
          // real storage/configuration failure.
          await s3Client.send(new HeadBucketCommand({ Bucket: bucket }));
        }
      }
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
  const key = `${prefix}/${randomUUID()}.${image.extension}`;
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: image.bytes,
      ContentType: image.contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return key;
}

export async function deleteImage(key: string | null | undefined) {
  if (!key) return;
  await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export async function getImage(key: string) {
  return s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
}
