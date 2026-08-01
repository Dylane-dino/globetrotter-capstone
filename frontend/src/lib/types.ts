export interface Destination {
  id: string;
  name: string;
  category: string;
  tags: string[];
  description: string;
  neighborhood: string;
  rating: number;
  avg_cost_fcfa: number;
  lat: number;
  lng: number;
  images: string[];
}

export interface RecommendedDestination extends Destination {
  score: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  preferred_tags: string[];
  budget_level: "low" | "medium" | "high" | string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ItineraryItem {
  destination_id: string;
  day: number;
  note?: string | null;
}

export interface Itinerary {
  id: string;
  user_id: string;
  title: string;
  items: ItineraryItem[];
  shared_with: string[];
}

export interface ApiErrorBody {
  detail?: string;
}

export interface CommunityComment { id: string; user_name: string; timestamp: string; body: string; }
export interface CommunityPost { id: string; user_name: string; timestamp: string; location_tag: string; title: string; body: string; comments: CommunityComment[]; }
export interface TransportEstimate { mode: string; duration_minutes: number; estimated_cost_fcfa: number; notes: string; }
export interface DestinationHighlight { id: string; name: string; latitude: number; longitude: number; special_highlight: string; best_time_to_visit: string; estimated_stay_duration: string; transport: TransportEstimate[]; }
export interface ChatResponse { message: string; suggested_destinations: DestinationHighlight[]; }
export interface ChatHistoryItem { role: "user" | "assistant"; message: string; }
