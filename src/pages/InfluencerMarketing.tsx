import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import PageHeader from "../components/PageHeader"
import StatsCard from "../components/StatsCard"
import ChartCard from "../components/ChartCard"

const InfluencerMarketing = () => {
  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="space-y-6 p-6">
          <PageHeader
            title="Influencer Marketing"
            subtitle="Creator collaborations"
            actions={<button className="rounded-md bg-black px-3 py-2 text-sm text-white">Add creator</button>}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatsCard label="Active creators" value="34" delta="+5 onboarded" />
            <StatsCard label="Avg. CPA" value="$29.40" delta="-8%" />
            <StatsCard label="Earned media" value="$210k" delta="+16%" />
          </div>

          <ChartCard title="Creator performance">
            Content output, engagement, and attributed conversions.
          </ChartCard>

          <ChartCard title="Spend by tier">
            Budget allocation across nano, micro, and macro partners.
          </ChartCard>
        </main>
      </div>
    </div>
  )
}

export default InfluencerMarketing
