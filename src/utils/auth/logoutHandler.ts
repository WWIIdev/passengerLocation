const ACCESS_TOKEN_COOKIE = "passengerAccessToken";
const REFRESH_TOKEN_COOKIE = "passengerRefreshToken";

const clearCookie = (name: string) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; Max-Age=0; path=/`;
};

export const logoutHandler = () => {
  clearCookie(ACCESS_TOKEN_COOKIE);
  clearCookie(REFRESH_TOKEN_COOKIE);
  localStorage.clear();
  sessionStorage.clear();
  window?.location.reload();
  window.location.pathname = "/login";
};
