import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import PageHeader from "../components/PageHeader"
import StatsCard from "../components/StatsCard"
import ChartCard from "../components/ChartCard"

const BrandIdentity = () => {
  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="space-y-6 p-6">
          <PageHeader
            title="Brand Identity"
            subtitle="Consistency and recall"
            actions={<button className="rounded-md bg-black px-3 py-2 text-sm text-white">Upload asset</button>}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatsCard label="Brand recall" value="73%" delta="+4pp" />
            <StatsCard label="Asset compliance" value="96%" delta="+2pp" />
            <StatsCard label="NPS" value="58" delta="+3 pts" />
          </div>

          <ChartCard title="Share of voice">
            Competitive share across key categories and regions.
          </ChartCard>

          <ChartCard title="Asset usage">
            Top-performing creatives and adherence to guidelines.
          </ChartCard>
        </main>
      </div>
    </div>
  )
}

export default BrandIdentity
