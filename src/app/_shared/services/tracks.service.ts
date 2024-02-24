import { Injectable } from "@angular/core";
import { Artist, Track } from "../models/spotify.model";

@Injectable({ providedIn: 'root' })
export class TracksService {
  constructor() { }

  artistNamesToString(artists: Artist[]): string {
    let result: string = "";

    artists.forEach((artist: Artist) => {
      result = result.concat(artist.name, " ");
    });

    return result.toLocaleLowerCase();
  }

  buildTrackIdentifier(trackName: string, artistsStr: string): string {
    return trackName.concat(artistsStr).toLocaleLowerCase();
  }

  isIncludesFilter(filterTerm: string, trackName: string, artistNames: string): boolean {
    const sanitizedTrackName: string = trackName.toLocaleLowerCase().normalizeString();
    const sanitizedArtistNames: string = artistNames.toLocaleLowerCase().normalizeString();
    const sanitizedFilterTerm: string = filterTerm.toLocaleLowerCase().normalizeString();

    if (sanitizedTrackName.includes(sanitizedFilterTerm) || sanitizedArtistNames.includes(sanitizedFilterTerm))
      return true;

    return false;
  }

  appendTracksMap(trackMap: Map<string, Track>, tracks: Track[], dailyHeardleArtist: string = ""): Map<string, Track> {
    tracks.forEach((track: Track) => {
      const trackIdentifier: string = this.buildTrackIdentifier(track.name, this.artistNamesToString(track.artists));
      if (this.validateTrack(track.preview_url, trackMap.has(trackIdentifier), track.artists, dailyHeardleArtist))
        trackMap.set(trackIdentifier, track);
    });

    return trackMap;
  }

  validateTrack(previewUrl: string, trackMapIndex: boolean, artists: Artist[], dailyHeardleArtist: string): boolean {
    const index: number = artists.findIndex((artist: Artist) => artist.name === dailyHeardleArtist);

    if (previewUrl && !trackMapIndex && index >= 0) {
      return true;
    }
    
    return false;
  }
}