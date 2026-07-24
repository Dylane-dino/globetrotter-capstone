import type {
  AuthResponse,
  Destination,
  Itinerary,
  ItineraryItem,
  RecommendedDestination,
  User,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.detail) message = body.detail;
    } catch {
      // response wasn't JSON - keep the generic message
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

// ---- Auth ----

export function signup(payload: {
  name: string;
  email: string;
  password: string;
  preferred_tags: string[];
  budget_level?: string;
}): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function login(payload: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getMe(token: string): Promise<User> {
  return request<User>("/auth/me", {}, token);
}

// ---- Destinations ----

export function getDestinations(params?: {
  q?: string;
  category?: string;
  tag?: string;
}): Promise<Destination[]> {
  const search = new URLSearchParams();
  if (params?.q) search.set("q", params.q);
  if (params?.category) search.set("category", params.category);
  if (params?.tag) search.set("tag", params.tag);
  const qs = search.toString();
  return request<Destination[]>(`/destinations${qs ? `?${qs}` : ""}`);
}

export function getDestination(id: string): Promise<Destination> {
  return request<Destination>(`/destinations/${id}`);
}

// ---- Recommendations ----

export function getRecommendations(payload: {
  user_id?: string;
  preferred_tags?: string[];
  budget_level?: string;
  limit?: number;
}): Promise<RecommendedDestination[]> {
  return request<RecommendedDestination[]>("/recommendations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ---- Itineraries ----

export function getUser(userId: string): Promise<User> {
  return request<User>(`/users/${userId}`);
}

export function getUserItineraries(userId: string): Promise<Itinerary[]> {
  return request<Itinerary[]>(`/users/${userId}/itineraries`);
}

export function getItinerary(id: string): Promise<Itinerary> {
  return request<Itinerary>(`/itineraries/${id}`);
}

export function createItinerary(
  payload: { user_id: string; title: string; items: ItineraryItem[] },
  token: string
): Promise<Itinerary> {
  return request<Itinerary>(
    "/itineraries",
    { method: "POST", body: JSON.stringify(payload) },
    token
  );
}

export function updateItinerary(
  id: string,
  payload: { title?: string; items?: ItineraryItem[] },
  token: string
): Promise<Itinerary> {
  return request<Itinerary>(
    `/itineraries/${id}`,
    { method: "PUT", body: JSON.stringify(payload) },
    token
  );
}

export function deleteItinerary(id: string, token: string): Promise<void> {
  return request<void>(`/itineraries/${id}`, { method: "DELETE" }, token);
}

export function shareItinerary(
  id: string,
  email: string,
  token: string
): Promise<Itinerary> {
  return request<Itinerary>(
    `/itineraries/${id}/share`,
    { method: "POST", body: JSON.stringify({ email }) },
    token
  );
}
