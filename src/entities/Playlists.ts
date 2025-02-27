import { API } from "../API";
import type {
  SoundcloudPlaylist,
  SoundcloudPlaylistFilter,
  SoundcloudPlaylistSearch,
} from "../types";
import { Resolve, Tracks } from "./index";

export class Playlists {
  private readonly tracks: Tracks;
  private readonly resolve: Resolve;

  public constructor(private readonly api: API) {
    this.tracks = new Tracks(this.api);
    this.resolve = new Resolve(this.api);
  }
  /**
   * Return playlist with all tracks fetched.
   */
  public fetch = async (playlist: SoundcloudPlaylist) => {
    const unresolvedTracks = playlist.tracks
      .splice(playlist.tracks.findIndex((t) => !t.title))
      .map((t) => t.id);
    if (unresolvedTracks.length === 0) return playlist;
    playlist.tracks = playlist.tracks.concat(
      await this.tracks.getArray(unresolvedTracks, true),
    );
    return playlist;
  };

  /**
   * Searches for playlists using the v2 API.
   */
  public search = async (params?: SoundcloudPlaylistFilter) => {
    const response = await this.api.getV2(
      "search/playlists",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      params as Record<string, any>,
    );
    return response as Promise<SoundcloudPlaylistSearch>;
  };

  /**
   * Fetches a playlist from URL or ID using Soundcloud v2 API.
   */
  public get = async (playlistResolvable: string | number) => {
    const playlistID = await this.resolve.get(playlistResolvable);
    const response = (await this.api.getV2(
      `/playlists/${playlistID}`,
    )) as SoundcloudPlaylist;
    return this.fetch(response) as Promise<SoundcloudPlaylist>;
  };

  /**
   * Searches for playlists (web scraping)
   */
  public searchAlt = async (query: string) => {
    const headers = this.api.headers;
    const html = await fetch(`https://soundcloud.com/search/sets?q=${query}`, {
      headers,
    }).then((r) => r.text());

    const urls = html
      .match(/(?<=<li><h2><a href=")(.*?)(?=">)/gm)
      ?.map((u: string) => `https://soundcloud.com${u}`);

    if (!urls) return [];

    const scrape: SoundcloudPlaylist[] = [];
    for (const url of urls) {
      const songHTML = await fetch(url, { headers }).then((r) => r.text());
      const json = JSON.parse(songHTML.match(/(\[{)(.*)(?=;)/gm)[0]);
      const playlist = json[json.length - 1].data;
      scrape.push(playlist);
    }

    return scrape as SoundcloudPlaylist[];
  };

  /**
   * Gets a playlist by URL (web scraping)
   */
  public getAlt = async (url: string) => {
    if (!url.startsWith("https://soundcloud.com/"))
      url = `https://soundcloud.com/${url}`;
    const headers = this.api.headers;
    const songHTML = await fetch(url, { headers }).then((r) => r.text());
    const json = JSON.parse(songHTML.match(/(\[{)(.*)(?=;)/gm)[0]);
    const playlist = json[json.length - 1].data;
    return this.fetch(playlist);
  };
}
