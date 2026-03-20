import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import PageHeader from "../components/PageHeader";
import StatsCard from "../components/StatsCard";
import ChartCard from "../components/ChartCard";
import { Plus, X, Edit2, Save, Users, Eye, DollarSign, TrendingUp } from 'lucide-react';
import type { Influencer, InfluencerFormData, FormLocation } from '../types/influencer.types';
import { supabase } from "../lib/supabase";

const IMAGE_PLACEHOLDER = 'https://img.freepik.com/premium-vector/profile-picture-placeholder-avatar-silhouette-gray-tones-icon-colored-shapes-gradient_1076610-40164.jpg';
const INFLUENCER_BUCKET = 'influencer_profiles';

const InfluencerMarketing: React.FC = () => {
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);
  const [editing, setEditing] = useState<boolean>(false);
  
  const [formData, setFormData] = useState<InfluencerFormData>({
    fullName: '',
    profileFile: null,
    reachInstagram: '',
    reachFacebook: '',
    reachTwitter: '',
    reachYouTube: '',
    totalViews: '',
    totalFollowers: '',
    partnerships: '',
    totalEarned: '',
    malePct: '30',
    femalePct: '70',
    locations: [{ country: 'Brazil', count: '' }]
  });

  // Fetch influencers on component mount
  useEffect(() => {
    fetchInfluencers();
  }, []);

  const fetchInfluencers = async (): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('influencer_profiles')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }

      const profileRows: Influencer[] = data ?? [];
      setInfluencers(profileRows);
      setSelectedInfluencer(profileRows[0] ?? null);
    } catch (error) {
      console.error('Error fetching influencers from tables:', error);
      setInfluencers([]);
      setSelectedInfluencer(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, profileFile: file }));
  };

  const handleLocationChange = (index: number, field: keyof FormLocation, value: string): void => {
    const newLocations = [...formData.locations];
    newLocations[index][field] = value;
    setFormData(prev => ({ ...prev, locations: newLocations }));
  };

  const addLocation = (): void => {
    setFormData(prev => ({
      ...prev,
      locations: [...prev.locations, { country: '', count: '' }]
    }));
  };

  const removeLocation = (index: number): void => {
    if (formData.locations.length > 1) {
      const newLocations = formData.locations.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, locations: newLocations }));
    }
  };

  const resetForm = (): void => {
    setFormData({
      fullName: '',
      profileFile: null,
      reachInstagram: '',
      reachFacebook: '',
      reachTwitter: '',
      reachYouTube: '',
      totalViews: '',
      totalFollowers: '',
      partnerships: '',
      totalEarned: '',
      malePct: '30',
      femalePct: '70',
      locations: [{ country: 'Brazil', count: '' }]
    });
    setEditing(false);
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    const locationsObj: Record<string, number> = {};
    formData.locations.forEach(loc => {
      if (loc.country && loc.count) {
        locationsObj[loc.country] = parseInt(loc.count);
      }
    });

    let uploadedPath = '';
    if (formData.profileFile) {
      const fileExt = formData.profileFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from(INFLUENCER_BUCKET)
        .upload(fileName, formData.profileFile, { upsert: true });
      if (uploadError) {
        console.error('Error uploading profile image:', uploadError);
      } else {
        uploadedPath = fileName;
      }
    }

    const influencerData: Omit<Influencer, 'influencer_id'> = {
      full_name: formData.fullName,
      profile_image_url: uploadedPath,
      reach_instagram: parseInt(formData.reachInstagram) || 0,
      reach_facebook: parseInt(formData.reachFacebook) || 0,
      reach_twitter: parseInt(formData.reachTwitter) || 0,
      reach_youtube: parseInt(formData.reachYouTube) || 0,
      total_views_all_time: parseInt(formData.totalViews) || 0,
      total_followers_combined: parseInt(formData.totalFollowers) || 0,
      partnerships_count: parseInt(formData.partnerships) || 0,
      total_earned_usd: parseFloat(formData.totalEarned) || 0,
      follower_gender_pct: {
        male: parseInt(formData.malePct),
        female: parseInt(formData.femalePct)
      },
      top_locations: locationsObj
    };

    try {
      const { data, error } = await supabase
        .from('influencer_profiles')
        .insert([influencerData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      const newInfluencer = data as Influencer;
      setInfluencers(prev => [...prev, newInfluencer]);
      setSelectedInfluencer(newInfluencer);
      setShowAddForm(false);
      resetForm();
    } catch (error) {
      console.error('Error adding influencer:', error);
      alert('Failed to save to database. Please try again.');
    }
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat().format(num);
  };

  const formatCurrency = (num: number): string => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2
    }).format(num);
  };

  const genderPct = selectedInfluencer?.follower_gender_pct || { male: 0, female: 0 };
  const topLocations = selectedInfluencer?.top_locations || {};

  const profileImageUrl = useMemo(() => {
    const path = selectedInfluencer?.profile_image_url;
    if (!path) return IMAGE_PLACEHOLDER;
    if (path.startsWith('http')) return path;
    const { data } = supabase.storage.from(INFLUENCER_BUCKET).getPublicUrl(path);
    return data?.publicUrl ?? IMAGE_PLACEHOLDER;
  }, [selectedInfluencer?.profile_image_url]);

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="space-y-6 p-6">
          <PageHeader
            title="Influencer Marketing"
            subtitle="Creator collaborations"
            actions={
              <button 
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 transition-colors"
              >
                <Plus size={16} />
                Add Creator
              </button>
            }
          />

          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <StatsCard 
              label="Active creators" 
              value={influencers.length.toString()} 
              delta="+5 onboarded" 
              icon={<Users size={20} />}
            />
            <StatsCard 
              label="Total views" 
              value={formatNumber(influencers.reduce((acc, inf) => acc + (inf.total_views_all_time || 0), 0))} 
              delta="+12%" 
              icon={<Eye size={20} />}
            />
            <StatsCard 
              label="Total earned" 
              value={formatCurrency(influencers.reduce((acc, inf) => acc + (inf.total_earned_usd || 0), 0))} 
              delta="+16%" 
              icon={<DollarSign size={20} />}
            />
            <StatsCard 
              label="Avg. engagement" 
              value="4.8%" 
              delta="+0.5%" 
              icon={<TrendingUp size={20} />}
            />
          </div>

          {/* Influencer Selector */}
          {influencers.length > 0 && (
            <div className="flex items-center gap-4 mb-4">
              <label className="text-sm font-medium">Select Influencer:</label>
              <select 
                className="border rounded-md px-3 py-2 bg-white"
                value={selectedInfluencer?.influencer_id}
                onChange={(e) => {
                  const inf = influencers.find(i => i.influencer_id === parseInt(e.target.value));
                  setSelectedInfluencer(inf || null);
                }}
              >
                {influencers.map(inf => (
                  <option key={inf.influencer_id} value={inf.influencer_id}>
                    {inf.full_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Influencer Profile Card */}
          {selectedInfluencer && !showAddForm && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-semibold">Influencer Profile</h2>
                <button 
                  onClick={() => setEditing(!editing)}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  <Edit2 size={16} />
                  {editing ? 'Cancel Edit' : 'Edit'}
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Basic Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <img 
                      src={profileImageUrl} 
                      alt={selectedInfluencer.full_name}
                      className="w-20 h-20 rounded-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = IMAGE_PLACEHOLDER;
                      }}
                    />
                    <div>
                      <h3 className="text-lg font-medium">{selectedInfluencer.full_name}</h3>
                      <p className="text-sm text-gray-500">@{selectedInfluencer.full_name.toLowerCase().replace(' ', '')}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Social Media Reach</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Instagram</span>
                        <span className="font-medium">{formatNumber(selectedInfluencer.reach_instagram || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Facebook</span>
                        <span className="font-medium">{formatNumber(selectedInfluencer.reach_facebook || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Twitter</span>
                        <span className="font-medium">{formatNumber(selectedInfluencer.reach_twitter || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>YouTube</span>
                        <span className="font-medium">{formatNumber(selectedInfluencer.reach_youtube || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Middle Column - Performance Metrics */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Performance Metrics</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-xs text-gray-500">Total Views</div>
                      <div className="text-lg font-semibold">{formatNumber(selectedInfluencer.total_views_all_time || 0)}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-xs text-gray-500">Partnerships</div>
                      <div className="text-lg font-semibold">{selectedInfluencer.partnerships_count || 0}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-xs text-gray-500">Total Earned</div>
                      <div className="text-lg font-semibold">{formatCurrency(selectedInfluencer.total_earned_usd || 0)}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-xs text-gray-500">Total Followers</div>
                      <div className="text-lg font-semibold">{formatNumber(selectedInfluencer.total_followers_combined || 0)}</div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Demographics */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Demographics</h4>
                  
                  {/* Gender Distribution */}
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Followers by Gender</div>
                    <div className="flex h-2 rounded-full overflow-hidden">
                      <div 
                         className="bg-blue-500" 
                         style={{ width: `${genderPct.male}%` }}
                       />
                       <div 
                         className="bg-pink-500" 
                         style={{ width: `${genderPct.female}%` }}
                       />
                     </div>
                     <div className="flex justify-between text-xs mt-1">
                       <span>Male: {genderPct.male}%</span>
                       <span>Female: {genderPct.female}%</span>
                     </div>
                   </div>

                  {/* Top Locations */}
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Top Locations</div>
                    <div className="space-y-1">
                       {Object.entries(topLocations).map(([country, count]) => (
                         <div key={country} className="flex justify-between text-sm">
                           <span>{country}</span>
                           <span className="font-medium">{formatNumber(count)}</span>
                         </div>
                       ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add Influencer Form */}
          {showAddForm && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Add New Influencer</h2>
                <button 
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-700">Basic Information</h3>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Full Name *</label>
                      <input
                        type="text"
                        name="fullName"
                        required
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="w-full border rounded-md px-3 py-2 focus:ring-1 focus:ring-black focus:outline-none"
                        placeholder="e.g., Sarah Johnson"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Profile Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="w-full border rounded-md px-3 py-2 focus:ring-1 focus:ring-black focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Instagram Followers</label>
                      <input
                        type="number"
                        name="reachInstagram"
                        value={formData.reachInstagram}
                        onChange={handleInputChange}
                        className="w-full border rounded-md px-3 py-2 focus:ring-1 focus:ring-black focus:outline-none"
                        placeholder="e.g., 14281"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Facebook Followers</label>
                        <input
                          type="number"
                          name="reachFacebook"
                          value={formData.reachFacebook}
                          onChange={handleInputChange}
                          className="w-full border rounded-md px-3 py-2 focus:ring-1 focus:ring-black focus:outline-none"
                          placeholder="e.g., 12000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Twitter Followers</label>
                        <input
                          type="number"
                          name="reachTwitter"
                          value={formData.reachTwitter}
                          onChange={handleInputChange}
                          className="w-full border rounded-md px-3 py-2 focus:ring-1 focus:ring-black focus:outline-none"
                          placeholder="e.g., 8000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">YouTube Subscribers</label>
                        <input
                          type="number"
                          name="reachYouTube"
                          value={formData.reachYouTube}
                          onChange={handleInputChange}
                          className="w-full border rounded-md px-3 py-2 focus:ring-1 focus:ring-black focus:outline-none"
                          placeholder="e.g., 50000"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-700">Performance Metrics</h3>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Total Views</label>
                      <input
                        type="number"
                        name="totalViews"
                        value={formData.totalViews}
                        onChange={handleInputChange}
                        className="w-full border rounded-md px-3 py-2 focus:ring-1 focus:ring-black focus:outline-none"
                        placeholder="e.g., 1125096"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Total Followers</label>
                      <input
                        type="number"
                        name="totalFollowers"
                        value={formData.totalFollowers}
                        onChange={handleInputChange}
                        className="w-full border rounded-md px-3 py-2 focus:ring-1 focus:ring-black focus:outline-none"
                        placeholder="e.g., 25856"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Partnerships</label>
                        <input
                          type="number"
                          name="partnerships"
                          value={formData.partnerships}
                          onChange={handleInputChange}
                          className="w-full border rounded-md px-3 py-2 focus:ring-1 focus:ring-black focus:outline-none"
                          placeholder="e.g., 16"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Total Earned ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          name="totalEarned"
                          value={formData.totalEarned}
                          onChange={handleInputChange}
                          className="w-full border rounded-md px-3 py-2 focus:ring-1 focus:ring-black focus:outline-none"
                          placeholder="e.g., 150.00"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Demographics Section */}
                <div className="border-t pt-6">
                  <h3 className="font-medium text-gray-700 mb-4">Demographics</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium mb-1">Gender Distribution</label>
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="text-xs text-gray-500">Male %</label>
                          <input
                            type="number"
                            name="malePct"
                            value={formData.malePct}
                            onChange={handleInputChange}
                            min="0"
                            max="100"
                            className="w-full border rounded-md px-3 py-2 focus:ring-1 focus:ring-black focus:outline-none"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs text-gray-500">Female %</label>
                          <input
                            type="number"
                            name="femalePct"
                            value={formData.femalePct}
                            onChange={handleInputChange}
                            min="0"
                            max="100"
                            className="w-full border rounded-md px-3 py-2 focus:ring-1 focus:ring-black focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Top Locations */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Top Locations</label>
                    {formData.locations.map((location, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="Country"
                          value={location.country}
                          onChange={(e) => handleLocationChange(index, 'country', e.target.value)}
                          className="flex-1 border rounded-md px-3 py-2 focus:ring-1 focus:ring-black focus:outline-none"
                        />
                        <input
                          type="number"
                          placeholder="Follower count"
                          value={location.count}
                          onChange={(e) => handleLocationChange(index, 'count', e.target.value)}
                          className="flex-1 border rounded-md px-3 py-2 focus:ring-1 focus:ring-black focus:outline-none"
                        />
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => removeLocation(index)}
                            className="px-3 py-2 text-red-600 hover:text-red-800 border rounded-md"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addLocation}
                      className="text-sm text-blue-600 hover:text-blue-800 mt-2"
                    >
                      + Add Location
                    </button>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors flex items-center gap-2"
                  >
                    <Save size={16} />
                    Add Influencer
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Campaign Performance Section */}
          <ChartCard title="Creator performance">
            Content output, engagement, and attributed conversions.
          </ChartCard>

          <ChartCard title="Spend by tier">
            Budget allocation across nano, micro, and macro partners.
          </ChartCard>
        </main>
      </div>
    </div>
  );
};

export default InfluencerMarketing;
