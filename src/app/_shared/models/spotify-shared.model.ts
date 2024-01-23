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