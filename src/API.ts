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

  constructor(
    public clientId?: string,
    public oauthToken?: string,
  ) {
    if (oauthToken) API.headers.Authorization = `OAuth ${oauthToken}`;
  }

  get headers() {
    return API.headers;
  }

  public getV2(endpoint: string, params?: Record<string, any>) {
    return this.getRequest(apiV2URL, endpoint, params);
  }

  public getWebsite(endpoint: string, params?: Record<string, any>) {
    return this.getRequest(webURL, endpoint, params);
  }

  public async getURL(URI: string, params?: Record<string, any>) {
    const response = await this.request(URI, "GET", params);
    const data = await this.handleResponse(response);
    return data;
  }

  private buildRequestOptions(
    method: "GET" | "POST",
    params?: Record<string, any>,
  ): RequestInit {
    const headers = new Headers(API.headers);
    let body = undefined;

    if (method === "POST" && params) {
      body = JSON.stringify(params);
      headers.set("Content-Type", "application/json");
    }

    return { method, headers, body };
  }

  private async request(
    url: string,
    method: "GET" | "POST",
    params?: Record<string, any>,
  ) {
    const options = this.buildRequestOptions(method, params);
    const _url = new URL(url);

    if (method === "GET" && params) {
      _url.search = new URLSearchParams(params).toString();
    }

    if (this.clientId) _url.searchParams.set("client_id", this.clientId);
    if (this.oauthToken) _url.searchParams.set("oauth_token", this.oauthToken);

    const response = await fetch(_url, options);
    return await this.handleResponse(response);
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    if (response.headers.get("content-type")?.includes("application/json")) {
      return response.json();
    } else {
      return response.text();
    }
  }

  private async getRequest(
    url: string,
    endpoint: string,
    params?: Record<string, any>,
  ) {
    if (!this.clientId) await this.getClientId();
    if (endpoint.startsWith("/")) endpoint = endpoint.slice(1);

    try {
      return await this.request(`${url}/${endpoint}`, "GET", params);
    } catch {
      await this.getClientId(true);
      return this.request(`${url}/${endpoint}`, "GET", params);
    }
  }

  public async post(endpoint: string, params?: Record<string, any>) {
    if (!this.clientId) await this.getClientId();
    if (endpoint.startsWith("/")) endpoint = endpoint.slice(1);

    return this.request(`${apiURL}/${endpoint}`, "POST", params);
  }

  public async getClientIdWeb() {
    const response = await this.request(webURL, "POST");

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
      const script = await fetch(url).then((r) => r.text());

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
