export const UPLOAD_QUEUED_BODY =
  "Your content is being transcoded in the background. You can close this and upload more — it will be published automatically when processing finishes. We'll notify you when it's ready.";

export function uploadQueuedBodyFor(contentLabel: string): string {
  return `Your ${contentLabel} is being transcoded in the background. You can close this and upload more — it will be published automatically when processing finishes. We'll notify you when it's ready.`;
}
