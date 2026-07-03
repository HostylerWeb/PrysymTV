"use client"

import { cn } from "@/lib/utils"
import type { BuyerDetails } from "@/lib/buyer-details"

const fieldClass =
  "w-full h-11 px-4 rounded-xl bg-secondary text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50 transition-shadow"

const labelClass = "text-xs font-medium text-muted-foreground mb-1.5 block"

type BuyerDetailsFormProps = {
  value: BuyerDetails
  onChange: (next: BuyerDetails) => void
  disabled?: boolean
  className?: string
}

export function BuyerDetailsForm({
  value,
  onChange,
  disabled,
  className,
}: BuyerDetailsFormProps) {
  const set = (patch: Partial<BuyerDetails>) => onChange({ ...value, ...patch })

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="buyer-full-name" className={labelClass}>
            Full name <span className="text-destructive">*</span>
          </label>
          <input
            id="buyer-full-name"
            className={fieldClass}
            value={value.fullName}
            disabled={disabled}
            onChange={(e) => set({ fullName: e.target.value })}
            placeholder="Jane Doe"
            autoComplete="name"
          />
        </div>
        <div>
          <label htmlFor="buyer-phone" className={labelClass}>
            Phone <span className="text-destructive">*</span>
          </label>
          <input
            id="buyer-phone"
            className={fieldClass}
            value={value.phone}
            disabled={disabled}
            onChange={(e) => set({ phone: e.target.value })}
            placeholder="+1 555 0100"
            autoComplete="tel"
          />
        </div>
      </div>

      <div>
        <label htmlFor="buyer-line1" className={labelClass}>
          Address line 1 <span className="text-destructive">*</span>
        </label>
        <input
          id="buyer-line1"
          className={fieldClass}
          value={value.line1}
          disabled={disabled}
          onChange={(e) => set({ line1: e.target.value })}
          placeholder="123 Main St"
          autoComplete="address-line1"
        />
      </div>

      <div>
        <label htmlFor="buyer-line2" className={labelClass}>
          Address line 2 <span className="font-normal">(optional)</span>
        </label>
        <input
          id="buyer-line2"
          className={fieldClass}
          value={value.line2}
          disabled={disabled}
          onChange={(e) => set({ line2: e.target.value })}
          placeholder="Apt 4B"
          autoComplete="address-line2"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="buyer-city" className={labelClass}>
            City <span className="text-destructive">*</span>
          </label>
          <input
            id="buyer-city"
            className={fieldClass}
            value={value.city}
            disabled={disabled}
            onChange={(e) => set({ city: e.target.value })}
            autoComplete="address-level2"
          />
        </div>
        <div>
          <label htmlFor="buyer-state" className={labelClass}>
            State / region <span className="font-normal">(optional)</span>
          </label>
          <input
            id="buyer-state"
            className={fieldClass}
            value={value.state}
            disabled={disabled}
            onChange={(e) => set({ state: e.target.value })}
            autoComplete="address-level1"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="buyer-postal" className={labelClass}>
            Postal code <span className="text-destructive">*</span>
          </label>
          <input
            id="buyer-postal"
            className={fieldClass}
            value={value.postalCode}
            disabled={disabled}
            onChange={(e) => set({ postalCode: e.target.value })}
            autoComplete="postal-code"
          />
        </div>
        <div>
          <label htmlFor="buyer-country" className={labelClass}>
            Country <span className="text-destructive">*</span>
          </label>
          <input
            id="buyer-country"
            className={fieldClass}
            value={value.countryCode}
            disabled={disabled}
            onChange={(e) => set({ countryCode: e.target.value.toUpperCase().slice(0, 2) })}
            placeholder="US"
            autoComplete="country"
            maxLength={2}
          />
        </div>
      </div>
    </div>
  )
}
