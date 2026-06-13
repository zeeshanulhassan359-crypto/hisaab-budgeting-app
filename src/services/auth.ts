import { PublicClientApplication } from "@azure/msal-browser";
import type { Configuration, AccountInfo } from "@azure/msal-browser";

// Settings keys for dynamic configurations
const CLIENT_ID_KEY = "budget_app_client_id";
const TENANT_ID_KEY = "budget_app_tenant_id";
const REDIRECT_URI_KEY = "budget_app_redirect_uri";

// Default public sandbox configurations
const DEFAULT_CLIENT_ID = "c4a45a75-b82b-42ef-9f5b-b9d0dc07b8b2"; // Placeholder standard public client ID
const DEFAULT_TENANT = "common";

export interface OAuthConfig {
  clientId: string;
  tenantId: string;
  redirectUri: string;
}

export function getOAuthConfig(): OAuthConfig {
  return {
    clientId: localStorage.getItem(CLIENT_ID_KEY) || DEFAULT_CLIENT_ID,
    tenantId: localStorage.getItem(TENANT_ID_KEY) || DEFAULT_TENANT,
    redirectUri: localStorage.getItem(REDIRECT_URI_KEY) || window.location.origin,
  };
}

export function saveOAuthConfig(config: OAuthConfig) {
  localStorage.setItem(CLIENT_ID_KEY, config.clientId);
  localStorage.setItem(TENANT_ID_KEY, config.tenantId);
  localStorage.setItem(REDIRECT_URI_KEY, config.redirectUri);
}

export function clearOAuthConfig() {
  localStorage.removeItem(CLIENT_ID_KEY);
  localStorage.removeItem(TENANT_ID_KEY);
  localStorage.removeItem(REDIRECT_URI_KEY);
}

// Global MSAL Instance manager
let msalInstance: PublicClientApplication | null = null;
let initPromise: Promise<PublicClientApplication> | null = null;

export function getMsalInstance(): Promise<PublicClientApplication> {
  if (msalInstance) return Promise.resolve(msalInstance);
  if (initPromise) return initPromise;

  const config = getOAuthConfig();
  const msalConfig: Configuration = {
    auth: {
      clientId: config.clientId,
      authority: `https://login.microsoftonline.com/${config.tenantId}`,
      redirectUri: config.redirectUri,
      postLogoutRedirectUri: config.redirectUri,
    },
    cache: {
      cacheLocation: "localStorage",
    },
  };

  const instance = new PublicClientApplication(msalConfig);
  initPromise = instance.initialize().then(() => {
    msalInstance = instance;
    // Handle redirect promise on page load
    return instance.handleRedirectPromise().then(() => {
      // Set active account if none exists but we have accounts
      const accounts = instance.getAllAccounts();
      if (accounts.length > 0 && !instance.getActiveAccount()) {
        instance.setActiveAccount(accounts[0]);
      }
      return instance;
    });
  }).catch((err) => {
    console.error("MSAL Initialization failed", err);
    initPromise = null;
    throw err;
  });

  return initPromise;
}

export const loginScopes = {
  scopes: ["openid", "profile", "email", "User.Read", "Files.ReadWrite.AppFolder", "offline_access"],
};

export async function loginWithMicrosoft(): Promise<AccountInfo | null> {
  const instance = await getMsalInstance();
  try {
    // Attempt popup login first as it provides superior single-page application experience
    const loginResponse = await instance.loginPopup(loginScopes);
    instance.setActiveAccount(loginResponse.account);
    return loginResponse.account;
  } catch (error) {
    console.warn("Popup login failed or blocked, falling back to redirect", error);
    await instance.loginRedirect(loginScopes);
    return null;
  }
}

export async function logoutMicrosoft() {
  const instance = await getMsalInstance();
  const activeAccount = instance.getActiveAccount();
  if (activeAccount) {
    try {
      await instance.logoutPopup({
        account: activeAccount,
        postLogoutRedirectUri: window.location.origin,
      });
    } catch {
      await instance.logoutRedirect({
        account: activeAccount,
        postLogoutRedirectUri: window.location.origin,
      });
    }
  }
}

export async function getActiveAccountInfo(): Promise<AccountInfo | null> {
  const instance = await getMsalInstance();
  return instance.getActiveAccount();
}

export async function getAccessToken(): Promise<string | null> {
  const instance = await getMsalInstance();
  const activeAccount = instance.getActiveAccount();
  if (!activeAccount) return null;

  try {
    const response = await instance.acquireTokenSilent({
      ...loginScopes,
      account: activeAccount,
    });
    return response.accessToken;
  } catch (silentError) {
    console.warn("Silent token acquisition failed, seeking interactive consent", silentError);
    try {
      const response = await instance.acquireTokenPopup({
        ...loginScopes,
        account: activeAccount,
      });
      return response.accessToken;
    } catch (popupError) {
      console.error("Interactive token acquisition failed", popupError);
      return null;
    }
  }
}
