import { normalizeServerUrl } from "../server-url";
import { getSetting } from "../settings";

export class MissingTokenError extends Error {
  constructor(message = "API token is not configured") {
    super(message);
    this.name = "MissingTokenError";
  }
}

export class MissingServerUrlError extends Error {
  constructor(message = "Server URL is not configured") {
    super(message);
    this.name = "MissingServerUrlError";
  }
}

/** True for the "server features simply aren't set up" errors. */
export function isServerNotConfiguredError(error: unknown): boolean {
  return (
    error instanceof MissingTokenError || error instanceof MissingServerUrlError
  );
}

export type TestConnectionResult = {
  ok: boolean;
  status?: number;
  error?: string;
};

export class AuthService {
  private static instance: AuthService | undefined;

  private async getToken(): Promise<string> {
    return getSetting("apiToken");
  }

  /**
   * Resolves an API path against the user-provided server URL. There is no
   * built-in server — throws when none is configured, mirroring the missing
   * token behavior so callers treat both as "server features are off".
   */
  async apiUrl(path: string): Promise<string> {
    const serverUrl = normalizeServerUrl(await getSetting("serverUrl"));

    if (!serverUrl) {
      throw new MissingServerUrlError();
    }

    return `${serverUrl}${path}`;
  }

  private async apiCall<T>(
    endpoint: string,
    method = "GET",
    body?: Record<string, unknown>,
  ): Promise<T> {
    const token = await this.getToken();

    if (!token) {
      throw new MissingTokenError();
    }

    try {
      const requestOptions: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };

      if (body) {
        requestOptions.body = JSON.stringify(body);
      }

      const response = await fetch(await this.apiUrl(endpoint), requestOptions);

      if (!response.ok) {
        throw new Error(`API call failed: ${String(response.status)}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      console.error(`API error ${endpoint}:`, error);
      throw error;
    }
  }

  public static getInstance(): AuthService {
    AuthService.instance ??= new AuthService();

    return AuthService.instance;
  }

  // Helper for authenticated requests
  async authenticatedFetch(
    url: string,
    options: RequestInit = {},
  ): Promise<Response> {
    const token = await this.getToken();

    if (!token) {
      throw new MissingTokenError();
    }

    const headers = {
      ...(options.headers as Record<string, string>),
      Authorization: `Bearer ${token}`,
    };

    return fetch(url, {
      ...options,
      headers,
    });
  }

  async testConnection(): Promise<TestConnectionResult> {
    try {
      const response = await this.authenticatedFetch(
        await this.apiUrl("/api/health"),
        { method: "GET" },
      );

      return { ok: response.ok, status: response.status };
    } catch (error) {
      if (error instanceof MissingServerUrlError) {
        return { ok: false, error: "No server URL configured" };
      }

      if (error instanceof MissingTokenError) {
        return { ok: false, error: "No token configured" };
      }

      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

// Export a singleton instance
export const authService = AuthService.getInstance();
