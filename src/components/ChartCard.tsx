import type { ReactNode } from "react"

type ChartCardProps = {
  title: string
  children?: ReactNode
}

const ChartCard = ({ title, children }: ChartCardProps) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <span className="text-xs text-gray-500">Last 30 days</span>
      </div>
      <div className="h-48 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200" />
      {children ? <div className="mt-3 text-sm text-gray-600">{children}</div> : null}
    </div>
  )
}

export default ChartCard
