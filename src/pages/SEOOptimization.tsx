import { useEffect, useMemo, useState } from "react"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import PageHeader from "../components/PageHeader"
import StatsCard from "../components/StatsCard"
import ChartCard from "../components/ChartCard"

declare global {
  interface Window {
    google?: any
  }
}

type SeoOverview = {
  clicks: number
  impressions: number
  ctr: number
  position: number
  errors: number
  updated_at?: string
}

type SeoQuery = {
  keyword: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

const fallbackOverview: SeoOverview = {
  clicks: 12890,
  impressions: 103422,
  ctr: 0.118,
  position: 8.2,
  errors: 3,
}

const fallbackQueries: SeoQuery[] = [
  { keyword: "marketing automation", clicks: 540, impressions: 3200, ctr: 0.17, position: 4.1 },
  { keyword: "seo agency kenya", clicks: 410, impressions: 2900, ctr: 0.14, position: 6.3 },
  { keyword: "email marketing software", clicks: 360, impressions: 2500, ctr: 0.13, position: 7.8 },
  { keyword: "content calendar template", clicks: 240, impressions: 2100, ctr: 0.11, position: 9.2 },
]

const googleConfig = {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined,
  scopes: (import.meta.env.VITE_GOOGLE_SCOPES as string | undefined) ?? "https://www.googleapis.com/auth/webmasters.readonly",
  site: (import.meta.env.VITE_GOOGLE_SITE as string | undefined) ?? "sc-domain:example.com",
}

const SEOOptimization = () => {
  const [overview, setOverview] = useState<SeoOverview>(fallbackOverview)
  const [queries, setQueries] = useState<SeoQuery[]>(fallbackQueries)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [gisReady, setGisReady] = useState(false)

  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`

  const lastUpdatedLabel = useMemo(() => {
    if (!overview.updated_at) return "Using latest available data"
    return `Updated ${new Date(overview.updated_at).toLocaleString()}`
  }, [overview.updated_at])

  const loadGoogleScript = () => {
    if (window.google?.accounts?.oauth2) {
      setGisReady(true)
      return
    }
    const script = document.createElement("script")
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    script.defer = true
    script.onload = () => setGisReady(true)
    script.onerror = () => setError("Failed to load Google Identity Services script.")
    document.body.appendChild(script)
  }

  useEffect(() => {
    loadGoogleScript()
  }, [])

  const requestAccessToken = () => {
    if (!gisReady) {
      setError("Google Identity script not ready yet.")
      return
    }
    if (!googleConfig.clientId) {
      setError("Missing VITE_GOOGLE_CLIENT_ID in .env.")
      return
    }
    const client = window.google?.accounts?.oauth2?.initTokenClient({
      client_id: googleConfig.clientId,
      scope: googleConfig.scopes,
      callback: (response: any) => {
        if (response.error) {
          setError(response.error)
          return
        }
        setToken(response.access_token)
        setError(null)
      },
    })
    client?.requestAccessToken({ prompt: "consent" })
  }

  const fetchSearchConsole = async (accessToken: string) => {
    setLoading(true)
    setError(null)
    try {
      const body = {
        startDate: "2024-12-01",
        endDate: "2025-01-31",
        dimensions: ["query"],
        rowLimit: 10,
      }
    const res = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(googleConfig.site)}/searchAnalytics/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    )

      if (!res.ok) throw new Error(`Google API: ${res.status} ${res.statusText}`)
      const json = await res.json()

      const rows = (json.rows ?? []).map((r: any) => ({
        keyword: r.keys?.[0] ?? "n/a",
        clicks: Number(r.clicks ?? 0),
        impressions: Number(r.impressions ?? 0),
        ctr: Number(r.ctr ?? 0),
        position: Number(r.position ?? 0),
      })) as SeoQuery[]

      const totalClicks = rows.reduce((a, r) => a + r.clicks, 0)
      const totalImpressions = rows.reduce((a, r) => a + r.impressions, 0)
      const averageCtr = rows.length ? rows.reduce((a, r) => a + r.ctr, 0) / rows.length : 0
      const averagePosition = rows.length ? rows.reduce((a, r) => a + r.position, 0) / rows.length : 0

      const usingFallback = rows.length === 0

      setOverview({
        clicks: usingFallback ? fallbackOverview.clicks : totalClicks,
        impressions: usingFallback ? fallbackOverview.impressions : totalImpressions,
        ctr: usingFallback ? fallbackOverview.ctr : averageCtr,
        position: usingFallback ? fallbackOverview.position : averagePosition,
        errors: 0,
        updated_at: new Date().toISOString(),
      })
      setQueries(usingFallback ? fallbackQueries : rows)
      setError(usingFallback ? "No rows returned for this property/date range. Showing sample data." : null)
    } catch (err: any) {
      setError(err.message ?? "Failed to fetch Search Console data. Showing sample data.")
      setOverview(fallbackOverview)
      setQueries(fallbackQueries)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      void fetchSearchConsole(token)
    }
  }, [token])

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="space-y-6 p-6">
          <PageHeader
            title="SEO Optimization"
            subtitle="Direct Search Console pull (client-side, no server needed)"
            actions={
              <div className="flex flex-wrap items-center gap-3">
                {error ? <span className="text-xs text-red-600">{error}</span> : null}
                <button
                  onClick={requestAccessToken}
                  className="rounded-md border border-gray-200 px-4 py-2 text-sm hover:bg-gray-100"
                  disabled={loading}
                >
                  {token ? "Re-authorize Google" : "Connect Google"}
                </button>
                <button
                  onClick={() => (token ? void fetchSearchConsole(token) : requestAccessToken())}
                  className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-60"
                  disabled={loading}
                >
                  {loading ? "Fetching..." : "Refresh data"}
                </button>
              </div>
            }
          />

          <div className="text-xs text-gray-500">
            {token ? lastUpdatedLabel : "Connect Google with the env-based credentials to pull live data."}
          </div>

          {/* Section 1: Executive KPIs */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <StatsCard label="Organic Clicks" value={overview.clicks.toLocaleString()} delta="+12%" />
            <StatsCard label="Impressions" value={overview.impressions.toLocaleString()} delta="+5%" />
            <StatsCard label="Avg. CTR" value={formatPercent(overview.ctr)} delta="+0.2%" />
            <StatsCard label="Avg. Position" value={overview.position.toFixed(1)} delta="Top 10" />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Section 2: Top Converting Keywords (Client View) */}
            <ChartCard title="Top Performing Keywords">
              <div className="mt-4 space-y-3">
                {queries.map((q) => (
                  <div key={q.keyword} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <span className="text-sm font-medium text-gray-900">{q.keyword}</span>
                      <p className="text-xs text-gray-500">
                        {q.impressions.toLocaleString()} impressions • {formatPercent(q.ctr)} CTR
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-blue-600">{q.clicks.toLocaleString()} clicks</p>
                      <p className="text-xs text-gray-500">Pos. {q.position.toFixed(1)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>

            {/* Section 3: Technical Health (Specialist View) */}
            <ChartCard title="Technical & Page Errors">
              <div className="py-2">
                <div className="mb-2 flex justify-between">
                  <span className="text-sm text-gray-500">Site Health</span>
                  <span className="text-sm font-bold text-green-600">{overview.errors === 0 ? "Healthy" : "Action needed"}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-red-100 bg-red-50 p-4">
                    <p className="text-xs font-bold uppercase text-red-600">Errors</p>
                    <p className="text-2xl font-bold">{overview.errors}</p>
                    <p className="text-xs text-red-500">Live after Search Console sync</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs font-bold uppercase text-gray-600">Indexed</p>
                    <p className="text-2xl font-bold">1,240</p>
                    <p className="text-xs text-gray-500">Static placeholder</p>
                  </div>
                </div>
              </div>
            </ChartCard>
          </div>
        </main>
      </div>
    </div>
  )
}

export default SEOOptimization
