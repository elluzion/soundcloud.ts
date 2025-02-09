import { API } from "../API";
import type { SoundcloudUser } from "../types";

export class Me {
  public constructor(private readonly api: API) {}

  /**
   * Gets your own profile, using the Soundcloud v2 API.
   */
  public get = async () => {
    const response = await this.api.getV2("/me");
    return response as Promise<SoundcloudUser>;
  };
}
