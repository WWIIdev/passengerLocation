import { logoutHandler } from "../utils/auth/logoutHandler";
import axios from "axios";
import type {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosHeaderValue,
  AxiosProgressEvent,
} from "axios";
import { BASE_URL, REFRESH_TOKEN } from "./endpoints";

export const ACCESS_TOKEN_COOKIE = "passengerAccessToken";
export const REFRESH_TOKEN_COOKIE = "passengerRefreshToken";

const refreshAccessToken = async () => {
  try {
    const refreshToken = getCookie(REFRESH_TOKEN_COOKIE);
    const response = await callApi({
      url: REFRESH_TOKEN,
      method: "POST",
      data: {
        refreshToken,
      },
    });
    if (response.succeeded) {
      const { accessToken, refreshKey, expireDate } = response.data;
      const expiresInDays = Number(expireDate);

      if (!accessToken || !refreshKey) {
        logoutHandler();
        return null;
      }

      setCookie(
        "passengerToken",
        accessToken,
        Number.isFinite(expiresInDays) ? expiresInDays : undefined,
      );
      setCookie(
        REFRESH_TOKEN_COOKIE,
        refreshKey,
        Number.isFinite(expiresInDays) ? expiresInDays : undefined,
      );

      return accessToken;
    } else {
      logoutHandler();
      return null;
    }
  } catch (err) {
    console.error("Unable to refresh token", err);
    return null;
  }
};
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface CallApiOptions<TBody = unknown> {
  url: string;
  method?: HttpMethod;
  data?: TBody;
  params?: AxiosRequestConfig["params"];
  requireAuth?: boolean;
  headers?: AxiosRequestConfig["headers"];
  signal?: AbortSignal;
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
  baseUrl?: string;
}

type DefaultApiData = {
  accessToken?: string;
  challengeId?: string;
  code?: string;
  expireDate?: string | number;
  isNewUser?: boolean;
  refreshKey?: string;
  refreshToken?: string;
  [key: string]: unknown;
};

type DefaultApiResponse = {
  data: DefaultApiData;
  isSuccess?: boolean;
  message?: string;
  succeeded?: boolean;
  [key: string]: unknown;
};

export async function callApi<TResponse = DefaultApiResponse, TBody = unknown>({
  url,
  method = "POST",
  data,
  params,
  headers,
  requireAuth = true,
  signal,
  onUploadProgress,
  baseUrl = BASE_URL,
}: CallApiOptions<TBody>): Promise<TResponse> {
  const token = getCookie(ACCESS_TOKEN_COOKIE);
  const isFormData =
    typeof FormData !== "undefined" && data instanceof FormData;

  const finalHeaders: Record<string, AxiosHeaderValue> = {
    ...(isFormData
      ? {}
      : { "Content-Type": "application/json" }),
    ...(headers as Record<string, AxiosHeaderValue>),
  };

  if (requireAuth && token) {
    finalHeaders["Authorization"] = `Bearer ${token}`;
  }
  const api = axios.create({
    baseURL: baseUrl,
    withCredentials: false,
  });

  try {
    const response: AxiosResponse<TResponse> = await api.request({
      url,
      method,
      data: method === "GET" ? undefined : data,
      params,
      headers: finalHeaders,
      signal,
      onUploadProgress,
    });
    return response.data;
  } catch (e) {
    const error = e as AxiosError;

    if (error.response?.status === 401 && !url.includes(REFRESH_TOKEN)) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        // Retry the original request with the new token (cookie is updated, so auth header will use new token)
        return callApi({
          url,
          method,
          data,
          params,
          headers,
          requireAuth,
          signal,
          onUploadProgress,
        });
      } else {
        if (requireAuth) {
          window.location.href = "/login";
        }
        throw new Error("Failed to refresh token", {
          cause: e,
        });
      }
    }

    throw error;
  }
}
/* ------------------------------ Cookie Helpers ----------------------------- */
export function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const cookieStr = document.cookie;
  const cookies = cookieStr.split("; ");
  for (const cookie of cookies) {
    const [key, value] = cookie.split("=");
    if (key === name) return decodeURIComponent(value);
  }
  return undefined;
}
export function setCookie(name: string, value: string, days = 7) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(
    value,
  )}; expires=${expires}; path=/`;
}

export function clearCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; Max-Age=0; path=/`;
}
export function getCookie(name: string) {
  const cookieName = `${name}=`;
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookies = decodedCookie.split(";");

  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i];
    while (cookie.charAt(0) === " ") {
      cookie = cookie.substring(1);
    }
    if (cookie.indexOf(cookieName) === 0) {
      return cookie.substring(cookieName.length, cookie.length);
    }
  }
  return "";
}
