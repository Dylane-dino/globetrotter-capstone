export interface InterestOption {
  id: string;
  label: string;
  hint: string;
  image: string;
  tags: string[];
}

// Each option maps to real tags used in the destinations dataset, so a
// user's picks translate directly into better /recommendations results -
// no separate "category" concept needed on the backend.
export const INTEREST_OPTIONS: InterestOption[] = [
  {
    id: "museums",
    label: "Museums & Culture",
    hint: "History, art, heritage",
    image: "/images/musee-national.jpg",
    tags: ["museum", "art", "history", "culture"],
  },
  {
    id: "restaurants",
    label: "Restaurants & Food",
    hint: "Local & international dining",
    image: "/images/restaurant-le-repere.jpg",
    tags: ["local-cuisine", "dining", "international"],
  },
  {
    id: "sport",
    label: "Sport & Outdoors",
    hint: "Hiking, viewpoints, activity",
    image: "/images/mont-febe.jpg",
    tags: ["hiking", "outdoor", "fitness"],
  },
  {
    id: "nature",
    label: "Nature & Relaxation",
    hint: "Parks, lakes, wildlife",
    image: "/images/lac-municipal.jpg",
    tags: ["lake", "garden", "relaxation", "wildlife", "family-friendly"],
  },
  {
    id: "shopping",
    label: "Shopping & Markets",
    hint: "Crafts, markets, souvenirs",
    image: "/images/marche-central.jpg",
    tags: ["market", "shopping", "crafts", "souvenirs", "local-life"],
  },
  {
    id: "religious",
    label: "Religious & Heritage Sites",
    hint: "Churches, landmarks",
    image: "/images/cathedrale-notre-dame.jpg",
    tags: ["church", "landmark", "photography"],
  },
  {
    id: "hotels",
    label: "Hotels & Stays",
    hint: "Comfortable places to rest",
    image: "/images/hilton-hotel.jpg",
    tags: ["accommodation", "luxury", "business", "pool"],
  },
];
