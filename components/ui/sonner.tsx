'use client'

import { Toaster as Sonner, type ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      position="top-center"
      expand={false}
      richColors={false}
      closeButton
      offset={16}
      gap={10}
      className="prysym-toaster"
      style={
        {
          '--normal-bg': 'var(--card)',
          '--normal-text': 'var(--foreground)',
          '--normal-border': 'var(--border)',
          '--success-bg': 'oklch(0.16 0.04 40)',
          '--success-text': 'var(--foreground)',
          '--success-border': 'oklch(0.55 0.18 40 / 0.55)',
          '--error-bg': 'oklch(0.16 0.05 18)',
          '--error-text': 'var(--foreground)',
          '--error-border': 'oklch(0.5 0.18 18 / 0.55)',
          '--warning-bg': 'oklch(0.16 0.04 85)',
          '--warning-text': 'var(--foreground)',
          '--warning-border': 'oklch(0.58 0.12 85 / 0.55)',
          '--info-bg': 'var(--popover)',
          '--info-text': 'var(--foreground)',
          '--info-border': 'var(--border)',
        } as React.CSSProperties
      }
      toastOptions={{
        duration: 4000,
        unstyled: false,
        classNames: {
          toast: 'prysym-toast',
          title: 'prysym-toast-title',
          description: 'prysym-toast-description',
          actionButton: 'prysym-toast-action',
          cancelButton: 'prysym-toast-cancel',
          closeButton: 'prysym-toast-close',
          success: 'prysym-toast-success',
          error: 'prysym-toast-error',
          warning: 'prysym-toast-warning',
          info: 'prysym-toast-info',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
