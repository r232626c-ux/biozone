import { PublicClientApplication } from "@azure/msal-browser";

const clientId = import.meta.env.VITE_MSAL_CLIENT_ID?.trim() || "";
const tenantId = import.meta.env.VITE_MSAL_TENANT_ID?.trim() || "organizations";

const authority = tenantId.startsWith("https://")
  ? tenantId
  : `https://login.microsoftonline.com/${tenantId}`;

const redirectUri =
  import.meta.env.VITE_MSAL_REDIRECT_URI?.trim() ||
  `${window.location.origin}/dashboard/research`;

export const outlookConfigured = Boolean(clientId);
export const outlookRedirectUri = redirectUri;
export const outlookScopes = ["Mail.Read", "Mail.Send"];

let msalInstance;
let initialization;

export const getMsalInstance = () => {
  if (!outlookConfigured) {
    throw new Error("Set VITE_MSAL_CLIENT_ID to enable Outlook.");
  }

  if (!msalInstance) {
    msalInstance = new PublicClientApplication({
      auth: {
        clientId,
        authority,
        redirectUri,
        postLogoutRedirectUri: redirectUri,
      },
      cache: {
        cacheLocation: "sessionStorage",
      },
    });
  }

  return msalInstance;
};

export const initializeMsal = async () => {
  const instance = getMsalInstance();
  if (!initialization) {
    initialization = instance.initialize();
  }
  await initialization;
  return instance;
};
