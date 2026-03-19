import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import PageHeader from "../components/PageHeader"
import StatsCard from "../components/StatsCard"
import ChartCard from "../components/ChartCard"

const SocialMediaMarketing = () => {
  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="space-y-6 p-6">
          <PageHeader
            title="Social Media Marketing"
            subtitle="Engagement and reach"
            actions={<button className="rounded-md bg-black px-3 py-2 text-sm text-white">Create post</button>}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatsCard label="Total impressions" value="2.8M" delta="+18% vs last month" />
            <StatsCard label="Engagement rate" value="4.7%" delta="+0.5pp" />
            <StatsCard label="Follower growth" value="+12,430" delta="+9% vs last month" />
          </div>

          <ChartCard title="Engagement trends">
            Daily likes, comments, and saves across Instagram, TikTok, and LinkedIn.
          </ChartCard>

          <ChartCard title="Platform breakdown">
            Performance split by channel with CPM and CPC benchmarks.
          </ChartCard>
        </main>
      </div>
    </div>
  )
}

export default SocialMediaMarketing
