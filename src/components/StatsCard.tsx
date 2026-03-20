import type { ReactNode } from "react"

type StatsCardProps = {
  label: string
  value: string | number
  delta?: string
  icon?: ReactNode
  color?: string
}

const StatsCard = ({ label, value, delta, icon, color }: StatsCardProps) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex items-center">
      {icon && <div className="mr-4" style={{ color: color }}>{icon}</div>}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500">{label}</p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-gray-900 break-words leading-tight">
            {value}
          </span>
          {delta ? (
            <span className="text-xs whitespace-nowrap" style={{ color: color }}>
              {delta}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default StatsCard
