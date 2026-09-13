// Hand-written from base44/entities/*.jsonc. When an entity file changes, change this file.

export type PriceLevel = "$" | "$$" | "$$$" | "$$$$";
export type Visibility = "private" | "friends" | "public";

interface BaseRecord {
  id: string;
  created_date?: string;
  updated_date?: string;
}

export interface Restaurant extends BaseRecord {
  name: string;
  description?: string;
  cuisines: string[];
  secondary_cuisines?: string[];
  price_level: PriceLevel;
  address?: string;
  neighborhood?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  image_url?: string;
  average_rating?: number;
  rating_count?: number;
  tags?: string[];
  restaurant_type?: string;
  awards?: string[];
  phone?: string;
  website?: string;
  opening_hours?: string;
  vegetarian_friendly?: boolean;
  vegan_friendly?: boolean;
  outdoor_seating?: boolean;
  fine_dining?: boolean;
  casual?: boolean;
  romantic?: boolean;
  family_friendly?: boolean;
  is_featured?: boolean;
}

export interface RestaurantLog extends BaseRecord {
  user_id: string;
  restaurant_id: string;
  visited_at: string;
  overall_rating: number;
  food_rating?: number;
  service_rating?: number;
  ambiance_rating?: number;
  value_rating?: number;
  review?: string;
  dishes?: string[];
  price_paid?: number;
  occasion?: string;
  visibility?: Visibility;
  would_return?: boolean;
  photos?: string[];
  likes_count?: number;
}

export interface SavedList extends BaseRecord {
  user_id: string;
  name: string;
  description?: string;
  icon?: string;
  is_default?: boolean;
  visibility?: Visibility;
}

export interface ListItem extends BaseRecord {
  user_id: string;
  list_id: string;
  restaurant_id: string;
  note?: string;
  want_to_try?: boolean;
}

export interface Follow extends BaseRecord {
  follower_id: string;
  following_id: string;
  status?: "pending" | "accepted";
}

export interface Recommendation extends BaseRecord {
  user_id: string;
  restaurant_id: string;
  score: number;
  reasons?: string[];
  source?: "mia_profile" | "trending" | "social" | "editorial";
  status?: "new" | "viewed" | "saved" | "dismissed" | "visited";
  generated_at?: string;
  model_version?: string;
  feedback?: "like" | "dislike" | "none";
}

export interface TasteProfile {
  cuisines: string[];
  other_cuisines: string;
  experiences: string[];
  price: string | null;
  adventurousness: number | null;
  flavors: string[];
  disliked_flavors: string;
  priorities: string[];
  avoid: string[];
  avoid_notes: string;
}

export interface User extends BaseRecord {
  email: string;
  full_name?: string;
  role?: "admin" | "user";
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  home_city?: string;
  favorite_cuisines?: string[];
  disliked_cuisines?: string[];
  dietary_preferences?: string[];
  price_preferences?: PriceLevel[];
  taste_tags?: string[];
  preferred_distance_km?: number;
  mia_profile_summary?: string;
  mia_profile_version?: number;
  mia_last_updated?: string;
  onboarding_completed?: boolean;
  taste_profile?: TasteProfile;
}
