import { cn } from "@/lib/utils"

export function AdminFilterBar({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: { id: string; label: string; count?: number }[]
  activeTab: string
  onTabChange: (id: string) => void
}) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-1 border-b border-border mb-4">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "shrink-0 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            activeTab === tab.id
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-1.5 text-xs opacity-70">({tab.count})</span>
          )}
        </button>
      ))}
    </div>
  )
}
