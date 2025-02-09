import { Dispatcher, Pool, request } from "undici";

const apiURL = "https://api.soundcloud.com";
const apiV2URL = "https://api-v2.soundcloud.com";
const webURL = "https://soundcloud.com";

export class API {
  public static headers: Record<string, any> = {
    Origin: "https://soundcloud.com",
    Referer: "https://soundcloud.com/",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 Edg/114.0.1823.67",
  };

  public api: Pool;
  public apiV2: Pool;
  public web: Pool;
  public proxy?: Pool;

  constructor(
    public clientId?: string,
    public oauthToken?: string,
    proxy?: string,
  ) {
    this.api = new Pool(apiURL);
    this.apiV2 = new Pool(apiV2URL);
    this.web = new Pool(webURL);

    if (oauthToken) API.headers.Authorization = `OAuth ${oauthToken}`;
    if (proxy) this.proxy = new Pool(proxy);
  }

  get headers() {
    return API.headers;
  }

  public getV2(endpoint: string, params?: Record<string, any>) {
    return this.getRequest(this.apiV2, apiV2URL, endpoint, params);
  }

  public getWebsite(endpoint: string, params?: Record<string, any>) {
    return this.getRequest(this.web, webURL, endpoint, params);
  }

  public getURL(URI: string, params?: Record<string, any>) {
    if (this.proxy) {
      return this.request(this.proxy, this.buildOptions(URI, "GET", params));
    }

    const options = this.buildOptions(URI, "GET", params);
    return request(URI, options).then(this.handleResponse);
  }

  private buildOptions(
    path: string,
    method: Dispatcher.HttpMethod = "GET",
    params?: Record<string, any>,
  ): Dispatcher.RequestOptions {
    const options: Dispatcher.RequestOptions = {
      query: method === "GET" ? params : {},
      headers: API.headers,
      method,
      path,
      maxRedirections: 5,
    };

    if (method === "POST" && params) options.body = JSON.stringify(params);
    if (this.clientId) options.query.client_id = this.clientId;
    if (this.oauthToken) options.query.oauth_token = this.oauthToken;

    return options;
  }

  private request(pool: Pool, options: Dispatcher.RequestOptions) {
    return pool.request(options).then(this.handleResponse);
  }

  private handleResponse(response: Dispatcher.ResponseData) {
    if (response.statusCode.toString().startsWith("2")) {
      if (response.headers["content-type"].includes("application/json")) {
        return response.body.json();
      }
      return response.body.text();
    }
    throw new Error(`Status code ${response.statusCode}`);
  }

  private async getRequest(
    pool: Pool,
    origin: string,
    endpoint: string,
    params?: Record<string, any>,
  ) {
    if (!this.clientId) await this.getClientId();
    if (endpoint.startsWith("/")) endpoint = endpoint.slice(1);

    const options = this.buildOptions(
      `${this.proxy ? origin : ""}/${endpoint}`,
      "GET",
      params,
    );

    try {
      return await this.request(this.proxy || pool, options);
    } catch {
      await this.getClientId(true);
      return this.request(this.proxy || pool, options);
    }
  }

  public async post(endpoint: string, params?: Record<string, any>) {
    if (!this.clientId) await this.getClientId();
    if (endpoint.startsWith("/")) endpoint = endpoint.slice(1);

    const options = this.buildOptions(
      `${this.proxy ? origin : ""}/${endpoint}`,
      "POST",
      params,
    );

    return this.request(this.proxy || this.api, options);
  }

  public async getClientIdWeb() {
    const response = await this.request(
      this.proxy || this.web,
      this.buildOptions(this.proxy ? webURL : "/"),
    );

    if (!response || typeof response !== "string") {
      throw new Error("Could not find client ID");
    }

    const urls = response.match(
      /(?!<script.*?src=")https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*\.js)(?=.*?>)/g,
    );

    if (!urls || urls.length === 0) {
      throw new Error("Could not find script URLs");
    }

    for (const url of urls) {
      const script = await (this.proxy
        ? this.request(this.proxy, this.buildOptions(url))
        : fetch(url).then((r) => r.text()));

      if (script && typeof script === "string") {
        const clientId = script.match(/[{,]client_id:"(\w+)"/)?.[1];
        if (clientId) return clientId;
      }
    }

    throw new Error("Could not find client ID in script URLs");
  }

  public async getClientIdMobile() {
    const response = await fetch("https://m.soundcloud.com/", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5_1 like Mac OS X) " +
          "AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/99.0.4844.47 Mobile/15E148 Safari/604.1",
      },
    }).then((r) => r.text());

    const clientId = response.match(/"clientId":"(\w+?)"/)?.[1];
    if (clientId) return clientId;

    throw new Error("Could not find client ID");
  }

  public async getClientId(reset?: boolean) {
    if (!this.oauthToken && (!this.clientId || reset)) {
      this.clientId = await this.getClientIdWeb().catch((webError) =>
        this.getClientIdMobile().catch((mobileError) => {
          throw new Error(
            "Could not find client ID. Please provide one in the constructor. (Guide: https://github.com/Tenpi/soundcloud.ts#getting-started)" +
              `\nWeb error: ${webError}` +
              `\nMobile error: ${mobileError}`,
          );
        }),
      );
    }
    return this.clientId;
  }
}
