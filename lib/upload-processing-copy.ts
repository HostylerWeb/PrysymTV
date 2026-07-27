export const UPLOAD_QUEUED_TITLE = "Upload complete"

export const UPLOAD_QUEUED_BODY =
  "Your file is safely on our servers and is being transcoded in the background. You can close this and upload more — it will appear automatically when processing finishes. We'll notify you when it's ready."

export function uploadQueuedTitleFor(contentLabel: string): string {
  return `${capitalize(contentLabel)} uploaded`
}

export function uploadQueuedBodyFor(contentLabel: string): string {
  return `Your ${contentLabel} file is on our servers and is being transcoded in the background. You can close this and upload more — it will be published automatically when processing finishes. We'll notify you when it's ready.`
}

function capitalize(value: string): string {
  if (!value) return value
  return value.charAt(0).toUpperCase() + value.slice(1)
}
