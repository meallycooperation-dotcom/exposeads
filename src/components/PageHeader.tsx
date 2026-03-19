import type { ReactNode } from "react"

type PageHeaderProps = {
  title: string
  subtitle?: string
  actions?: ReactNode
}

const PageHeader = ({ title, subtitle, actions }: PageHeaderProps) => {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-gray-500">
          {subtitle}
        </p>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  )
}

export default PageHeader
