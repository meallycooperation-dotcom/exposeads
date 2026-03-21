import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"
import PageHeader from "../components/PageHeader"
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  TrendingUp, 
  TrendingDown, 
  MousePointer, 
  FileText, 
  Mail, 
  Users, 
  ChevronDown, 
  Calendar,
  Globe
} from 'lucide-react';
import { Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, ComposedChart, Area, PieChart, Pie, Cell, Legend } from "recharts"

// Dashboard Data Models
interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  vsValue: string | number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down';
}

interface ChartDataPoint {
  label: string;
  value: number;
  previousValue?: number;
}

// Metric Card Component
const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, vsValue, icon, trend }) => {
  const isPositive = trend ? trend === 'up' : change > 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  const trendColor = isPositive ? 'text-green-500' : 'text-red-500';
  
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-3xl font-bold text-gray-800">{value}</span>
        <div className={`flex items-center text-sm ${trendColor}`}>
          <TrendIcon className="w-4 h-4 mr-0.5" />
          <span>{Math.abs(change)}%</span>
        </div>
      </div>
      <div className="flex items-center text-xs text-gray-400">
        <span>Versus</span>
        <span className="ml-1 font-medium text-gray-600">{vsValue}</span>
        <span className="ml-1">Previous period</span>
      </div>
    </div>
  );
};

