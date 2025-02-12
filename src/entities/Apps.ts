import { API } from "../API";
import type { SoundcloudApp } from "../types";

export class Apps {
  public constructor(private readonly api: API) {}

  /**
   * Gets Soundcloud apps, using the Soundcloud v2 API.
   */
  public get = async () => {
    const response = await this.api.getV2("/apps");
    return response.collection as Promise<SoundcloudApp>;
  };
}
