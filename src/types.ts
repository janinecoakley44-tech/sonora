export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // seconds
  cover: string;
  accent: string; // hex color for theming
  url: string; // audio URL
  lyrics: LyricLine[];
}

export interface LyricLine {
  time: number; // seconds
  text: string;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  cover: string;
  accent: string;
  year: number;
  trackIds: string[];
}
