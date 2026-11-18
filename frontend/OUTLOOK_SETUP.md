# In-app Outlook setup

Microsoft Graph enables inbox viewing and sending directly inside Biozone.
Without Graph configuration, Compose uses the device's default email app.
Inbox and message content fetched through Graph are not stored by Biozone.
Email activity records recipient addresses in the admin-only Audit Logs, but
not message subjects or bodies. Microsoft 365 and recipient providers control
final delivery.

1. In Microsoft Entra ID, create an app registration and add a **Single-page
   application (SPA)** redirect URI. Use the exact origin where Vite is opened,
   followed by `/dashboard/research` (for example,
   `http://127.0.0.1:5173/dashboard/research`).
2. Add Microsoft Graph **delegated** API permissions `Mail.Read` and `Mail.Send`.
   Grant admin consent if required by your organization's policy.
3. Copy `frontend/.env.example` to `frontend/.env.local`. Set
   `VITE_MSAL_CLIENT_ID` to the registration's **Application (client) ID**.
   `VITE_MSAL_TENANT_ID` is optional; when omitted, Biozone uses `organizations`
   for work or school accounts. The redirect URI can be set explicitly with
   `VITE_MSAL_REDIRECT_URI`.
4. Restart the Vite development server, open `/dashboard/research`, and select
   **Sign in with Microsoft**.
5. Select the mailbox to use. Compose a message, enter recipient addresses
   from any domain, choose **Review and send**, then confirm.

Do not add a client secret to the frontend. MSAL uses the SPA authorization
code flow with PKCE and keeps its token cache in session storage.
