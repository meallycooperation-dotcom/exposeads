type Campaign = {
  name: string
  channel: string
  status: "Active" | "Paused" | "Planning"
  spend: string
  roi: string
}

const sampleCampaigns: Campaign[] = [
  { name: "Spring Launch", channel: "Meta Ads", status: "Active", spend: "$18,400", roi: "3.4x" },
  { name: "B2B Nurture", channel: "LinkedIn", status: "Active", spend: "$9,250", roi: "2.1x" },
  { name: "Awareness Push", channel: "YouTube", status: "Paused", spend: "$6,120", roi: "1.7x" },
  { name: "Holiday Prep", channel: "Search", status: "Planning", spend: "$0", roi: "—" },
]

const statusStyles: Record<Campaign["status"], string> = {
  Active: "bg-green-100 text-green-700",
  Paused: "bg-yellow-100 text-yellow-700",
  Planning: "bg-blue-100 text-blue-700",
}

const CampaignTable = ({ campaigns = sampleCampaigns }: { campaigns?: Campaign[] }) => {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">Top Campaigns</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Campaign</th>
              <th className="px-4 py-3 font-medium">Channel</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Spend</th>
              <th className="px-4 py-3 font-medium">ROI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {campaigns.map((campaign) => (
              <tr key={campaign.name} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{campaign.name}</td>
                <td className="px-4 py-3 text-gray-600">{campaign.channel}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[campaign.status]}`}
                  >
                    {campaign.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{campaign.spend}</td>
                <td className="px-4 py-3 text-gray-600">{campaign.roi}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default CampaignTable
