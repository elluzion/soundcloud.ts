import { API } from "./src/API";
import {
  Apps,
  Comments,
  Me,
  Oembed,
  Playlists,
  Resolve,
  Tracks,
  Users,
  Util,
} from "./src/entities";

/**
 * The main class for interacting with the Soundcloud API.
 */
export class Soundcloud {
  public static clientId?: string;
  public static oauthToken?: string;

  public api = new API(Soundcloud.clientId, Soundcloud.oauthToken);
  public apps: Apps;
  public comments: Comments;
  public me: Me;
  public oembed: Oembed;
  public playlists: Playlists;
  public resolve: Resolve;
  public tracks: Tracks;
  public users: Users;
  public util: Util;

  public constructor(clientId?: string, oauthToken?: string) {
    if (clientId) {
      Soundcloud.clientId = clientId;
      if (oauthToken) Soundcloud.oauthToken = oauthToken;
    }
    this.api = new API(Soundcloud.clientId, Soundcloud.oauthToken);

    this.apps = new Apps(this.api);
    this.comments = new Comments(this.api);
    this.me = new Me(this.api);
    this.oembed = new Oembed(this.api);
    this.playlists = new Playlists(this.api);
    this.resolve = new Resolve(this.api);
    this.tracks = new Tracks(this.api);
    this.users = new Users(this.api);
    this.util = new Util(this.api);
  }
}

export * from "./src/API";
export * from "./src/entities";
export * from "./src/types";
export default Soundcloud;
