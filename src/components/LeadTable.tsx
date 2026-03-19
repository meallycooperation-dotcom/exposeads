type Lead = {
  name: string
  source: string
  stage: "New" | "Qualified" | "Proposal"
  value: string
}

const sampleLeads: Lead[] = [
  { name: "Amelia Carter", source: "Web form", stage: "Qualified", value: "$12,000" },
  { name: "Kai Jones", source: "LinkedIn", stage: "New", value: "$4,500" },
  { name: "Priya Patel", source: "Referral", stage: "Proposal", value: "$18,750" },
  { name: "Diego Ramirez", source: "Webinar", stage: "New", value: "$6,200" },
]

const stageBadge: Record<Lead["stage"], string> = {
  New: "bg-blue-100 text-blue-700",
  Qualified: "bg-purple-100 text-purple-700",
  Proposal: "bg-amber-100 text-amber-700",
}

const LeadTable = ({ leads = sampleLeads }: { leads?: Lead[] }) => {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">Pipeline</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Lead</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Stage</th>
              <th className="px-4 py-3 font-medium">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {leads.map((lead) => (
              <tr key={lead.name} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{lead.name}</td>
                <td className="px-4 py-3 text-gray-600">{lead.source}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${stageBadge[lead.stage]}`}
                  >
                    {lead.stage}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{lead.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default LeadTable
