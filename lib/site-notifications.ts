import { toast } from "sonner"

type NotifyOptions = {
  description?: string
  duration?: number
}

const DEFAULT_DURATION_MS = 4000

/** In-app toasts — replaces window.alert and browser notification popups. */
export const notify = {
  success(message: string, options?: NotifyOptions) {
    toast.success(message, {
      description: options?.description,
      duration: options?.duration ?? DEFAULT_DURATION_MS,
    })
  },

  error(message: string, options?: NotifyOptions) {
    toast.error(message, {
      description: options?.description,
      duration: options?.duration ?? DEFAULT_DURATION_MS,
    })
  },

  info(message: string, options?: NotifyOptions) {
    toast.info(message, {
      description: options?.description,
      duration: options?.duration ?? DEFAULT_DURATION_MS,
    })
  },

  warning(message: string, options?: NotifyOptions) {
    toast.warning(message, {
      description: options?.description,
      duration: options?.duration ?? DEFAULT_DURATION_MS,
    })
  },
}
