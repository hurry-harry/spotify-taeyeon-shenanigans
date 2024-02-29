export interface SpotifyBaseResponse {
  href: string;
  limit: number;
  offset: number;
  total: number;
  next: string;
  previous: string;
}

export interface TracksResponse extends SpotifyBaseResponse {
  items: Track[];
}

export interface ArtistsResponse extends SpotifyBaseResponse {
  items: Artist[];
}

export interface ExternalUrls {
  spotify: string;
}

export interface Followers {
  href: string; // will always be null, Spotify Web API currently does not support it
  total: number;
}

export interface Image {
  url: string;
  height: number; // in pixels
  width: number; // in pixels
}

export interface Item {
  external_urls: ExternalUrls;
  href: string;
  id: string;
  name: string;
  popularity: number;
  type: string;
  uri: string;
}

export interface Artist extends Item {
  followers: Followers;
  genres: string[];
  images: Image[];
}

export interface Track extends Item {
  album: Album;
  artists: Artist[];
  available_markets: string[];
  disc_number: number;
  duration_ms: number;
  explicit: boolean;
  external_ids: ExternalIds;
  is_playable: boolean;
  linked_from: LinkedFrom;
  restrictions: Restriction;
  preview_url: string;
  track_number: number;
  is_local: boolean;
}

export interface Album {
  album_type: string;
  total_tracks: number;
  available_markets: string[];
  external_urls: ExternalUrls;
  href: string;
  id: string;
  images: Image[];
  name: string;
  release_date: string;
  release_date_precision: string;
  restrictions: Restriction;
  type: string;
  uri: string;
  artists: SimplifiedArtist[];
}

export interface Restriction {
  reason: string;
}

export interface SimplifiedArtist {
  external_urls: ExternalUrls;
  href: string;
  id: string;
  name: string;
  type: string;
  uri: string;
}

export interface ExternalIds {
  isrc: string;
  ean: string;
  upc: string;
}

export interface LinkedFrom {
  external_urls: ExternalUrls;
  href: string;
  id: string;
  type: string;
  uri: string;
}

export interface TopAlbumItem {
  album: Album;
  count: number;
}

export interface TopArtistsByTrack {
  artist: Artist;
  count: number;
}