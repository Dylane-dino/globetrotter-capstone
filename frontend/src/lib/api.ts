import type {
  AuthResponse,
  Destination,
  Itinerary,
  ItineraryItem,
  RecommendedDestination,
  User,
  CommunityPost,
  ChatResponse, ChatHistoryItem,
} from "./types";

// Keep browser calls same-origin. The Next route handler forwards requests to
// FastAPI, avoiding CORS and localhost-resolution issues in the browser.
const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api/backend";
const REQUEST_TIMEOUT_MS = 15_000;

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

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("The server took too long to respond. Please check that the backend is running and try again.", 504);
    }
    throw new ApiError("Could not connect to the server. Please check that the backend is running and try again.", 0);
  } finally {
    window.clearTimeout(timeout);
  }

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

/**
 * The API generic is compile-time only. Validate collection endpoints at
 * runtime so an error payload can never be stored in state and rendered with
 * `.map()` as though it were an array.
 */
async function requestArray<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T[]> {
  const data = await request<unknown>(path, options, token);
  if (!Array.isArray(data)) {
    throw new ApiError("The server returned an invalid list response.", 502);
  }
  return data as T[];
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
  return requestArray<Destination>(`/destinations${qs ? `?${qs}` : ""}`);
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
  return requestArray<RecommendedDestination>("/recommendations", {
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

export function getCommunityPosts(): Promise<CommunityPost[]> { return request<CommunityPost[]>("/community/posts"); }
export function createCommunityPost(payload: { title: string; body: string; location_tag: string }, token: string): Promise<CommunityPost> { return request<CommunityPost>("/community/posts", { method: "POST", body: JSON.stringify(payload) }, token); }
export function addCommunityComment(postId: string, body: string, token: string): Promise<CommunityPost> { return request<CommunityPost>(`/community/posts/${postId}/comments`, { method: "POST", body: JSON.stringify({ body }) }, token); }
export function chat(payload: { message: string; latitude?: number; longitude?: number; history?: ChatHistoryItem[] }, token: string): Promise<ChatResponse> { return request<ChatResponse>("/chat", { method: "POST", body: JSON.stringify(payload) }, token); }
