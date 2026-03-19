import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import PageHeader from "../components/PageHeader"
import StatsCard from "../components/StatsCard"
import ChartCard from "../components/ChartCard"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts"

type Campaign = {
  id: string
  platform: string
  campaign_name: string
  spend: number
  impressions: number
  clicks: number
  conversions: number
  revenue: number
  status?: string
}

type CampaignForm = {
  campaign_name: string
  platform: string
  spend: string
  impressions: string
  clicks: string
  conversions: string
  revenue: string
  status: string
}

const PaidAdvertising = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // KPI states
  const [totalSpend, setTotalSpend] = useState(0)
  const [totalClicks, setTotalClicks] = useState(0)
  const [totalImpressions, setTotalImpressions] = useState(0)
  const [totalConversions, setTotalConversions] = useState(0)
  const [roas, setRoas] = useState(0)

  const [form, setForm] = useState<CampaignForm>({
    campaign_name: "",
    platform: "Google Ads",
    spend: "",
    impressions: "",
    clicks: "",
    conversions: "",
    revenue: "",
    status: "active",
  })

  const formatKES = (value: number) =>
    value.toLocaleString("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 2 })

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("paid_campaigns")
      .select("*")

    if (error) {
      console.error(error)
      setError(error.message)
      setLoading(false)
      return
    }

    setCampaigns(data)

    // Aggregate KPIs
    let spend = 0
    let clicks = 0
    let impressions = 0
    let conversions = 0
    let revenue = 0

    data.forEach((c: Campaign) => {
      spend += c.spend
      clicks += c.clicks
      impressions += c.impressions
      conversions += c.conversions
      revenue += c.revenue
    })

    setTotalSpend(spend)
    setTotalClicks(clicks)
    setTotalImpressions(impressions)
    setTotalConversions(conversions)

    if (spend > 0) {
      setRoas(revenue / spend)
    }

    setLoading(false)
  }

  const pauseCampaign = async (id: string) => {
    await supabase
      .from("paid_campaigns")
      .update({ status: "paused" })
      .eq("id", id)

    fetchCampaigns()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const payload = {
      campaign_name: form.campaign_name,
      platform: form.platform,
      spend: Number(form.spend) || 0,
      impressions: Number(form.impressions) || 0,
      clicks: Number(form.clicks) || 0,
      conversions: Number(form.conversions) || 0,
      revenue: Number(form.revenue) || 0,
      status: form.status,
    }

    const { error } = await supabase.from("paid_campaigns").insert([payload])
    if (error) {
      setError(error.message)
    } else {
      setForm({
        campaign_name: "",
        platform: "Google Ads",
        spend: "",
        impressions: "",
        clicks: "",
        conversions: "",
        revenue: "",
        status: "active",
      })
      await fetchCampaigns()
    }
    setSaving(false)
  }

  if (loading) {
    return <div className="p-10 text-center">Loading campaigns...</div>
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="space-y-6 p-6">
          <PageHeader
            title="Paid Advertising"
            subtitle="Spend, efficiency, and platform performance"
            actions={
              <div className="flex gap-3 items-center">
                {error ? <span className="text-xs text-red-600">{error}</span> : null}
                <button
                  onClick={() => void fetchCampaigns()}
                  className="rounded-md bg-black px-3 py-2 text-sm text-white"
                >
                  Refresh
                </button>
              </div>
            }
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            <StatsCard label="Total Spend" value={formatKES(totalSpend)} delta="+5% vs plan" />
            <StatsCard label="Impressions" value={totalImpressions.toLocaleString()} delta="+3%" />
            <StatsCard label="Clicks" value={totalClicks.toLocaleString()} delta="+2%" />
            <StatsCard label="Conversions" value={totalConversions} delta="+1%" />
            <StatsCard label="ROAS" value={`${roas.toFixed(2)}x`} delta="+0.1x" />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-1">
              <h3 className="mb-4 text-sm font-semibold text-gray-900">Add Campaign</h3>
              <form className="space-y-3" onSubmit={handleSubmit}>
                <input
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  placeholder="Campaign name"
                  required
                  value={form.campaign_name}
                  onChange={(e) => setForm({ ...form, campaign_name: e.target.value })}
                />
                <select
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  value={form.platform}
                  onChange={(e) => setForm({ ...form, platform: e.target.value })}
                >
                  <option>Google Ads</option>
                  <option>Facebook Ads</option>
                  <option>LinkedIn Ads</option>
                  <option>TikTok Ads</option>
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    placeholder="Spend"
                    type="number"
                    step="0.01"
                    value={form.spend}
                    onChange={(e) => setForm({ ...form, spend: e.target.value })}
                  />
                  <input
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    placeholder="Revenue"
                    type="number"
                    step="0.01"
                    value={form.revenue}
                    onChange={(e) => setForm({ ...form, revenue: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <input
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    placeholder="Impressions"
                    type="number"
                    value={form.impressions}
                    onChange={(e) => setForm({ ...form, impressions: e.target.value })}
                  />
                  <input
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    placeholder="Clicks"
                    type="number"
                    value={form.clicks}
                    onChange={(e) => setForm({ ...form, clicks: e.target.value })}
                  />
                  <input
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    placeholder="Conversions"
                    type="number"
                    value={form.conversions}
                    onChange={(e) => setForm({ ...form, conversions: e.target.value })}
                  />
                </div>
                <select
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="draft">Draft</option>
                </select>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save campaign"}
                </button>
                {error ? <p className="text-xs text-red-600">{error}</p> : null}
              </form>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <ChartCard title="Cross Channel Performance">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={campaigns}>
                      <XAxis dataKey="platform" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="clicks" stroke="#111827" />
                      <Line type="monotone" dataKey="conversions" stroke="#10b981" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              <ChartCard title="Ad Spend by Platform">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={campaigns}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="platform" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="spend" fill="#111827" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-gray-900">Campaign Performance</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-3 py-2">Campaign</th>
                    <th className="px-3 py-2">Platform</th>
                    <th className="px-3 py-2">Spend</th>
                    <th className="px-3 py-2">Clicks</th>
                    <th className="px-3 py-2">Conversions</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-gray-50">
                      <td className="px-3 py-3 font-medium text-gray-900">{campaign.campaign_name}</td>
                      <td className="px-3 py-3 text-gray-700">{campaign.platform}</td>
                      <td className="px-3 py-3 text-gray-700">{formatKES(campaign.spend)}</td>
                      <td className="px-3 py-3 text-gray-700">{campaign.clicks.toLocaleString()}</td>
                      <td className="px-3 py-3 text-gray-700">{campaign.conversions}</td>
                      <td className="px-3 py-3">
                        <button
                          onClick={() => void pauseCampaign(campaign.id)}
                          className="text-sm font-semibold text-red-600 hover:underline"
                        >
                          Pause
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default PaidAdvertising
