import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import PageHeader from "../components/PageHeader"
import StatsCard from "../components/StatsCard"
import ChartCard from "../components/ChartCard"

const ContentMarketing = () => {
  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="space-y-6 p-6">
          <PageHeader
            title="Content Marketing"
            subtitle="Publishing cadence"
            actions={<button className="rounded-md bg-black px-3 py-2 text-sm text-white">New brief</button>}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatsCard label="Articles shipped" value="24" delta="+6 vs last month" />
            <StatsCard label="Avg. time on page" value="4m 12s" delta="+22s" />
            <StatsCard label="Newsletter signups" value="3,420" delta="+14%" />
          </div>

          <ChartCard title="Content performance">
            Top pieces by engaged time and assisted conversions.
          </ChartCard>

          <ChartCard title="Editorial calendar">
            Upcoming drafts, review dates, and publication deadlines.
          </ChartCard>
        </main>
      </div>
    </div>
  )
}

export default ContentMarketing
