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
