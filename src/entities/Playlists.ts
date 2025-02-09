import { request } from "undici";
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
    const response = await this.api.getV2("search/playlists", params);
    return response as Promise<SoundcloudPlaylistSearch>;
  };

  /**
   * Fetches a playlist from URL or ID using Soundcloud v2 API.
   */
  public get = async (playlistResolvable: string | number) => {
    const playlistID = await this.resolve.get(playlistResolvable);
    const response = <SoundcloudPlaylist>(
      await this.api.getV2(`/playlists/${playlistID}`)
    );
    return this.fetch(response) as Promise<SoundcloudPlaylist>;
  };

  /**
   * Searches for playlists (web scraping)
   */
  public searchAlt = async (query: string) => {
    const headers = this.api.headers;
    const html = await request(
      `https://soundcloud.com/search/sets?q=${query}`,
      { headers },
    ).then((r) => r.body.text());
    const urls = html
      .match(/(?<=<li><h2><a href=")(.*?)(?=">)/gm)
      ?.map((u: any) => `https://soundcloud.com${u}`);
    if (!urls) return [];
    const scrape: any = [];
    for (let i = 0; i < urls.length; i++) {
      const songHTML = await request(urls[i], { headers }).then((r) =>
        r.body.text(),
      );
      const json = JSON.parse(songHTML.match(/(\[{)(.*)(?=;)/gm)[0]);
      const playlist = json[json.length - 1].data;
      scrape.push(playlist);
    }
    return scrape as Promise<SoundcloudPlaylist[]>;
  };

  /**
   * Gets a playlist by URL (web scraping)
   */
  public getAlt = async (url: string) => {
    if (!url.startsWith("https://soundcloud.com/"))
      url = `https://soundcloud.com/${url}`;
    const headers = this.api.headers;
    const songHTML = await request(url, { headers }).then((r: any) =>
      r.body.text(),
    );
    const json = JSON.parse(songHTML.match(/(\[{)(.*)(?=;)/gm)[0]);
    const playlist = json[json.length - 1].data;
    return this.fetch(playlist) as Promise<SoundcloudPlaylist>;
  };
}
