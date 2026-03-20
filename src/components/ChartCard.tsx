import type { ReactNode } from "react"

type ChartCardProps = {
  title: string
  subtitle?: string
  color?: string
  children?: ReactNode
}

const ChartCard = ({ title, subtitle, color, children }: ChartCardProps) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        <span className="text-xs" style={{ color: color }}>Last 30 days</span>
      </div>
      {children}
    </div>
  )
}

export default ChartCard
