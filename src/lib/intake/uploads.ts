"use client";

import { useSyncExternalStore } from "react";
import { requestAssetUpload } from "./actions";
import { assetProblem, MAX_ASSETS } from "./brief";
import { intakeDraft } from "./draft";

/**
 * Brand asset uploads in progress. Each file gets a signed upload URL from
 * the server and goes straight from the browser to the private bucket; the
 * secret key never leaves the server. Finished files move into the draft
 * (website.assets). Files still uploading or failed live only here, for this
 * visit, so a module store keeps them going if the visitor changes step.
 */

export type UploadItem = {
  id: string;
  name: string;
  size: number;
  /** 0 to 1 */
  progress: number;
  status: "queued" | "uploading" | "failed";
  error?: string;
  file: File;
};

let items: UploadItem[] = [];
const listeners = new Set<() => void>();
let running = false;

function set(next: UploadItem[]) {
  items = next;
  listeners.forEach((listener) => listener());
}

function patch(id: string, change: Partial<UploadItem>) {
  set(items.map((item) => (item.id === id ? { ...item, ...change } : item)));
}

function put(url: string, file: File, contentType: string, onProgress: (fraction: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("content-type", contentType);
    xhr.setRequestHeader("x-upsert", "false");
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (publishableKey) xhr.setRequestHeader("apikey", publishableKey);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText.slice(0, 200)}`)));
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.ontimeout = () => reject(new Error("Upload timed out"));
    xhr.send(file);
  });
}

async function run() {
  if (running) return;
  running = true;
  try {
    let next: UploadItem | undefined;
    while ((next = items.find((item) => item.status === "queued"))) {
      const { id, file } = next;
      patch(id, { status: "uploading", progress: 0, error: undefined });
      try {
        const ticket = await requestAssetUpload({ name: file.name, size: file.size });
        if (!ticket.ok) {
          patch(id, { status: "failed", error: ticket.error });
          continue;
        }
        await put(ticket.signedUrl, file, ticket.contentType, (progress) => patch(id, { progress }));
        intakeDraft.addAsset({ path: ticket.path, name: file.name.slice(0, 200), size: file.size });
        set(items.filter((item) => item.id !== id));
      } catch (error) {
        console.error("Uploading a brand asset failed", error);
        patch(id, { status: "failed", error: "This file couldn’t be uploaded. Check your connection and try again." });
      }
    }
  } finally {
    running = false;
  }
}

export const uploads = {
  /** Queues the files that can be uploaded; returns a message for any that cannot. */
  add(files: File[]): string[] {
    const problems: string[] = [];
    let room = MAX_ASSETS - intakeDraft.get().website.assets.length - items.filter((item) => item.status !== "failed").length;
    const added: UploadItem[] = [];
    for (const file of files) {
      const problem = assetProblem(file.name, file.size);
      if (problem) {
        problems.push(`${file.name}: ${problem}`);
        continue;
      }
      if (room <= 0) {
        problems.push(`${file.name}: up to ${MAX_ASSETS} files can be added.`);
        continue;
      }
      room -= 1;
      added.push({ id: crypto.randomUUID(), name: file.name, size: file.size, progress: 0, status: "queued", file });
    }
    if (added.length > 0) {
      set([...items, ...added]);
      void run();
    }
    return problems;
  },
  retry(id: string) {
    patch(id, { status: "queued", progress: 0, error: undefined });
    void run();
  },
  dismiss(id: string) {
    set(items.filter((item) => item.id !== id));
  },
  /** True while any file is queued or uploading. */
  busy(): boolean {
    return items.some((item) => item.status !== "failed");
  },
};

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const none: UploadItem[] = [];

export function useUploads(): UploadItem[] {
  return useSyncExternalStore(subscribe, () => items, () => none);
}
