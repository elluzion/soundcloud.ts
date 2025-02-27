import { API } from "../API";
import type { SoundcloudComment } from "../types";

export class Comments {
  public constructor(private readonly api: API) {}

  /**
   * Gets a comment from its ID, using the Soundcloud v2 API.
   */
  public get = async (commentID: number) => {
    const response = await this.api.getV2(`/comments/${commentID}`);
    return response as Promise<SoundcloudComment>;
  };
}
