import { useEffect, useMemo, useState } from "react"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import PageHeader from "../components/PageHeader"
import { supabase } from "../lib/supabase"

type ProductRow = {
  id: string
  name: string | null
  price: string | null
  category: string | null
  size: string | null
  created_at: string
}

const DataSet = () => {
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [category, setCategory] = useState("")
  const [size, setSize] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [rows, setRows] = useState<ProductRow[]>([])
  const [status, setStatus] = useState<string | null>(null)
  const [filterName, setFilterName] = useState("")
  const [filterPrice, setFilterPrice] = useState("")
  const [filterCategory, setFilterCategory] = useState("")

  const loadRows = async () => {
    const { data, error } = await supabase
      .from("scraped_products")
      .select("id,name,price,category,size,created_at")
      .order("created_at", { ascending: false })
      .limit(50)

    if (!error && data) {
      setRows(data)
    }
  }

  useEffect(() => {
    void loadRows()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setStatus(null)

    const { error } = await supabase.from("scraped_products").insert([
      {
        name,
        price,
        category,
        size,
      },
    ])

    if (error) {
      setStatus("Failed to save: " + error.message)
    } else {
      setStatus("Product saved.")
      setName("")
      setPrice("")
      setCategory("")
      setSize("")
      await loadRows()
    }

    setSubmitting(false)
  }

  const filteredRows = useMemo(
    () =>
      rows.filter(
        (row) =>
          (row.name ?? "").toLowerCase().includes(filterName.toLowerCase()) &&
          (row.price ?? "").toLowerCase().includes(filterPrice.toLowerCase()) &&
          (row.category ?? "").toLowerCase().includes(filterCategory.toLowerCase()),
      ),
    [rows, filterName, filterPrice, filterCategory],
  )

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="space-y-6 p-6">
          <PageHeader
            title="Data Set"
            subtitle="Upload products to scraped_products"
            actions={<span className="text-xs text-gray-500">Manual entry</span>}
          />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <form
              onSubmit={handleSubmit}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:col-span-1"
            >
              <h3 className="mb-3 text-sm font-semibold text-gray-900">Add product</h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-gray-600" htmlFor="name">
                    Name
                  </label>
                  <input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-600" htmlFor="price">
                    Price
                  </label>
                  <input
                    id="price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="$120"
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-600" htmlFor="category">
                    Category
                  </label>
                  <input
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-600" htmlFor="size">
                    Size
                  </label>
                  <input
                    id="size"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    placeholder="e.g., 500ml, 1kg"
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-60"
                >
                  {submitting ? "Saving..." : "Save product"}
                </button>
                {status ? <p className="text-xs text-gray-600">{status}</p> : null}
              </div>
            </form>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Recent products</h3>
                <button
                  onClick={() => void loadRows()}
                  className="text-xs text-gray-600 hover:text-gray-900"
                >
                  Refresh
                </button>
              </div>
              <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-3">
                <input
                  placeholder="Filter by name"
                  className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                />
                <input
                  placeholder="Filter by price"
                  className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                  value={filterPrice}
                  onChange={(e) => setFilterPrice(e.target.value)}
                />
                <input
                  placeholder="Filter by category"
                  className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-3 py-2 font-medium">Name</th>
                      <th className="px-3 py-2 font-medium">Price</th>
                      <th className="px-3 py-2 font-medium">Category</th>
                      <th className="px-3 py-2 font-medium">Size</th>
                      <th className="px-3 py-2 font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td className="px-3 py-4 text-gray-600" colSpan={5}>
                          No products yet.
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((row) => (
                        <tr key={row.id} className="hover:bg-gray-50">
                          <td className="px-3 py-3 font-medium text-gray-900">{row.name ?? "--"}</td>
                          <td className="px-3 py-3 text-gray-600">{row.price ?? "--"}</td>
                          <td className="px-3 py-3 text-gray-600">{row.category ?? "--"}</td>
                          <td className="px-3 py-3 text-gray-600">{row.size ?? "--"}</td>
                          <td className="px-3 py-3 text-gray-500">
                            {new Date(row.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default DataSet
