import { useEffect, useMemo, useState } from "react"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import PageHeader from "../components/PageHeader"
import StatsCard from "../components/StatsCard"
import ChartCard from "../components/ChartCard"
import { supabase } from "../lib/supabase"

type ProductRow = {
  id: string
  name?: string | null
  category: string | null
  price: string | null
  size: string | null
  numericPrice?: number | null
}

const formatCurrency = (value: number) =>
  value.toLocaleString("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 2 })

const MarketingAnalytics = () => {
  const [rows, setRows] = useState<ProductRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parsePrice = (value: string | null) => {
    if (!value) return null
    const cleaned = value.replace(/[^0-9.]/g, "")
    const parsed = Number(cleaned)
    return Number.isFinite(parsed) ? parsed : null
  }

  const loadRows = async () => {
    setLoading(true)
    setError(null)
    const { data, error: queryError } = await supabase
      .from("scraped_products")
      .select("id,category,price,size,name")
      .order("price", { ascending: true })
      .limit(300)

    if (queryError) {
      setError(queryError.message)
      setRows([])
    } else if (data) {
      setRows(data)
    }

    setLoading(false)
  }

  useEffect(() => {
    void loadRows()
  }, [])

  // Category distribution for pie chart
  const categoryDistribution = useMemo(() => {
    const categoryCount = new Map<string, number>()
    
    rows.forEach((row) => {
      const category = row.category?.trim() || "Uncategorized"
      categoryCount.set(category, (categoryCount.get(category) || 0) + 1)
    })

    return Array.from(categoryCount.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8) // Top 8 categories
  }, [rows])

  const sizeAggregates = useMemo(() => {
    const bucket = new Map<string, { category: string; size: string; sum: number; count: number }>()

    rows.forEach((row) => {
      const category = row.category?.trim() || "Uncategorized"
      const size = row.size?.trim() || "Unspecified"
      const key = `${category}__${size}`
      const price = parsePrice(row.price)
      if (price === null) return
      if (!bucket.has(key)) {
        bucket.set(key, { category, size, sum: 0, count: 0 })
      }
      const entry = bucket.get(key)!
      entry.sum += price
      entry.count += 1
    })

    return Array.from(bucket.values())
      .map((item) => ({ ...item, average: item.sum / item.count }))
      .sort((a, b) => b.average - a.average)
  }, [rows])

  // Bar chart data - Average prices by category
  const categoryAvgPrices = useMemo(() => {
    const categoryStats = new Map<string, { sum: number; count: number }>()
    
    rows.forEach((row) => {
      const category = row.category?.trim() || "Uncategorized"
      const price = parsePrice(row.price)
      if (price === null) return
      
      if (!categoryStats.has(category)) {
        categoryStats.set(category, { sum: 0, count: 0 })
      }
      const stats = categoryStats.get(category)!
      stats.sum += price
      stats.count += 1
    })

    return Array.from(categoryStats.entries())
      .map(([category, { sum, count }]) => ({
        category,
        avgPrice: sum / count,
        count
      }))
      .sort((a, b) => b.avgPrice - a.avgPrice)
      .slice(0, 10)
  }, [rows])

  // Line chart data - Price distribution (price ranges)
  const priceDistribution = useMemo(() => {
    const ranges = [
      { min: 0, max: 1000, label: "0-1K" },
      { min: 1000, max: 5000, label: "1K-5K" },
      { min: 5000, max: 10000, label: "5K-10K" },
      { min: 10000, max: 20000, label: "10K-20K" },
      { min: 20000, max: 50000, label: "20K-50K" },
      { min: 50000, max: 100000, label: "50K-100K" },
      { min: 100000, max: Infinity, label: "100K+" }
    ]

    const distribution = ranges.map(range => ({
      range: range.label,
      count: 0,
      min: range.min,
      max: range.max
    }))

    rows.forEach((row) => {
      const price = parsePrice(row.price)
      if (price === null) return
      
      const rangeIndex = distribution.findIndex(r => price >= r.min && price < r.max)
      if (rangeIndex !== -1) {
        distribution[rangeIndex].count++
      }
    })

    return distribution
  }, [rows])

  // Size distribution for pie chart
  const sizeDistribution = useMemo(() => {
    const sizeCount = new Map<string, number>()
    
    rows.forEach((row) => {
      const size = row.size?.trim() || "Unspecified"
      sizeCount.set(size, (sizeCount.get(size) || 0) + 1)
    })

    return Array.from(sizeCount.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [rows])

  const totalPriced = useMemo(
    () =>
      rows.reduce((acc, row) => {
        const price = parsePrice(row.price)
        return price === null ? acc : acc + 1
      }, 0),
    [rows],
  )

  const sortedPrices = useMemo(() => {
    return rows
      .map((row) => ({ ...row, numericPrice: parsePrice(row.price) }))
      .filter((row) => row.numericPrice !== null)
      .sort((a, b) => (b.numericPrice ?? 0) - (a.numericPrice ?? 0))
  }, [rows])

  const topPriceSlices = useMemo(() => {
    return sortedPrices.slice(0, 10).map((row, idx) => ({
      name: (row as any).name?.substring(0, 20) ?? row.category ?? `Item ${idx + 1}`,
      value: row.numericPrice ?? 0,
    }))
  }, [sortedPrices])

  const pieColors = ["#111827", "#0ea5e9", "#10b981", "#f97316", "#a855f7", "#f59e0b", "#ef4444", "#3b82f6", "#14b8a6", "#4b5563"]

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="space-y-6 p-6">
          <PageHeader
            title="Marketing Analytics"
            subtitle="Advanced product analytics with multiple visualizations"
            actions={
              <div className="flex items-center gap-2">
                {error ? <span className="text-xs text-red-600">Error: {error}</span> : null}
                <button
                  onClick={() => void loadRows()}
                  className="rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-60"
                  disabled={loading}
                >
                  {loading ? "Refreshing..." : "Refresh data"}
                </button>
              </div>
            }
          />

          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <StatsCard label="Category/Size Groups" value={sizeAggregates.length} />
            <StatsCard label="Rows with prices" value={totalPriced} />
            <StatsCard label="Total products" value={rows.length} />
            <StatsCard label="Avg Price" value={formatCurrency(
              rows.reduce((acc, row) => {
                const price = parsePrice(row.price)
                return price ? acc + price : acc
              }, 0) / (totalPriced || 1)
            )} />
          </div>

          {/* Pie Charts Row */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard title="Category Distribution">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {categoryDistribution.map((_, idx) => (
                        <Cell key={idx} fill={pieColors[idx % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title="Size Distribution">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sizeDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {sizeDistribution.map((_, idx) => (
                        <Cell key={idx} fill={pieColors[idx % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          {/* Bar Chart */}
          <ChartCard title="Average Price by Category (Top 10)">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryAvgPrices} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="category" 
                    angle={-45} 
                    textAnchor="end" 
                    height={70} 
                    interval={0}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="avgPrice" fill="#111827" name="Average Price" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Line Chart */}
          <ChartCard title="Price Distribution">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#111827" strokeWidth={2} name="Number of Products" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Top Products Pie Chart */}
          <ChartCard title="Top 10 Most Expensive Products">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topPriceSlices}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value }) => `${name.substring(0, 15)}...`}
                  >
                    {topPriceSlices.map((_, idx) => (
                      <Cell key={idx} fill={pieColors[idx % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Data Tables Row */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Average price by category & size</h3>
                <span className="text-xs text-gray-500">Top groups by average</span>
              </div>
              <div className="overflow-x-auto max-h-96">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 font-medium">Category</th>
                      <th className="px-3 py-2 font-medium">Size</th>
                      <th className="px-3 py-2 font-medium">Average price</th>
                      <th className="px-3 py-2 font-medium">Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sizeAggregates.length === 0 ? (
                      <tr>
                        <td className="px-3 py-4 text-gray-600" colSpan={4}>
                          {loading ? "Loading..." : "No price data yet."}
                        </td>
                      </tr>
                    ) : (
                      sizeAggregates.slice(0, 15).map((item) => (
                        <tr key={`${item.category}-${item.size}`} className="hover:bg-gray-50">
                          <td className="px-3 py-3 font-medium text-gray-900">{item.category}</td>
                          <td className="px-3 py-3 text-gray-700">{item.size}</td>
                          <td className="px-3 py-3 text-gray-700">{formatCurrency(item.average)}</td>
                          <td className="px-3 py-3 text-gray-500">{item.count}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Prices (high → low)</h3>
                <span className="text-xs text-gray-500">Top 20 items</span>
              </div>
              <div className="overflow-x-auto max-h-96">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 font-medium">Name</th>
                      <th className="px-3 py-2 font-medium">Category</th>
                      <th className="px-3 py-2 font-medium">Size</th>
                      <th className="px-3 py-2 font-medium">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sortedPrices.length === 0 ? (
                      <tr>
                        <td className="px-3 py-4 text-gray-600" colSpan={4}>
                          {loading ? "Loading..." : "No price data yet."}
                        </td>
                      </tr>
                    ) : (
                      sortedPrices.slice(0, 20).map((row) => (
                        <tr key={row.id} className="hover:bg-gray-50">
                          <td className="px-3 py-3 font-medium text-gray-900">{(row as any).name ?? "--"}</td>
                          <td className="px-3 py-3 text-gray-700">{row.category ?? "--"}</td>
                          <td className="px-3 py-3 text-gray-700">{row.size ?? "--"}</td>
                          <td className="px-3 py-3 text-gray-700">{formatCurrency(row.numericPrice ?? 0)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <ChartCard title="Data Freshness">
            <div className="space-y-2">
              <p>Last refresh pulls up to 300 recent rows from scraped_products.</p>
              <p className="text-xs text-gray-500">Data last updated: {new Date().toLocaleString()}</p>
            </div>
          </ChartCard>
        </main>
      </div>
    </div>
  )
}

export default MarketingAnalytics