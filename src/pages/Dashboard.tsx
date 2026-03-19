import { useEffect, useState } from "react"
import { 
  Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, 
  CartesianGrid, ComposedChart, Area, PieChart, Pie, Cell, Legend 
} from "recharts"
import { supabase } from "../lib/supabase"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import PageHeader from "../components/PageHeader"
import StatsCard from "../components/StatsCard"
import ChartCard from "../components/ChartCard"
import CampaignTable from "../components/CampaignTable"
import ClientList from "../components/ClientList"
import LeadTable from "../components/LeadTable"

const Dashboard = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [kpi, setKpi] = useState({
    revenue: 0,
    spend: 0,
    leads: 0,
    cpl: 0,
    opportunities: 0,
    conversionRate: 0,
  })
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [plannedContent, setPlannedContent] = useState<any[]>([])

  const formatKES = (value: number) =>
    value.toLocaleString("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 })

  useEffect(() => {
    void loadDashboard()
  }, [])

  const loadDashboard = async () => {
    setLoading(true)
    setError(null)

    const [
      { data: paidCampaigns, error: paidErr },
      { data: leadsData, error: leadsErr },
      { data: websites, error: webErr },
      { data: contentData, error: contentErr },
    ] = await Promise.all([
      supabase.from("paid_campaigns").select("id,campaign_name,platform,spend,revenue,status"),
      supabase.from("leads").select("id,email,status,created_at"),
      supabase.from("websites").select("id,website_name,client_name,status"),
      supabase
        .from("content_calendar")
        .select("id,channel,status,post_date,post_topic_type")
        .order("post_date", { ascending: true })
        .limit(8),
    ])

    if (paidErr || leadsErr || webErr || contentErr) {
      setError(paidErr?.message ?? leadsErr?.message ?? webErr?.message ?? contentErr?.message ?? "Failed to load data")
    }

    const safeCampaigns = (paidCampaigns ?? []) as any[]
    const safeLeads = (leadsData ?? []) as any[]
    const safeClients = (websites ?? []) as any[]

    // KPIs
    const totalRevenue = safeCampaigns.reduce((sum, c) => sum + (Number(c.revenue) || 0), 0)
    const totalSpend = safeCampaigns.reduce((sum, c) => sum + (Number(c.spend) || 0), 0)
    const leadCount = safeLeads.length
    const qualified = safeLeads.filter((l) => (l.status ?? "").toLowerCase().includes("qual")).length
    const conversionRate = leadCount > 0 ? (qualified / leadCount) * 100 : 0

    setKpi({
      revenue: totalRevenue,
      spend: totalSpend,
      leads: leadCount,
      cpl: leadCount > 0 ? totalSpend / leadCount : 0,
      opportunities: qualified,
      conversionRate: conversionRate,
    })

    setCampaigns(
      safeCampaigns
        .sort((a, b) => (Number(b.spend) || 0) - (Number(a.spend) || 0))
        .slice(0, 8)
        .map((c) => {
          const spendVal = Number(c.spend) || 0
          const revenueVal = Number(c.revenue) || 0
          return {
            name: c.campaign_name ?? "Untitled",
            channel: c.platform ?? "Unknown",
            status: ((c.status ?? "Active").toString().charAt(0).toUpperCase() + (c.status ?? "active").slice(1)) as
              | "Active"
              | "Paused"
              | "Planning",
            spend: formatKES(spendVal),
            spendValue: spendVal,
            revenueValue: revenueVal,
            roi: spendVal > 0 ? ((revenueVal - spendVal) / spendVal * 100).toFixed(0) + '%' : "–",
            roix: spendVal > 0 ? (revenueVal / spendVal).toFixed(1) + 'x' : "–",
          }
        }),
    )

    setClients(
      safeClients.slice(0, 6).map((c) => ({
        name: c.client_name ?? c.website_name ?? "Client",
        plan: c.status ?? "Active",
        health: (c.status ?? "active") === "active" ? "On track" : "At risk",
        status: c.status ?? "active",
      })),
    )

    setLeads(
      safeLeads.slice(0, 8).map((l) => ({
        name: l.email ?? "Unknown lead",
        source: "Inbound",
        stage: (l.status ?? "New").toString().toLowerCase().includes("qual")
          ? "Qualified"
          : (l.status ?? "New").toString().toLowerCase().includes("prop")
            ? "Proposal"
            : "New",
        value: formatKES(0),
        created_at: l.created_at,
      })),
    )

    setPlannedContent(
      (contentData ?? []).map((c) => ({
        id: c.id,
        channel: c.channel ?? "Channel",
        status: c.status ?? "Planned",
        post_date: c.post_date ?? "",
        topic: c.post_topic_type ?? "—",
      })),
    )

    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  // Prepare data for pie charts
  const channelDistribution = campaigns.reduce((acc: any[], campaign) => {
    const existing = acc.find(item => item.name === campaign.channel)
    if (existing) {
      existing.value += campaign.spendValue
    } else {
      acc.push({ name: campaign.channel, value: campaign.spendValue })
    }
    return acc
  }, []).sort((a, b) => b.value - a.value)

  const statusDistribution = [
    { name: 'Active', value: campaigns.filter(c => c.status === 'Active').length },
    { name: 'Paused', value: campaigns.filter(c => c.status === 'Paused').length },
    { name: 'Planning', value: campaigns.filter(c => c.status === 'Planning').length },
  ]

  const leadStageDistribution = [
    { name: 'New', value: leads.filter(l => l.stage === 'New').length },
    { name: 'Qualified', value: leads.filter(l => l.stage === 'Qualified').length },
    { name: 'Proposal', value: leads.filter(l => l.stage === 'Proposal').length },
  ]

  const clientHealthDistribution = [
    { name: 'Active', value: clients.filter(c => c.status === 'active').length },
    { name: 'At Risk', value: clients.filter(c => c.status !== 'active').length },
  ]

  const pieColors = ["#111827", "#0ea5e9", "#10b981", "#f97316", "#a855f7", "#f59e0b", "#ef4444", "#3b82f6"]

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="flex-1 space-y-6 p-6">
          <PageHeader
            title="Dashboard"
            subtitle="Performance overview"
            actions={
              <>
                <button className="rounded-md border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50">
                  Export
                </button>
                <button className="rounded-md bg-black px-3 py-2 text-sm text-white hover:bg-gray-800">
                  New campaign
                </button>
                <button
                  onClick={handleLogout}
                  className="rounded-md border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
                >
                  Logout
                </button>
              </>
            }
          />

          {error ? <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">Error: {error}</div> : null}
          {loading ? (
            <div className="p-6 text-sm text-gray-600">Loading dashboard...</div>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
                <StatsCard label="Monthly revenue" value={formatKES(kpi.revenue)} delta="+12% MoM" />
                <StatsCard label="Ad spend" value={formatKES(kpi.spend)} delta="+4% MoM" />
                <StatsCard label="Leads captured" value={kpi.leads.toLocaleString()} delta="+6% MoM" />
                <StatsCard label="Avg. CPL" value={formatKES(kpi.cpl)} delta="-9% MoM" />
                <StatsCard label="Opportunities" value={kpi.opportunities.toLocaleString()} delta="+3% QoQ" />
                <StatsCard label="Conv. Rate" value={kpi.conversionRate.toFixed(1) + '%'} delta="+2% MoM" />
              </div>

              {/* Main Charts Row */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
                <ChartCard title="Spend vs Revenue">
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={campaigns.slice(0, 6)}>
                        <defs>
                          <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} interval={0} tick={{ fontSize: 11 }} />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip
                          formatter={(value: number | string) =>
                            typeof value === "number" ? formatKES(value) : String(value ?? "")
                          }
                        />
                        <Legend />
                        <Bar yAxisId="left" dataKey="spendValue" fill="#111827" name="Spend" radius={[4, 4, 0, 0]} />
                        <Area yAxisId="right" type="monotone" dataKey="revenueValue" stroke="#10b981" fill="url(#revGradient)" name="Revenue" />
                        <Line yAxisId="right" type="monotone" dataKey="revenueValue" stroke="#10b981" strokeWidth={2} dot={false} name="Revenue trend" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>

                <ChartCard title="ROI by Campaign">
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={campaigns.slice(0, 6)} layout="vertical" margin={{ left: 80 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                        <Tooltip
                          formatter={(value: number | string) =>
                            typeof value === "number" ? `${value.toFixed(0)}%` : String(value ?? "")
                          }
                        />
                        <Legend />
                        <Bar dataKey={(c) => {
                          const roi = ((c.revenueValue - c.spendValue) / c.spendValue * 100)
                          return isFinite(roi) ? roi : 0
                        }} fill="#10b981" name="ROI %" radius={[0, 4, 4, 0]}>
                          {campaigns.slice(0, 6).map((entry, index) => {
                            const roi = ((entry.revenueValue - entry.spendValue) / entry.spendValue * 100)
                            return <Cell key={`cell-${index}`} fill={roi >= 0 ? '#10b981' : '#ef4444'} />
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>

                <ChartCard title="Lead Pipeline">
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={leadStageDistribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]} />
                        <Line type="monotone" dataKey="value" stroke="#111827" strokeWidth={2} dot={{ r: 4 }} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
              </div>

              {/* Pie Charts Row */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <ChartCard title="Spend by Channel">
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={channelDistribution}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={60}
                          label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                        >
                          {channelDistribution.map((_, idx) => (
                            <Cell key={idx} fill={pieColors[idx % pieColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatKES(value)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>

                <ChartCard title="Campaign Status">
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusDistribution}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={60}
                          label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                        >
                          {statusDistribution.map((entry, idx) => (
                            <Cell key={idx} fill={
                              entry.name === 'Active' ? '#10b981' :
                              entry.name === 'Paused' ? '#f97316' : '#94a3b8'
                            } />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>

                <ChartCard title="Lead Stages">
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={leadStageDistribution}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={60}
                          label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                        >
                          {leadStageDistribution.map((entry, idx) => (
                            <Cell key={idx} fill={
                              entry.name === 'New' ? '#94a3b8' :
                              entry.name === 'Qualified' ? '#0ea5e9' : '#8b5cf6'
                            } />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>

                <ChartCard title="Client Health">
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={clientHealthDistribution}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={60}
                          label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                        >
                          {clientHealthDistribution.map((entry, idx) => (
                            <Cell key={idx} fill={entry.name === 'Active' ? '#10b981' : '#ef4444'} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
              </div>

              {/* Tables Row */}
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <div className="xl:col-span-2">
                  <CampaignTable campaigns={campaigns} />
                </div>
                <ClientList clients={clients} />
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <LeadTable leads={leads} />
                </div>
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="border-b border-gray-100 px-4 py-3">
                    <h3 className="text-sm font-semibold text-gray-900">Planned Content</h3>
                    <p className="text-xs text-gray-500">From content_calendar</p>
                  </div>
                  <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                    {plannedContent.length === 0 ? (
                      <p className="px-4 py-4 text-sm text-gray-600">No planned posts yet.</p>
                    ) : (
                      plannedContent.map((c) => (
                        <div key={c.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                          <div>
                            <p className="font-medium text-gray-900">{c.topic}</p>
                            <p className="text-xs text-gray-500">
                              {c.channel} • {c.post_date ? new Date(c.post_date).toLocaleDateString() : "TBD"}
                            </p>
                          </div>
                          <span className="text-[10px] rounded-full bg-blue-50 px-2 py-1 font-semibold uppercase text-blue-700">
                            {c.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}

export default Dashboard