// Main Dashboard Component
const ContentMarketing: React.FC = () => {
  const [dateRange, setDateRange] = useState('This month');
  const [acquisitionSource, setAcquisitionSource] = useState('All');
  const [contentType, setContentType] = useState('All');
  const [pageViewsData, setPageViewsData] = useState<ChartDataPoint[]>([]);
  const [organicTrafficData, setOrganicTrafficData] = useState<ChartDataPoint[]>([]);
  const [leadSourceSegments, setLeadSourceSegments] = useState<{ label: string; value: number; color: string }[]>([]);
  const [kpi, setKpi] = useState({
    ctr: 0,
    publishedContent: 0,
    emailsSent: 0,
    newLeads: 0,
  });

  useEffect(() => {
    void loadContentMarketingData();
  }, []);

  const loadContentMarketingData = async () => {
    const { data: contentData, error: contentError } = await supabase
      .from('content_calendar')
      .select('post_date,channel,post_topic_type');

    const { data: leadsData, error: leadsError } = await supabase.from('leads').select('source');

    const { data: emailCampaignsData, error: emailCampaignsError } = await supabase
      .from('email_campaigns')
      .select('status');

    const { data: socialPostsData, error: socialPostsError } = await supabase
      .from('social_post_metrics')
      .select('post_id');

    if (contentError || leadsError || emailCampaignsError || socialPostsError) {
      console.error(contentError || leadsError || emailCampaignsError || socialPostsError);
      return;
    }

    const sentEmails = (emailCampaignsData ?? []).filter((c: { status: string }) => c.status === 'sent').length;

    const pageViews = (contentData ?? []).reduce((acc: { [key: string]: number }, curr: { channel: string }) => {
      acc[curr.channel] = (acc[curr.channel] || 0) + 1;
      return acc;
    }, {});

    setPageViewsData(
      Object.entries(pageViews).map(([label, value]) => ({
        label,
        value,
        previousValue: value * 0.8, // dummy previous value
      }))
    );
    
    setKpi({
      ctr: 3.7,
      publishedContent: socialPostsData?.length || 0,
      emailsSent: sentEmails,
      newLeads: leadsData?.length || 0,
    });

    const organicTraffic = (contentData ?? [])
      .filter((d: { channel: string }) => d.channel === 'Organic Search')
      .reduce((acc: { [key: string]: number }, curr: { post_date: string }) => {
        const month = new Date(curr.post_date).toLocaleString('default', { month: 'short', year: 'numeric' });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {});
    
    setOrganicTrafficData(
      Object.entries(organicTraffic).map(([label, value]) => ({
        label,
        value,
        previousValue: value * 0.8,
      }))
    );

    const leadSources = (leadsData ?? []).reduce((acc: { [key: string]: number }, curr: { source: string }) => {
      acc[curr.source] = (acc[curr.source] || 0) + 1;
      return acc;
    }, {});

    const totalLeads = leadsData?.length || 1;
    setLeadSourceSegments(
      Object.entries(leadSources).map(([label, value]) => ({
        label,
        value: (value / totalLeads) * 100,
        color:
          label === 'Organic'
            ? '#3b82f6'
            : label === 'Email'
            ? '#10b981'
            : label === 'Referral'
            ? '#f59e0b'
            : '#ef4444',
      }))
    );
  };
  
  
  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <PageHeader
            title="Content Marketing"
            subtitle="General reporting overview"
            actions={
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <select 
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="bg-transparent text-sm font-medium outline-none"
                  >
                    <option>This month</option>
                    <option>Last month</option>
                    <option>This quarter</option>
                    <option>Last year</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <select 
                    value={acquisitionSource}
                    onChange={(e) => setAcquisitionSource(e.target.value)}
                    className="bg-transparent text-sm font-medium outline-none"
                  >
                    <option>All</option>
                    <option>Organic</option>
                    <option>Paid</option>
                    <option>Referral</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <select 
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value)}
                    className="bg-transparent text-sm font-medium outline-none"
                  >
                    <option>All</option>
                    <option>Blog</option>
                    <option>Video</option>
                    <option>Infographic</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            }
          />

          {/* Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard 
              title="Clickthrough Rate (CTR)"
              value={`${kpi.ctr}%`}
              change={19}
              vsValue="3.0%"
              icon={<MousePointer className="w-5 h-5" />}
            />
            <MetricCard 
              title="Total Published Content"
              value={kpi.publishedContent}
              change={48}
              vsValue={Math.round(kpi.publishedContent * 0.8)}
              icon={<FileText className="w-5 h-5" />}
            />
            <MetricCard 
              title="Number of Emails Sent"
              value={kpi.emailsSent}
              change={18}
              vsValue={Math.round(kpi.emailsSent * 0.8)}
              icon={<Mail className="w-5 h-5" />}
            />
            <MetricCard 
              title="Number of New Leads"
              value={kpi.newLeads}
              change={20}
              vsValue={5}
              icon={<Users className="w-5 h-5" />}
            />
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Page Views */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Page Views</h3>
                <div className="flex gap-2">
                  <span className="flex items-center gap-1 text-xs"><div className="w-3 h-3 bg-blue-500 rounded-sm"></div> This Period</span>
                  <span className="flex items-center gap-1 text-xs"><div className="w-3 h-3 bg-gray-300 rounded-sm"></div> Previous</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={pageViewsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="previousValue" fill="#d1d5db" name="Previous" />
                  <Bar dataKey="value" fill="#3b82f6" name="This Period" />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-4 text-xs text-gray-500">
                <span>Organic Search</span>
                <span>Referral</span>
                <span>Email Campaigns</span>
              </div>
            </div>
            
            {/* Email Marketing Funnel */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Email Marketing Funnel</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[]} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex flex-wrap gap-4 justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-xs text-gray-600">Organic: 11.97%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-xs text-gray-600">Email: 51.86%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span className="text-xs text-gray-600">Referral: 26.94%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-xs text-gray-600">Social: 9%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Three Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Lead Source */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Lead Source</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={leadSourceSegments} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={80} fill="#8884d8">
                    {leadSourceSegments.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Organic Traffic (Line style) */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Organic Traffic</h3>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={organicTrafficData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="previousValue" fill="#d1d5db" name="Previous" />
                  <Bar dataKey="value" fill="#3b82f6" name="This Period" />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>Previous Period</span>
                <span>This Period</span>
              </div>
            </div>
            
            {/* Number of Followers */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Number of Followers (Follower Growth)</h3>
              <ResponsiveContainer width="100%" height={150}>
                <ComposedChart data={[]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="value" fill="#8884d8" stroke="#8884d8" />
                  <Line type="monotone" dataKey="value" stroke="#ff7300" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Two Column Layout for bottom charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Share of Organic and Paid Impressions */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Share of Organic and Paid Impressions</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={[]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="previousValue" fill="#d1d5db" name="Paid" />
                  <Bar dataKey="value" fill="#3b82f6" name="Organic" />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-4 text-xs text-gray-500">
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded-sm"></div> Organic Impressions</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-gray-300 rounded-sm"></div> Paid Impressions</span>
              </div>
            </div>
            
            {/* Organic Traffic Timeline */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Organic Traffic</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={organicTrafficData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-between mt-4 text-xs text-gray-500">
                <span>Jan 2024</span>
                <span>Mar 2024</span>
                <span>May 2024</span>
                <span>Jul 2024</span>
                <span>Sep 2024</span>
                <span>Nov 2024</span>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-8 text-center text-xs text-gray-400 border-t pt-4">
            Order date - Month/Year | Data updated daily
          </div>
        </main>
      </div>
    </div>
  );
};

export default ContentMarketing;
