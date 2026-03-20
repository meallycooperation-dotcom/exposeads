export interface Influencer {
  influencer_id: number;
  brand_id?: number;
  full_name: string;
  profile_image_url: string;
  
  // Social Media Reach
  reach_twitter?: number;
  reach_facebook?: number;
  reach_pinterest?: number;
  reach_instagram?: number;
  reach_medium?: number;
  reach_youtube?: number;
  reach_tiktok?: number;

  // Performance Metrics
  total_views_all_time: number;
  total_followers_combined: number;
  partnerships_count: number;
  total_earned_usd: number;

  // Demographics
  follower_gender_pct: {
    male: number;
    female: number;
  };
  follower_age_dist?: Record<string, number>;
  top_locations: Record<string, number>;

  updated_at?: string;
}

export interface Campaign {
  campaign_id: number;
  influencer_id: number;
  campaign_name: string;
  social_platforms?: string[];
  min_views?: number;
  max_views?: number;
  success_rate_pct?: number;
  start_date?: string;
  status?: string;
}

export interface FormLocation {
  country: string;
  count: string;
}

export interface InfluencerFormData {
  fullName: string;
  profileFile: File | null;
  reachInstagram: string;
  reachFacebook: string;
  reachTwitter: string;
  reachYouTube: string;
  totalViews: string;
  totalFollowers: string;
  partnerships: string;
  totalEarned: string;
  malePct: string;
  femalePct: string;
  locations: FormLocation[];
}
