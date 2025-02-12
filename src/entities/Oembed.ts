import { API } from "../API";
import type { SoundcloudOembed, SoundcloudOembedFilter } from "../types";

export class Oembed {
  public constructor(private readonly api: API) {}

  /**
   * Gets the Oembed for a track, playlist, or user.
   */
  public get = async (params: SoundcloudOembedFilter) => {
    const response = await this.api.getWebsite(
      "/oembed",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      params as Record<string, any>,
    );
    return response as Promise<SoundcloudOembed>;
  };
}
