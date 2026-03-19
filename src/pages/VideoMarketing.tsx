import { useEffect, useMemo, useState } from "react"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import PageHeader from "../components/PageHeader"
import StatsCard from "../components/StatsCard"
import ChartCard from "../components/ChartCard"
import { supabase } from "../lib/supabase"
import { ExternalLink } from "lucide-react"

type CalendarRow = {
  id: number
  channel: string
  day_of_week: string | null
  status: string
  post_date: string
  post_time: string | null
  post_topic_type: string | null
  post_copy: string | null
  visual_type: string | null
  visual_drive_link: string | null
  link_to_assets: string | null
}

type FormState = {
  channel: string
  day_of_week: string
  status: string
  post_date: string
  post_time: string
  post_topic_type: string
  post_copy: string
  visual_type: string
  visual_drive_link: string
  link_to_assets: string
}

const defaultForm: FormState = {
  channel: "Instagram",
  day_of_week: "Monday",
  status: "Planned",
  post_date: "",
  post_time: "09:00",
  post_topic_type: "",
  post_copy: "",
  visual_type: "Single Still Image",
  visual_drive_link: "",
  link_to_assets: "",
}

const VideoMarketing = () => {
  const [rows, setRows] = useState<CalendarRow[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(defaultForm)

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    rows.forEach((r) => {
      counts[r.status] = (counts[r.status] || 0) + 1
    })
    return counts
  }, [rows])

  const loadRows = async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from("content_calendar")
      .select("*")
      .order("post_date", { ascending: true })
      .order("post_time", { ascending: true })

    if (error) {
      setError(error.message)
      setRows([])
    } else {
      setRows(data ?? [])
    }
    setLoading(false)
  }

  useEffect(() => {
    void loadRows()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const { error } = await supabase.from("content_calendar").insert([form])

    if (error) {
      setError(error.message)
    } else {
      setForm({ ...defaultForm, post_date: "" })
      await loadRows()
    }
    setSaving(false)
  }

  const onChange = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="space-y-6 p-6">
          <PageHeader
            title="Video Marketing"
            subtitle="Content calendar"
            actions={
              <div className="flex items-center gap-3 text-xs text-gray-600">
                {error ? <span className="text-red-600">Error: {error}</span> : null}
                <button
                  onClick={() => void loadRows()}
                  disabled={loading}
                  className="rounded-md border border-gray-200 px-3 py-2 text-sm disabled:opacity-60"
                >
                  {loading ? "Refreshing..." : "Refresh"}
                </button>
              </div>
            }
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatsCard label="Planned" value={statusCounts["Planned"] ?? 0} />
            <StatsCard label="Scheduled" value={statusCounts["Scheduled"] ?? 0} />
            <StatsCard label="Published" value={statusCounts["Published"] ?? 0} />
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">Add content slot</h3>
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 gap-3 md:grid-cols-4"
            >
              <select
                className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                value={form.channel}
                onChange={(e) => onChange("channel", e.target.value)}
              >
                <option>Instagram</option>
                <option>LinkedIn</option>
                <option>TikTok</option>
                <option>Facebook</option>
                <option>Twitter</option>
              </select>
              <input
                type="date"
                required
                className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                value={form.post_date}
                onChange={(e) => onChange("post_date", e.target.value)}
              />
              <input
                type="time"
                className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                value={form.post_time}
                onChange={(e) => onChange("post_time", e.target.value)}
              />
              <select
                className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                value={form.status}
                onChange={(e) => onChange("status", e.target.value)}
              >
                <option>Planned</option>
                <option>In Progress</option>
                <option>Scheduled</option>
                <option>Published</option>
              </select>
              <select
                className="rounded-md border border-gray-200 px-3 py-2 text-sm md:col-span-2"
                value={form.day_of_week}
                onChange={(e) => onChange("day_of_week", e.target.value)}
              >
                <option>Monday</option>
                <option>Tuesday</option>
                <option>Wednesday</option>
                <option>Thursday</option>
                <option>Friday</option>
                <option>Saturday</option>
                <option>Sunday</option>
              </select>
              <input
                placeholder="Topic (e.g., Educational)"
                className="rounded-md border border-gray-200 px-3 py-2 text-sm md:col-span-2"
                value={form.post_topic_type}
                onChange={(e) => onChange("post_topic_type", e.target.value)}
              />
              <textarea
                placeholder="Post copy..."
                className="rounded-md border border-gray-200 px-3 py-2 text-sm md:col-span-2"
                value={form.post_copy}
                onChange={(e) => onChange("post_copy", e.target.value)}
              />
              <select
                className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                value={form.visual_type}
                onChange={(e) => onChange("visual_type", e.target.value)}
              >
                <option>Single Gif</option>
                <option>Video</option>
                <option>Single Still Image</option>
              </select>
              <input
                placeholder="Visual drive link"
                className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                value={form.visual_drive_link}
                onChange={(e) => onChange("visual_drive_link", e.target.value)}
              />
              <input
                placeholder="Link to assets"
                className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                value={form.link_to_assets}
                onChange={(e) => onChange("link_to_assets", e.target.value)}
              />
              <button
                type="submit"
                disabled={saving}
                className="md:col-span-1 rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-60"
              >
                {saving ? "Saving..." : "Add to calendar"}
              </button>
            </form>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-900">Content calendar</h3>
            </div>
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2">Channel</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">Topic</th>
                  <th className="px-3 py-2">Copy</th>
                  <th className="px-3 py-2">Links</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td className="px-3 py-4 text-center text-gray-600" colSpan={7}>
                      Loading calendar...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td className="px-3 py-4 text-center text-gray-600" colSpan={7}>
                      No rows yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-3 py-3 font-medium">{row.channel}</td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusBadge(row.status)}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-gray-700">{row.post_date}</td>
                      <td className="px-3 py-3 text-gray-700">{row.post_time ?? "—"}</td>
                      <td className="px-3 py-3 text-gray-800">{row.post_topic_type ?? "—"}</td>
                      <td className="px-3 py-3 text-gray-600">{row.post_copy ?? "—"}</td>
                      <td className="px-3 py-3 flex gap-2">
                        {row.visual_drive_link ? (
                          <a
                            href={row.visual_drive_link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            <ExternalLink size={16} />
                          </a>
                        ) : null}
                        {row.link_to_assets ? (
                          <a
                            href={row.link_to_assets}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Assets
                          </a>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <ChartCard title="Publishing pace">
            Snapshot of content slots across channels for this week.
          </ChartCard>
        </main>
      </div>
    </div>
  )
}

const statusBadge = (status: string) => {
  const styles: Record<string, string> = {
    Published: "bg-green-100 text-green-700",
    Scheduled: "bg-yellow-100 text-yellow-700",
    "In Progress": "bg-orange-100 text-orange-700",
    Planned: "bg-blue-100 text-blue-700",
  }
  return styles[status] ?? "bg-gray-100 text-gray-700"
}

export default VideoMarketing
