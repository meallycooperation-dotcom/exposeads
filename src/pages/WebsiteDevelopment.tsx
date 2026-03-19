import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import PageHeader from "../components/PageHeader"
import StatsCard from "../components/StatsCard"
import ChartCard from "../components/ChartCard"
import { Globe } from "lucide-react"

type Website = {
  id: number
  website_name: string
  client_name: string
  url: string
  status: string
}

type SiteStats = {
  pageViews: string
  impressions: string
  retention: string
  uptime: string
}

type SiteForm = {
  website_name: string
  client_name: string
  url: string
  status: string
}

const WebsiteDevelopment = () => {
  const [websites, setWebsites] = useState<Website[]>([])
  const [selectedSite, setSelectedSite] = useState<Website | null>(null)
  const [siteStats, setSiteStats] = useState<SiteStats>({
    pageViews: "0",
    impressions: "0",
    retention: "0%",
    uptime: "99.9%",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<SiteForm>({
    website_name: "",
    client_name: "",
    url: "",
    status: "active",
  })

  useEffect(() => {
    void fetchWebsites()
  }, [])

  const fetchWebsites = async () => {
    setLoading(true)
    const { data, error } = await supabase.from("websites").select("*").order("created_at", { ascending: false })

    if (error) {
      setError(error.message)
      setWebsites([])
      setSelectedSite(null)
    } else if (data && data.length > 0) {
      setWebsites(data as Website[])
      setSelectedSite(data[0] as Website)
      void fetchSiteAnalytics((data[0] as Website).id)
    } else {
      setWebsites([])
      setSelectedSite(null)
    }
    setLoading(false)
  }

  const fetchSiteAnalytics = async (siteId: number) => {
    // Placeholder analytics — replace with real metrics if available
    setSiteStats({
      pageViews: (Math.floor(Math.random() * 5000 + siteId) + 1000).toLocaleString(),
      impressions: (Math.floor(Math.random() * 20000 + siteId) + 5000).toLocaleString(),
      retention: `${(Math.random() * 40 + 20).toFixed(1)}%`,
      uptime: "99.98%",
    })
  }

  const handleSiteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const site = websites.find((w) => w.id === Number(e.target.value))
    if (site) {
      setSelectedSite(site)
      void fetchSiteAnalytics(site.id)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const { error } = await supabase.from("websites").insert([form])
    if (error) {
      setError(error.message)
    } else {
      setForm({ website_name: "", client_name: "", url: "", status: "active" })
      await fetchWebsites()
    }
    setSaving(false)
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="space-y-6 p-6">
          <PageHeader
            title="Website Management"
            subtitle={selectedSite ? `Monitoring: ${selectedSite.url}` : "Select a website to view stats"}
            actions={
              <div className="flex gap-3">
                <select
                  onChange={handleSiteChange}
                  disabled={loading || websites.length === 0}
                  className="rounded-md border-gray-300 border bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none disabled:opacity-60"
                >
                  {websites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.website_name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => void fetchWebsites()}
                  className="rounded-md border border-gray-200 px-3 py-2 text-sm hover:bg-gray-100 disabled:opacity-60"
                  disabled={loading}
                >
                  {loading ? "Refreshing..." : "Refresh"}
                </button>
                {error ? <span className="text-xs text-red-600">{error}</span> : null}
              </div>
            }
          />

          {/* Real-time Stats Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <StatsCard label="Page Views" value={siteStats.pageViews} delta="+5.4%" />
            <StatsCard label="Impressions" value={siteStats.impressions} delta="+12.1%" />
            <StatsCard label="User Retention" value={siteStats.retention} delta="+2.3%" />
            <StatsCard label="Uptime" value={siteStats.uptime} delta="Steady" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm lg:col-span-1">
              <h3 className="font-bold mb-4 text-gray-800">Add website</h3>
              <form className="space-y-3" onSubmit={handleSubmit}>
                <input
                  required
                  placeholder="Website name"
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  value={form.website_name}
                  onChange={(e) => setForm({ ...form, website_name: e.target.value })}
                />
                <input
                  required
                  placeholder="Client name"
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  value={form.client_name}
                  onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                />
                <input
                  required
                  type="url"
                  placeholder="https://example.com"
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                />
                <select
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="archived">Archived</option>
                </select>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save website"}
                </button>
              </form>
            </div>

            {/* Site Details Card */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm col-span-1">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-800">
                <Globe size={18} /> Site Information
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Client Name</p>
                  <p className="text-sm font-semibold">{selectedSite?.client_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Live URL</p>
                  <a href={selectedSite?.url} target="_blank" className="text-sm text-blue-600 hover:underline truncate block">
                    {selectedSite?.url || "No URL provided"}
                  </a>
                </div>
                <div className="pt-4 border-t">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                    ? SSL Active
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <ChartCard title="Traffic Over Time">
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-100 rounded-lg text-gray-400">
                  Daily View Chart for {selectedSite?.website_name}
                </div>
              </ChartCard>
            </div>
          </div>

          {/* Quick Links / Tickets section */}
          <ChartCard title="Open Maintenance Tickets">
             <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Update Jumia Scraper API</span>
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">High Priority</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Fix mobile header overlap</span>
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">Minor</span>
                </div>
             </div>
          </ChartCard>
        </main>
      </div>
    </div>
  );
};

export default WebsiteDevelopment;

