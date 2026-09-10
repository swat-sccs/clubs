import "server-only";

import { getImage } from "@/lib/storage";

export async function mediaResponse(
  objectKey: string,
  options: { private?: boolean } = {},
) {
  try {
    const object = await getImage(objectKey);
    if (!object.Body) return new Response(null, { status: 404 });

    return new Response(object.Body.transformToWebStream(), {
      headers: {
        "Content-Type": object.ContentType ?? "application/octet-stream",
        "Cache-Control": options.private
          ? "private, no-store"
          : "public, max-age=300, must-revalidate",
        ...(object.ETag ? { ETag: object.ETag } : {}),
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
