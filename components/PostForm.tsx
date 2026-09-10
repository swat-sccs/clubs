"use client";

import Image from "next/image";
import { useActionState, useRef, useState } from "react";
import { ImagePlus, Save, Send } from "lucide-react";
import type { PostFormState } from "@/app/my-clubs/[slug]/posts/new/actions";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const INITIAL_STATE: PostFormState = { error: null };

export type EditablePost = {
  title: string;
  subtitle: string;
  eventDate: string;
  eventTime: string;
  location: string;
  imageUrl: string | null;
};

export default function PostForm({
  action,
  post,
}: {
  action: (
    previous: PostFormState,
    formData: FormData,
  ) => Promise<PostFormState>;
  post?: EditablePost;
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);
  const [fileName, setFileName] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = Boolean(post);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <Field>
        <FieldLabel htmlFor="post-title">Title</FieldLabel>
        <Input
          id="post-title"
          name="title"
          required
          minLength={2}
          maxLength={120}
          placeholder="Open mic night"
          defaultValue={post?.title}
          className="h-11 text-base"
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="post-subtitle">Post text</FieldLabel>
        <Textarea
          id="post-subtitle"
          name="subtitle"
          required
          minLength={2}
          maxLength={2000}
          rows={6}
          placeholder="Tell people what is happening, who should come, and what they should know."
          defaultValue={post?.subtitle}
          className="text-base"
        />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="event-date">Date</FieldLabel>
          <Input
            id="event-date"
            name="eventDate"
            type="date"
            required
            defaultValue={post?.eventDate}
            className="h-11 text-base"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="event-time">Time</FieldLabel>
          <Input
            id="event-time"
            name="eventTime"
            type="time"
            required
            defaultValue={post?.eventTime}
            className="h-11 text-base"
          />
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="event-location">Location</FieldLabel>
        <Input
          id="event-location"
          name="location"
          required
          minLength={2}
          maxLength={200}
          placeholder="Singer Hall 033"
          defaultValue={post?.location}
          className="h-11 text-base"
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="post-image">Photo (optional)</FieldLabel>
        {post?.imageUrl && !removeImage && !fileName && (
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-muted">
            <Image
              src={post.imageUrl}
              alt="Current post image"
              fill
              unoptimized
              sizes="(max-width: 672px) 100vw, 620px"
              className="object-cover"
            />
          </div>
        )}
        <label
          htmlFor="post-image"
          className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-input bg-muted/35 px-4 text-center transition-colors hover:bg-muted/70"
        >
          <ImagePlus className="size-6 text-sccs" />
          <span className="mt-2 font-medium text-foreground">
            {fileName ?? (post?.imageUrl ? "Choose a replacement photo" : "Choose a photo")}
          </span>
          <span className="mt-1 text-sm text-muted-foreground">
            JPEG, PNG, WebP, or static GIF · up to 8 MB
          </span>
        </label>
        <Input
          ref={fileInputRef}
          id="post-image"
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={(event) => {
            const name = event.target.files?.[0]?.name ?? null;
            setFileName(name);
            if (name) setRemoveImage(false);
          }}
        />
        {post?.imageUrl && (
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <input
              type="checkbox"
              name="removeImage"
              checked={removeImage}
              onChange={(event) => {
                setRemoveImage(event.target.checked);
                if (event.target.checked) {
                  setFileName(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }
              }}
              className="size-4 accent-sccs"
            />
            Remove the current photo
          </label>
        )}
      </Field>

      {state.error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sccs-orange px-5 font-semibold text-sccs-ink transition-colors hover:bg-sccs-orange/85 disabled:cursor-wait disabled:opacity-70"
      >
        {isEditing ? <Save className="size-4" /> : <Send className="size-4" />}
        {pending
          ? isEditing
            ? "Saving…"
            : "Publishing…"
          : isEditing
            ? "Save changes"
            : "Publish post"}
      </button>
    </form>
  );
}
