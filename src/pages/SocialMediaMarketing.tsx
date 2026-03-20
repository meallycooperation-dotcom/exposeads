import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import PageHeader from "../components/PageHeader"
import StatsCard from "../components/StatsCard"
import ChartCard from "../components/ChartCard"

type PostRecord = {
  post_id: number
  title: string
  likes_count: number
  comment_count: number
  view_count: number
  created_at?: string
}

type PieSlice = {
  label: string
  value: number
  color: string
  percent: number
  offset: number
}

const buildSlices = (post?: Partial<PostRecord>): PieSlice[] => {
  const likes = post?.likes_count || 0
  const comments = post?.comment_count || 0
  const views = post?.view_count || 0
  const total = likes + comments + views || 1

  const entries: Array<[string, number, string]> = [
    ["Likes", likes, "#6366f1"],
    ["Comments", comments, "#f59e0b"],
    ["Views", views, "#10b981"],
  ]

  let cumulative = 0
  return entries.map(([label, value, color]) => {
    const percent = (value / total) * 100
    const slice: PieSlice = {
      label,
      value,
      color,
      percent,
      offset: cumulative,
    }
    cumulative += percent
    return slice
  })
}

const PostBreakdown = ({
  post,
  onClose,
}: {
  post?: PostRecord
  onClose: () => void
}) => {
  if (!post) return null

  const slices = buildSlices(post)

  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Post breakdown</h3>
          <p className="text-sm text-gray-500">{post.title || "Untitled post"}</p>
        </div>
        <button
          className="text-sm text-gray-600 underline"
          onClick={onClose}
        >
          Close
        </button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <svg viewBox="0 0 120 120" className="h-40 w-40 self-center">
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="20"
          />
          {slices.map((slice) => (
            <circle
              key={slice.label}
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke={slice.color}
              strokeWidth="20"
              strokeDasharray={`${slice.percent} ${100 - slice.percent}`}
              strokeDashoffset={-slice.offset}
              strokeLinecap="butt"
              transform="rotate(-90 60 60)"
            />
          ))}
        </svg>

        <div className="flex-1 space-y-2">
          {slices.map((slice) => (
            <div key={slice.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="text-sm text-gray-700">{slice.label}</span>
              </div>
              <div className="text-sm font-semibold text-gray-900">
                {slice.value.toLocaleString()} ({slice.percent.toFixed(1)}%)
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const SocialMediaMarketing = () => {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({
    totalLikes: 0,
    totalComments: 0,
    totalViews: 0,
  })
  const [showForm, setShowForm] = useState(false)
  const [editingPostId, setEditingPostId] = useState<number | null>(null)
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null)
  const [sortOption, setSortOption] = useState<
    | "date_desc"
    | "date_asc"
    | "likes_desc"
    | "likes_asc"
    | "views_desc"
    | "views_asc"
    | "comments_desc"
    | "comments_asc"
  >("date_desc")
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null)

  // form state
  const [form, setForm] = useState<any>({
    title: "",
    description: "",
    post_url: "",
    tags: "",
    source: "instagram",
    likes_count: 0,
    comment_count: 0,
    view_count: 0,
  })

  const [image, setImage] = useState<File | null>(null)

  // 🔹 FETCH POSTS
  const fetchPosts = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from("social_post_metrics")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error(error)
    } else {
      const postsData = data || []
      setPosts(postsData)

      const totals = postsData.reduce(
        (acc, post) => {
          acc.likes += post.likes_count || 0
          acc.comments += post.comment_count || 0
          acc.views += post.view_count || 0
          return acc
        },
        { likes: 0, comments: 0, views: 0 }
      )

      setMetrics({
        totalLikes: totals.likes,
        totalComments: totals.comments,
        totalViews: totals.views,
      })
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  // 🔹 UPLOAD IMAGE
  const uploadImage = async (file: File) => {
    const path = `posts/${Date.now()}-${file.name}`

    const { error } = await supabase.storage
      .from("social_post_metrics")
      .upload(path, file, { upsert: true })

    if (error) throw error

    const { data } = supabase.storage
      .from("social_post_metrics")
      .getPublicUrl(path)

    return data.publicUrl
  }

  // 🔹 SUBMIT FORM
  const handleSubmit = async (e: any) => {
    e.preventDefault()

    try {
      let image_url = currentImageUrl

      if (image) {
        image_url = await uploadImage(image)
      }

      const payload = {
        title: form.title,
        description: form.description,
        post_url: form.post_url,
        source: form.source,
        image_url,
        likes_count: Number(form.likes_count) || 0,
        comment_count: Number(form.comment_count) || 0,
        view_count: Number(form.view_count) || 0,
        tags: form.tags
          ? form.tags.split(",").map((t: string) => t.trim())
          : [],
      }

      let error

      if (editingPostId) {
        const { error: updateError } = await supabase
          .from("social_post_metrics")
          .update(payload)
          .eq("post_id", editingPostId)
        error = updateError
      } else {
        const { error: insertError } = await supabase
          .from("social_post_metrics")
          .insert(payload)
        error = insertError
      }

      if (error) throw error

      alert(editingPostId ? "Post updated" : "Post saved 🚀")
      setForm({
        title: "",
        description: "",
        post_url: "",
        tags: "",
        source: "instagram",
        likes_count: 0,
        comment_count: 0,
        view_count: 0,
      })
      setImage(null)
      setEditingPostId(null)
      setCurrentImageUrl(null)
      setShowForm(false)

      fetchPosts()
    } catch (err: any) {
      console.error(err)
      alert("Error saving post")
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar />

        <main className="space-y-6 p-6">
          <PageHeader
            title="Social Media Marketing"
            subtitle="Engagement and reach"
            actions={
              <button
                className="rounded-md bg-black px-3 py-2 text-sm text-white"
                onClick={() => {
                  setEditingPostId(null)
                  setCurrentImageUrl(null)
                  setForm({
                    title: "",
                    description: "",
                    post_url: "",
                    tags: "",
                    source: "instagram",
                    likes_count: 0,
                    comment_count: 0,
                    view_count: 0,
                  })
                  setImage(null)
                  setShowForm(true)
                  window.scrollTo({ top: 0, behavior: "smooth" })
                }}
              >
                Create post
              </button>
            }
          />

          {/* STATS */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatsCard
              label="Total views"
              value={new Intl.NumberFormat("en-US", { notation: "compact" }).format(metrics.totalViews)}
            />
            <StatsCard
              label="Total likes"
              value={new Intl.NumberFormat("en-US", { notation: "compact" }).format(metrics.totalLikes)}
            />
            <StatsCard
              label="Total comments"
              value={new Intl.NumberFormat("en-US", { notation: "compact" }).format(metrics.totalComments)}
            />
          </div>

          {/* POSTS LIST */}
          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold">Posts</h2>

            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-gray-600">
                Showing {posts.length} posts
              </p>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700">Sort by:</label>
                <select
                  value={sortOption}
                  onChange={(e) =>
                    setSortOption(e.target.value as typeof sortOption)
                  }
                  className="rounded border border-gray-300 px-2 py-1 text-sm"
                >
                  <option value="date_desc">Date (newest)</option>
                  <option value="date_asc">Date (oldest)</option>
                  <option value="likes_desc">Likes (highest)</option>
                  <option value="likes_asc">Likes (lowest)</option>
                  <option value="views_desc">Views (highest)</option>
                  <option value="views_asc">Views (lowest)</option>
                  <option value="comments_desc">Comments (highest)</option>
                  <option value="comments_asc">Comments (lowest)</option>
                </select>
              </div>
            </div>

            {loading ? (
              <p>Loading...</p>
            ) : posts.length === 0 ? (
              <p>No posts yet</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                {[...posts]
                  .sort((a, b) => {
                    const dir = sortOption.endsWith("asc") ? 1 : -1
                    switch (sortOption) {
                      case "likes_asc":
                      case "likes_desc":
                        return dir * ((a.likes_count || 0) - (b.likes_count || 0))
                      case "views_asc":
                      case "views_desc":
                        return dir * ((a.view_count || 0) - (b.view_count || 0))
                      case "comments_asc":
                      case "comments_desc":
                        return dir * ((a.comment_count || 0) - (b.comment_count || 0))
                      default: {
                        // dates
                        return (
                          dir *
                          (new Date(a.created_at || 0).getTime() -
                            new Date(b.created_at || 0).getTime())
                        )
                      }
                    }
                  })
                  .map((post) => (
                  <div
                    key={post.post_id}
                    onClick={() => setSelectedPostId(post.post_id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setSelectedPostId(post.post_id)
                      }
                    }}
                    className={`rounded-lg border p-3 space-y-2 cursor-pointer transition-shadow hover:shadow-md ${
                      selectedPostId === post.post_id ? "border-indigo-500 shadow-md" : "border-gray-200"
                    }`}
                  >
                    {post.image_url && (
                      <img
                        src={post.image_url}
                        alt="post"
                        className="h-40 w-full object-cover rounded"
                      />
                    )}

                    <h3 className="font-semibold">{post.title}</h3>
                    <p className="text-sm text-gray-600">
                      {post.description}
                    </p>

                    <a
                      href={post.post_url}
                      target="_blank"
                      className="text-blue-600 text-sm underline"
                    >
                      View Post
                    </a>

                    <div className="text-xs text-gray-500">
                      {post.tags?.map((tag: string, i: number) => (
                        <span key={i} className="mr-1">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Likes: {post.likes_count}</span>
                      <span>Comments: {post.comment_count}</span>
                      <span>Views: {post.view_count}</span>
                    </div>

                    <button
                      className="text-sm text-indigo-600 underline"
                      onClick={() => {
                        setEditingPostId(post.post_id)
                        setForm({
                          title: post.title || "",
                          description: post.description || "",
                          post_url: post.post_url || "",
                          tags: Array.isArray(post.tags) ? post.tags.join(", ") : "",
                          source: post.source || "instagram",
                          likes_count: post.likes_count || 0,
                          comment_count: post.comment_count || 0,
                          view_count: post.view_count || 0,
                        })
                        setCurrentImageUrl(post.image_url || null)
                        setImage(null)
                        setShowForm(true)
                        window.scrollTo({ top: 0, behavior: "smooth" })
                      }}
                    >
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedPostId && (
            <PostBreakdown
              post={posts.find((p) => p.post_id === selectedPostId)}
              onClose={() => setSelectedPostId(null)}
            />
          )}

          {/* FORM */}
          {showForm && (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-xl bg-white p-6 shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  {editingPostId ? "Update Post" : "Create Post"}
                </h2>
                {editingPostId && (
                  <p className="text-sm text-gray-500">
                    Editing post #{editingPostId}
                  </p>
                )}
              </div>
              {editingPostId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingPostId(null)
                    setCurrentImageUrl(null)
                    setForm({
                      title: "",
                      description: "",
                      post_url: "",
                      tags: "",
                      source: "instagram",
                      likes_count: 0,
                      comment_count: 0,
                      view_count: 0,
                    })
                    setImage(null)
                  }}
                  className="text-sm text-gray-600 underline"
                >
                  Cancel edit
                </button>
              )}
            </div>

            <input
              type="text"
              placeholder="Title"
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
              className="w-full rounded border p-2"
            />

            <textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full rounded border p-2"
            />

            <input
              type="text"
              placeholder="Post URL"
              value={form.post_url}
              onChange={(e) =>
                setForm({ ...form, post_url: e.target.value })
              }
              className="w-full rounded border p-2"
              required
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Likes</label>
                <input
                  type="number"
                  min={0}
                  value={form.likes_count}
                  onChange={(e) =>
                    setForm({ ...form, likes_count: Number(e.target.value) })
                  }
                  className="w-full rounded border p-2"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Comments</label>
                <input
                  type="number"
                  min={0}
                  value={form.comment_count}
                  onChange={(e) =>
                    setForm({ ...form, comment_count: Number(e.target.value) })
                  }
                  className="w-full rounded border p-2"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Views</label>
                <input
                  type="number"
                  min={0}
                  value={form.view_count}
                  onChange={(e) =>
                    setForm({ ...form, view_count: Number(e.target.value) })
                  }
                  className="w-full rounded border p-2"
                />
              </div>
            </div>

            <input
              type="text"
              placeholder="Tags (comma separated)"
              value={form.tags}
              onChange={(e) =>
                setForm({ ...form, tags: e.target.value })
              }
              className="w-full rounded border p-2"
            />

            <select
              value={form.source}
              onChange={(e) =>
                setForm({ ...form, source: e.target.value })
              }
              className="w-full rounded border p-2"
            >
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="linkedin">LinkedIn</option>
              <option value="facebook">Facebook</option>
            </select>

            <div>
              <label className="text-sm">Upload Image</label>
              <input
                type="file"
                onChange={(e) =>
                  setImage(e.target.files?.[0] || null)
                }
              />
              {currentImageUrl && !image && (
                <p className="text-xs text-gray-500">Keeping existing image</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                className="rounded-md border px-4 py-2"
                onClick={() => {
                  setShowForm(false)
                  setEditingPostId(null)
                  setCurrentImageUrl(null)
                  setImage(null)
                }}
              >
                Close
              </button>
              <button
                type="submit"
                className="rounded-md bg-black px-4 py-2 text-white"
              >
                {editingPostId ? "Update Post" : "Save Post"}
              </button>
            </div>
          </form>
          )}

          {/* CHARTS */}
          <ChartCard title="Engagement trends">
            Daily likes, comments, and saves across platforms.
          </ChartCard>

          <ChartCard title="Platform breakdown">
            Performance split by channel.
          </ChartCard>
        </main>
      </div>
    </div>
  )
}

export default SocialMediaMarketing
