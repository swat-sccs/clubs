import "server-only";

import { createHash } from "node:crypto";
import * as tf from "@tensorflow/tfjs";
import { load, type NSFWJS, type PredictionType } from "nsfwjs";
import {
  englishDataset,
  englishRecommendedTransformers,
  RegExpMatcher,
} from "obscenity";
import sharp from "sharp";
import { getImage, type ValidatedImage } from "@/lib/storage";

const textMatcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

type GlobalWithModerationModel = typeof globalThis & {
  swatClubsNsfwModel?: Promise<NSFWJS>;
};

const moderationGlobal = globalThis as GlobalWithModerationModel;

function probability(
  predictions: PredictionType[],
  className: PredictionType["className"],
) {
  return predictions.find((prediction) => prediction.className === className)
    ?.probability ?? 0;
}

function threshold(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 0 && value <= 1 ? value : fallback;
}

async function getNsfwModel() {
  if (!moderationGlobal.swatClubsNsfwModel) {
    moderationGlobal.swatClubsNsfwModel = (async () => {
      tf.enableProdMode();
      await tf.setBackend("cpu");
      await tf.ready();
      return load("MobileNetV2");
    })().catch((error) => {
      moderationGlobal.swatClubsNsfwModel = undefined;
      throw error;
    });
  }
  return moderationGlobal.swatClubsNsfwModel;
}

export function postTextHash(title: string, subtitle: string) {
  return createHash("sha256")
    .update(title)
    .update("\0")
    .update(subtitle)
    .digest("hex");
}

export function moderatePostText(
  title: string,
  subtitle: string,
  approvedHash?: string | null,
) {
  const hash = postTextHash(title, subtitle);
  if (approvedHash === hash) {
    return { flagged: false, hash, reason: null };
  }
  const flagged = textMatcher.hasMatch(`${title}\n${subtitle}`);
  return {
    flagged,
    hash,
    reason: flagged
      ? "The language check found terms that need administrator review."
      : null,
  };
}

export async function moderatePostImage(image: Pick<ValidatedImage, "bytes">) {
  let tensor: tf.Tensor3D | null = null;
  try {
    const model = await getNsfwModel();
    const decoded = await sharp(Buffer.from(image.bytes), {
      limitInputPixels: 25_000_000,
    })
      .toColourspace("srgb")
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    tensor = tf.tensor3d(
      decoded.data,
      [decoded.info.height, decoded.info.width, decoded.info.channels],
      "int32",
    );
    const predictions = await model.classify(tensor, 5);
    const porn = probability(predictions, "Porn");
    const hentai = probability(predictions, "Hentai");
    const sexy = probability(predictions, "Sexy");
    const unsafeTotal = porn + hentai + sexy;
    const flagged =
      porn >= threshold("NSFW_PORN_THRESHOLD", 0.25) ||
      hentai >= threshold("NSFW_HENTAI_THRESHOLD", 0.25) ||
      sexy >= threshold("NSFW_SEXY_THRESHOLD", 0.45) ||
      unsafeTotal >= threshold("NSFW_COMBINED_THRESHOLD", 0.5);
    const strongest = [...predictions]
      .filter((prediction) =>
        ["Porn", "Hentai", "Sexy"].includes(prediction.className),
      )
      .sort((a, b) => b.probability - a.probability)[0];
    return {
      flagged,
      reason: flagged
        ? `The image safety check needs review (${strongest?.className ?? "unsafe content"} ${Math.round((strongest?.probability ?? unsafeTotal) * 100)}%).`
        : null,
    };
  } catch (error) {
    console.error("NSFWJS image moderation failed", error);
    // Fail closed: a temporary model or decoding problem should send an image
    // to a human, never publish it without a check.
    return {
      flagged: true,
      reason: "The automated image check could not finish, so the image needs administrator review.",
    };
  } finally {
    tensor?.dispose();
  }
}

export async function moderateStoredPostImage(objectKey: string) {
  try {
    const object = await getImage(objectKey);
    if (!object.Body) throw new Error("Stored image has no body");
    return moderatePostImage({
      bytes: await object.Body.transformToByteArray(),
    });
  } catch (error) {
    console.error("Unable to read stored image for moderation", error);
    return {
      flagged: true,
      reason: "The stored image could not be checked automatically, so it needs administrator review.",
    };
  }
}

export function moderationReason(reasons: Array<string | null>) {
  const present = reasons.filter((reason): reason is string => Boolean(reason));
  return present.length > 0 ? present.join(" ") : null;
}
