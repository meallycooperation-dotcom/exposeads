type Client = {
  name: string
  plan: string
  health: "On track" | "At risk"
}

const sampleClients: Client[] = [
  { name: "Nordic Furniture", plan: "Enterprise", health: "On track" },
  { name: "Bluefin SaaS", plan: "Growth", health: "At risk" },
  { name: "Brightline Retail", plan: "Scale", health: "On track" },
  { name: "Horizon Labs", plan: "Growth", health: "On track" },
]

const healthBadge: Record<Client["health"], string> = {
  "On track": "bg-green-100 text-green-700",
  "At risk": "bg-red-100 text-red-700",
}

const ClientList = ({ clients = sampleClients }: { clients?: Client[] }) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Key Clients</h3>
        <span className="text-xs text-gray-500">Updated weekly</span>
      </div>
      <ul className="space-y-3">
        {clients.map((client) => (
          <li key={client.name} className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">{client.name}</p>
              <p className="text-xs text-gray-500">{client.plan} plan</p>
            </div>
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${healthBadge[client.health]}`}
            >
              {client.health}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ClientList
