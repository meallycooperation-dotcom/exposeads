import { useEffect, useMemo, useState } from "react"
import { Mail, Send, Eye, Code, ExternalLink } from "lucide-react"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import PageHeader from "../components/PageHeader"
import StatsCard from "../components/StatsCard"
import ChartCard from "../components/ChartCard"
import { supabase } from "../lib/supabase"

type Campaign = {
  id: number
  title: string | null
  subject_line: string | null
  content_html: string | null
  status: string | null
  created_at?: string | null
  sent_at?: string | null
}

type ClientEmail = {
  id: string
  email: string
  full_name: string | null
  status: string | null
  source: string | null
}

type FormState = {
  title: string
  subject_line: string
  content_html: string
  status: "draft" | "sent"
}

const defaultForm: FormState = {
  title: "",
  subject_line: "",
  content_html: "<h1>Hello {{first_name}}!</h1><p>Write your message here...</p>",
  status: "draft",
}

const EmailMarketing = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [audience, setAudience] = useState<ClientEmail[]>([])
  const [selectedEmails, setSelectedEmails] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [isPreview, setIsPreview] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormState>(defaultForm)

  const sentCount = useMemo(() => campaigns.filter((c) => c.status === "sent").length, [campaigns])
  const draftCount = useMemo(() => campaigns.filter((c) => c.status !== "sent").length, [campaigns])
  const activeAudience = useMemo(
    () => audience.filter((a) => (a.status ?? "active").toLowerCase() === "active"),
    [audience],
  )

  useEffect(() => {
    void loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)

    const [{ data: campaignData, error: campaignErr }, { data: audienceData, error: audienceErr }] = await Promise.all([
      supabase.from("email_campaigns").select("*"),
      supabase.from("client_emails").select("id,email,full_name,status,source").order("created_at", { ascending: false }),
    ])

    if (campaignErr || audienceErr) {
      setError(campaignErr?.message ?? audienceErr?.message ?? "Failed to load data")
    }

    if (campaignData) setCampaigns(campaignData as Campaign[])
    if (audienceData) {
      const list = audienceData as ClientEmail[]
      setAudience(list)
      const active = list.filter((a) => (a.status ?? "active").toLowerCase() === "active")
      if (active.length > 0) {
        setSelectedEmails([active[0].email])
      }
    }
    setLoading(false)
  }

  const handleSaveDraft = async () => {
    setSaving(true)
    const { error } = await supabase.from("email_campaigns").insert([{ ...formData, status: "draft" }])
    if (!error) {
      setFormData(defaultForm)
      await loadData()
    } else {
      alert("Error saving draft")
    }
    setSaving(false)
  }

  const handleSendEmail = async () => {
    setSaving(true)
    const { error } = await supabase
      .from("email_campaigns")
      .insert([{ ...formData, status: "sent", sent_at: new Date().toISOString() }])
    if (!error) {
      setFormData(defaultForm)
      await loadData()
    } else {
      alert("Error sending campaign")
    }
    setSaving(false)
  }

  const openGmailCompose = () => {
    const toList =
      selectAll && activeAudience.length > 0
        ? activeAudience.map((a) => a.email)
        : selectedEmails.length > 0
          ? selectedEmails
          : activeAudience[0]
            ? [activeAudience[0].email]
            : []
    const to = toList.join(",")
    if (!to) {
      setError("No recipient available. Add an email first.")
      return
    }
    const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(
      formData.subject_line || " ",
    )}&body=${encodeURIComponent(formData.content_html || "")}`
    window.open(url, "_blank")
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="space-y-6 p-6">
          <PageHeader
            title="Email Marketing"
            subtitle="Create, preview, and track campaigns"
            actions={
              <div className="flex gap-2">
                {error ? <span className="text-xs text-red-600">{error}</span> : null}
                <button
                  onClick={handleSaveDraft}
                  disabled={saving}
                  className="rounded-md border border-gray-200 px-3 py-2 text-sm disabled:opacity-60"
                >
                  Save draft
                </button>
                <button
                  onClick={handleSendEmail}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-60"
                >
                  {saving ? "Sending..." : (
                    <>
                      <Send size={16} />
                      Send
                    </>
                  )}
                </button>
                <button
                  onClick={openGmailCompose}
                  className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm"
                >
                  <ExternalLink size={16} />
                  Open Gmail
                </button>
              </div>
            }
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatsCard label="Sent" value={sentCount} />
            <StatsCard label="Drafts" value={draftCount} />
            <StatsCard label="Active audience" value={activeAudience.length} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="mb-4 border-b pb-2 text-sm font-semibold text-gray-900">Campaign details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase text-gray-500">Internal title</label>
                    <input
                      type="text"
                      placeholder="e.g., March Newsletter - VIPs"
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase text-gray-500">Subject line</label>
                    <input
                      type="text"
                      placeholder="What will they see in their inbox?"
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-gray-900"
                      value={formData.subject_line}
                      onChange={(e) => setFormData({ ...formData, subject_line: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase text-gray-500">Send to</label>
                    <div className="space-y-2">
                      <select
                        multiple
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900"
                        value={selectedEmails}
                        onChange={(e) => {
                          const options = Array.from(e.target.selectedOptions).map((o) => o.value)
                          setSelectedEmails(options)
                          setSelectAll(false)
                        }}
                        disabled={audience.length === 0}
                        size={6}
                      >
                        {audience.length === 0 ? (
                          <option value="">No emails found</option>
                        ) : (
                          audience
                            .filter((a) => (a.status ?? "active").toLowerCase() === "active")
                            .map((a) => (
                              <option key={a.id} value={a.email}>
                                {a.full_name ? `${a.full_name} — ${a.email}` : a.email}
                              </option>
                            ))
                        )}
                      </select>
                      <label className="flex items-center gap-2 text-xs text-gray-600">
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={(e) => {
                            const checked = e.target.checked
                            setSelectAll(checked)
                            setSelectedEmails(
                              checked ? audience.filter((a) => (a.status ?? "active").toLowerCase() === "active").map((a) => a.email) : selectedEmails,
                            )
                          }}
                        />
                        Select all active
                      </label>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Pulled from client_emails. Select multiple or choose all active.
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-3">
                  <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    {isPreview ? <Eye size={16} /> : <Code size={16} />}
                    {isPreview ? "Desktop preview" : "HTML content"}
                  </span>
                  <button
                    onClick={() => setIsPreview(!isPreview)}
                    className="rounded border border-gray-200 bg-white px-3 py-1 text-xs shadow-sm transition hover:bg-gray-100"
                  >
                    Switch to {isPreview ? "Editor" : "Preview"}
                  </button>
                </div>

                {isPreview ? (
                  <div className="flex min-h-[360px] justify-center bg-gray-100 p-6">
                    <div
                      className="w-full max-w-2xl overflow-auto bg-white p-6 shadow-md"
                      dangerouslySetInnerHTML={{ __html: formData.content_html }}
                    />
                  </div>
                ) : (
                  <textarea
                    className="h-[360px] w-full bg-gray-900 p-4 font-mono text-sm text-gray-100 outline-none"
                    value={formData.content_html}
                    onChange={(e) => setFormData({ ...formData, content_html: e.target.value })}
                  />
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Mail size={18} /> Recent history
                </h2>
                <div className="space-y-3">
                  {loading ? (
                    <p className="text-sm text-gray-500">Loading campaigns...</p>
                  ) : campaigns.length === 0 ? (
                    <p className="text-sm italic text-gray-500">No campaigns found.</p>
                  ) : (
                    campaigns.slice(0, 5).map((c) => (
                      <div key={c.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                        <div>
                          <p className="w-44 truncate font-medium text-gray-900">{c.title || "Untitled"}</p>
                          <p className="text-xs text-gray-500">
                            {(c.sent_at || c.created_at) ? new Date(c.sent_at || c.created_at || "").toLocaleDateString() : ""}
                          </p>
                        </div>
                        <span
                          className={`text-[10px] rounded-full px-2 py-1 font-bold uppercase ${
                            c.status === "sent" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <ChartCard title="Audience summary">
                <div className="text-3xl font-semibold">{activeAudience.length.toLocaleString()}</div>
                <p className="text-xs text-gray-600">
                  Total active subscribers from client_emails (status=active)
                </p>
              </ChartCard>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default EmailMarketing
