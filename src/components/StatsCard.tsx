type StatsCardProps = {
  label: string
  value: string | number
  delta?: string
}

const StatsCard = ({ label, value, delta }: StatsCardProps) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-gray-900">{value}</span>
        {delta ? <span className="text-xs text-green-600">{delta}</span> : null}
      </div>
    </div>
  )
}

export default StatsCard
