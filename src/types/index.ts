export interface MediaItem {
  id: string;
  name: string;
  url: string;
  logo?: string;
  group: string;
  type: 'movie' | 'series' | 'channel';
  genre?: string;
  description?: string;
  year?: string;
  season?: string;
  episode?: string;
  isNew?: boolean;
  isFeatured?: boolean;
  tvgId?: string;
  tvgName?: string;
  tvgLogo?: string;
  parentId?: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'movie' | 'series' | 'channel';
  items: MediaItem[];
}

export interface Genre {
  id: string;
  name: string;
  items: MediaItem[];
}

export interface FeaturedContent {
  id: string;
  title: string;
  items: MediaItem[];
}

export interface AppState {
  items: MediaItem[];
  allItems: MediaItem[];
  rawItems: MediaItem[];
  categories: Category[];
  contentByType: {
    movies: MediaItem[];
    series: MediaItem[];
    channels: MediaItem[];
  };
  genres: Genre[];
  featured: FeaturedContent[];
  loading: boolean;
  error: Error | null;
  searchResults: MediaItem[];
  searchTerm: string;
  contentByGenre: Record<string, Record<string, MediaItem[]>>;
}

export type ContentType = 'movie' | 'series' | 'channel'; 