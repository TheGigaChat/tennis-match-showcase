export const API = process.env.NEXT_PUBLIC_API_URL as string;

let csrfInitPromise: Promise<string | undefined> | null = null;
let refreshPromise: Promise<Response | null> | null = null;
let cachedCsrfToken: string | undefined;

type ApiFetchInit = RequestInit & {
  skipAuthRefresh?: boolean;
  useRefreshResponseOn401?: boolean;
};

function getCsrfFromCookie(name = "XSRF-TOKEN") {
  const m =
      typeof document !== "undefined"
          ? document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]+)`))
          : null;
  return m ? decodeURIComponent(m[1]) : undefined;
}

async function fetchCsrfFromServer(): Promise<string | undefined> {
  const existing = cachedCsrfToken ?? getCsrfFromCookie();
  if (existing) {
    cachedCsrfToken = existing;
    return cachedCsrfToken;
  }

  try {
    const res = await fetch(`${API}/csrf`, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (res.ok) {
      const body = await res.json().catch(() => null);
      const tokenFromBody = typeof body?.token === "string" ? body.token : undefined;
      const token = tokenFromBody ?? getCsrfFromCookie();
      if (token) cachedCsrfToken = token;
      return cachedCsrfToken;
    }
  } catch {}

  // Fallback: read from cookie (useful in dev / same-origin)
  const fallback = getCsrfFromCookie();
  if (fallback) cachedCsrfToken = fallback;
  return cachedCsrfToken;
}

function getClientOrigin(): string | null {
  if (typeof window === "undefined") return null;
  return window.location.origin || null;
}

async function refreshSession(): Promise<Response | null> {
  try {
    const origin = getClientOrigin();
    const res = await fetch(`${API}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "X-TM-Refresh": "1",
        ...(origin ? { Origin: origin } : {}),
      },
      cache: "no-store",
    });
    return res;
  } catch {
    return null;
  }
}

async function refreshSessionOnce(): Promise<Response | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const res = await refreshSession();
    return res;
  })().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}


/** One-time CSRF initialization (single-flight). */
async function initCsrfOnce(): Promise<string | undefined> {
  // First try cache/cookie (in case of same-origin)
  cachedCsrfToken ??= getCsrfFromCookie();
  if (cachedCsrfToken) return cachedCsrfToken;

  if (csrfInitPromise) return csrfInitPromise;

  csrfInitPromise = (async () => {
    const token = await fetchCsrfFromServer();
    return token;
  })().finally(() => {
    // Allow re-init later if the token needs to be refreshed
    csrfInitPromise = null;
  });

  return csrfInitPromise;
}

function resolveUseRefreshResponse(
  path: string,
  method: string,
  explicit?: boolean
): boolean {
  if (explicit === true) return true;
  if (explicit === false) return false;
  if (method !== "GET") return false;
  const pathOnly = path.startsWith("http") ? safeUrlPath(path) : path;
  const basePath = pathOnly.split("?")[0];
  return basePath === "/profile/me" || basePath === "/me";
}

function safeUrlPath(input: string): string {
  try {
    return new URL(input).pathname;
  } catch {
    return input;
  }
}

/** Thin fetch wrapper: always sends cookies;
 *  for non-safe methods (not GET/HEAD) ensures CSRF,
 *  and retries once on race/expired token.
 */
export async function apiFetch(path: string, init: ApiFetchInit = {}): Promise<Response> {
  const url = path.startsWith("http") ? path : `${API}${path}`;
  const { skipAuthRefresh, useRefreshResponseOn401, ...fetchInit } = init;
  const method = (fetchInit.method || "GET").toUpperCase();
  const isMutating = method !== "GET" && method !== "HEAD" && method !== "OPTIONS" && method !== "TRACE";
  const useRefreshForThis = resolveUseRefreshResponse(path, method, useRefreshResponseOn401);

  const headers = new Headers(fetchInit.headers || {});
  if (!headers.has("Accept")) headers.set("Accept", "application/json");

  if (isMutating && !headers.has("X-XSRF-TOKEN")) {
    const csrf = cachedCsrfToken ?? (await initCsrfOnce());
    if (csrf) headers.set("X-XSRF-TOKEN", csrf);
  }

  const resp = await fetch(url, {
    credentials: "include",
    cache: "no-store",
    ...fetchInit,
    headers,
  });

  // One-time retry
  if (resp.status === 401 && !skipAuthRefresh && !headers.get("X-REFRESH-RETRIED")) {
    const refreshed = await refreshSessionOnce();
    if (refreshed?.ok) {
      if (useRefreshForThis) {
        return refreshed;
      }
      await fetchCsrfFromServer();
      const retryHeaders = new Headers(fetchInit.headers || {});
      if (!retryHeaders.has("Accept")) retryHeaders.set("Accept", "application/json");

      if (isMutating && !retryHeaders.has("X-XSRF-TOKEN")) {
        const retryToken = cachedCsrfToken ?? getCsrfFromCookie();
        if (retryToken) retryHeaders.set("X-XSRF-TOKEN", retryToken);
      }

      retryHeaders.set("X-REFRESH-RETRIED", "1");

      return fetch(url, {
        credentials: "include",
        cache: "no-store",
        ...fetchInit,
        headers: retryHeaders,
      });
    }
  }

  if (resp.status === 403 && !headers.get("X-CSRF-RETRIED")) {
    // refresh CSRF via /csrf and retry once
    const refreshed = await fetchCsrfFromServer();

    const retryHeaders = new Headers(fetchInit.headers || {});
    if (!retryHeaders.has("Accept")) retryHeaders.set("Accept", "application/json");

    const retryToken = refreshed ?? cachedCsrfToken ?? getCsrfFromCookie();
    if (retryToken) retryHeaders.set("X-XSRF-TOKEN", retryToken);

    retryHeaders.set("X-CSRF-RETRIED", "1");

    return fetch(url, {
      credentials: "include",
      cache: "no-store",
      ...fetchInit,
      headers: retryHeaders,
    });
  }

  return resp;
}
