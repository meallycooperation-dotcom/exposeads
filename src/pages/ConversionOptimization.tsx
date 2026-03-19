import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import PageHeader from "../components/PageHeader"
import StatsCard from "../components/StatsCard"
import ChartCard from "../components/ChartCard"

const ConversionOptimization = () => {
  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="space-y-6 p-6">
          <PageHeader
            title="Conversion Optimization"
            subtitle="Testing and velocity"
            actions={<button className="rounded-md bg-black px-3 py-2 text-sm text-white">Create experiment</button>}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatsCard label="Win rate" value="34%" delta="+5pp" />
            <StatsCard label="Active tests" value="9" delta="+2 new" />
            <StatsCard label="Lift (median)" value="+7.4%" />
          </div>

          <ChartCard title="Experiment backlog">
            Velocity across research, build, and analyze stages.
          </ChartCard>

          <ChartCard title="Top wins">
            Highest impact tests with revenue or signup lift.
          </ChartCard>
        </main>
      </div>
    </div>
  )
}

export default ConversionOptimization
