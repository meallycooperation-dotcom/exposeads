import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import PageHeader from "../components/PageHeader"
import StatsCard from "../components/StatsCard"
import ChartCard from "../components/ChartCard"

type Lead = {
  id: number
  email: string | null
  status: string | null
}

type LeadSource = {
  total_spend: number | null
}

type CampaignFinance = {
  id: number
  campaign_name: string | null
  platform: string | null
  total_spend: number | null
  start_date: string | null
  end_date: string | null
}

type CampaignForm = {
  campaign_name: string
  platform: string
  total_spend: string
  start_date: string
  end_date: string
}

const formatKES = (value: number) =>
  value.toLocaleString("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 })

const LeadGeneration = () => {
  const [leads, setLeads] = useState<Lead[]>([])
  const [campaigns, setCampaigns] = useState<CampaignFinance[]>([])
  const [campaignForm, setCampaignForm] = useState<CampaignForm>({
    campaign_name: "",
    platform: "Meta",
    total_spend: "",
    start_date: "",
    end_date: "",
  })
  const [stats, setStats] = useState({
    totalLeads: 0,
    mqlRate: 0,
    totalSpend: 0,
    cpl: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void Promise.all([fetchLeadData(), fetchCampaigns()])
  }, [])

  const fetchLeadData = async () => {
    setLoading(true)
    setError(null)

    const { data: leadsData, error: leadsError } = await supabase
      .from("leads")
      .select("id,email,status")

    const { data: sourcesData, error: sourcesError } = await supabase
      .from("lead_sources")
      .select("total_spend")

    if (leadsError || sourcesError) {
      setError(leadsError?.message ?? sourcesError?.message ?? "Unknown error")
      setLeads([])
      setLoading(false)
      return
    }

    const totalLeads = leadsData?.length ?? 0
    const totalSpend = (sourcesData as LeadSource[] | null)?.reduce((acc, curr) => acc + (curr.total_spend ?? 0), 0) ?? 0
    const cpl = totalLeads > 0 ? totalSpend / totalLeads : 0

    const mqlCount = (leadsData as Lead[] | null)?.filter((l) => l.status === "qualified").length ?? 0
    const mqlRate = totalLeads > 0 ? (mqlCount / totalLeads) * 100 : 0

    setStats({
      totalLeads,
      totalSpend,
      cpl,
      mqlRate,
    })
    setLeads((leadsData as Lead[]) ?? [])
    setLoading(false)
  }

  const fetchCampaigns = async () => {
    const { data, error } = await supabase.from("campaign_finances").select("*").order("start_date", { ascending: false })
    if (error) {
      setError(error.message)
      setCampaigns([])
    } else {
      setCampaigns((data as CampaignFinance[]) ?? [])
    }
  }

  const handleCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const { error } = await supabase.from("campaign_finances").insert([
      {
        campaign_name: campaignForm.campaign_name,
        platform: campaignForm.platform,
        total_spend: Number(campaignForm.total_spend || 0),
        start_date: campaignForm.start_date || null,
        end_date: campaignForm.end_date || null,
      },
    ])
    if (error) {
      setError(error.message)
      return
    }
    setCampaignForm({
      campaign_name: "",
      platform: "Meta",
      total_spend: "",
      start_date: "",
      end_date: "",
    })
    await fetchCampaigns()
    await fetchLeadData()
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="space-y-6 p-6">
          <PageHeader
            title="Lead Generation"
            subtitle="Pipeline growth & ROI tracking"
            actions={
              <div className="flex items-center gap-2">
                {error ? <span className="text-xs text-red-600">Error: {error}</span> : null}
                <button
                  onClick={() => void fetchLeadData()}
                  className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 transition disabled:opacity-60"
                  disabled={loading}
                >
                  {loading ? "Refreshing..." : "Refresh data"}
                </button>
              </div>
            }
          />

          {/* Dynamic Stats Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatsCard label="Total Leads" value={stats.totalLeads.toLocaleString()} delta="All time" />
            <StatsCard label="MQL Rate" value={`${stats.mqlRate.toFixed(1)}%`} delta="Qualified share" />
            <StatsCard label="Cost Per Lead" value={formatKES(stats.cpl)} delta="Avg across sources" />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ChartCard title="Lead Sources">
              <p className="mb-4 text-sm text-gray-500">Traffic distribution from Meta, TikTok, and Organic.</p>
              <div className="flex h-48 items-center justify-center rounded-lg bg-gray-100 text-gray-400 italic">
                Chart placeholder
              </div>
            </ChartCard>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-bold mb-4 text-gray-800">Recent Lead Activity</h3>
              <div className="overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-gray-400 border-b">
                      <th className="pb-2">Email</th>
                      <th className="pb-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                     {leads.slice(0, 5).map((lead) => (
                       <tr key={lead.id} className="border-b last:border-0 hover:bg-gray-50">
                         <td className="py-3 font-medium">{lead.email}</td>
                        <td className="py-3 text-right">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                            lead.status === 'qualified' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {lead.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Campaign capture & ROI */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-gray-900">Add lead campaign</h3>
              <form className="grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={handleCampaignSubmit}>
                <input
                  required
                  placeholder="Campaign name"
                  className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                  value={campaignForm.campaign_name}
                  onChange={(e) => setCampaignForm({ ...campaignForm, campaign_name: e.target.value })}
                />
                <select
                  className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                  value={campaignForm.platform}
                  onChange={(e) => setCampaignForm({ ...campaignForm, platform: e.target.value })}
                >
                  <option>Meta</option>
                  <option>TikTok</option>
                  <option>Google</option>
                  <option>LinkedIn</option>
                </select>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Total spend"
                  className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                  value={campaignForm.total_spend}
                  onChange={(e) => setCampaignForm({ ...campaignForm, total_spend: e.target.value })}
                />
                <input
                  type="date"
                  className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                  value={campaignForm.start_date}
                  onChange={(e) => setCampaignForm({ ...campaignForm, start_date: e.target.value })}
                />
                <input
                  type="date"
                  className="rounded-md border border-gray-200 px-3 py-2 text-sm md:col-span-2"
                  value={campaignForm.end_date}
                  onChange={(e) => setCampaignForm({ ...campaignForm, end_date: e.target.value })}
                />
                <button
                  type="submit"
                  className="md:col-span-2 rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-60"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save campaign"}
                </button>
              </form>

              <div className="mt-4">
                <h4 className="text-xs font-bold uppercase text-gray-500 mb-2">Recent campaigns</h4>
                {campaigns.length === 0 ? (
                  <p className="text-sm text-gray-500">No campaigns yet.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {campaigns.slice(0, 5).map((c) => (
                      <li key={c.id} className="flex justify-between border-b pb-2 last:border-0 last:pb-0">
                        <div>
                          <p className="font-medium text-gray-900">{c.campaign_name}</p>
                          <p className="text-xs text-gray-500">{c.platform}</p>
                        </div>
                        <span className="text-xs text-gray-600">
                          {c.start_date ?? ""} {c.end_date ? `-> ${c.end_date}` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center justify-between rounded-2xl bg-black p-8 text-white shadow-xl md:flex-row">
              <div>
                <h2 className="text-xl font-bold">Total Pipeline Value</h2>
                <p className="text-gray-400">Projected revenue based on current MQLs</p>
              </div>
              <div className="mt-4 text-4xl font-black md:mt-0">
                {formatKES(stats.totalLeads * 1099)}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LeadGeneration;

