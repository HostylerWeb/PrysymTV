"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

type AdminConfirmDialogProps = {
  trigger: React.ReactNode
  title: string
  description: string
  confirmLabel?: string
  variant?: "default" | "destructive"
  onConfirm?: () => void
}

export function AdminConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Confirm",
  variant = "destructive",
  onConfirm,
}: AdminConfirmDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={variant === "destructive" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}
            onClick={onConfirm}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function AdminDeleteButton({
  itemLabel,
  onConfirm,
}: {
  itemLabel: string
  onConfirm?: () => void
}) {
  return (
    <AdminConfirmDialog
      title={`Delete ${itemLabel}?`}
      description="This removes the content from the platform. This action cannot be undone in production."
      confirmLabel="Delete"
      onConfirm={onConfirm}
      trigger={
        <Button size="sm" variant="outline" className="rounded-full text-destructive border-destructive/30 hover:bg-destructive/10">
          Delete
        </Button>
      }
    />
  )
}
