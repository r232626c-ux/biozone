import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import SendIcon from "@mui/icons-material/Send";
import { InteractionRequiredAuthError } from "@azure/msal-browser";

import { API_URL } from "../utils/api";
import {
  getMsalInstance,
  initializeMsal,
  outlookConfigured,
  outlookRedirectUri,
  outlookScopes,
} from "../utils/outlookAuth";

const GRAPH_URL = "https://graph.microsoft.com/v1.0";

const getErrorMessage = (error) =>
  error.response?.data?.error?.message ||
  error.response?.data?.error_description ||
  error.message ||
  "The Outlook request failed.";

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString();
};

const getMessageText = (message) => {
  const content = message?.body?.content || message?.bodyPreview || "";
  if (message?.body?.contentType?.toLowerCase() !== "html") return content;
  return new DOMParser().parseFromString(content, "text/html").body.textContent || "";
};

const acquireGraphToken = async (instance, account) => {
  try {
    const response = await instance.acquireTokenSilent({
      scopes: outlookScopes,
      account,
    });
    return response.accessToken;
  } catch (error) {
    if (!(error instanceof InteractionRequiredAuthError)) throw error;
    const response = await instance.acquireTokenPopup({
      scopes: outlookScopes,
      account,
      redirectUri: outlookRedirectUri,
    });
    return response.accessToken;
  }
};

const OutlookEmails = () => {
  const [account, setAccount] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [auditWarning, setAuditWarning] = useState("");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [messageLoading, setMessageLoading] = useState(false);
  const [messageError, setMessageError] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [composeError, setComposeError] = useState("");
  const [sendError, setSendError] = useState("");
  const [sending, setSending] = useState(false);

  const recipients = useMemo(
    () =>
      to
        .split(/[;,\n]+/)
        .map((address) => address.trim())
        .filter(Boolean),
    [to]
  );

  const loadInbox = useCallback(async (targetAccount) => {
    if (!targetAccount) return;
    setInboxLoading(true);
    setError("");
    try {
      const accessToken = await acquireGraphToken(getMsalInstance(), targetAccount);
      const response = await axios.get(`${GRAPH_URL}/me/mailFolders/inbox/messages`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          "$select": "id,subject,from,receivedDateTime,bodyPreview,isRead",
          "$top": 30,
          "$orderby": "receivedDateTime desc",
        },
      });
      setMessages(Array.isArray(response.data.value) ? response.data.value : []);
    } catch (requestError) {
      console.error("Failed to load Outlook inbox", requestError);
      setError(getErrorMessage(requestError));
    } finally {
      setInboxLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const restoreAccount = async () => {
      if (!outlookConfigured) {
        setInitializing(false);
        return;
      }

      try {
        const instance = await initializeMsal();
        const restoredAccount =
          instance.getActiveAccount() || instance.getAllAccounts()[0] || null;
        if (!active) return;
        if (restoredAccount) {
          instance.setActiveAccount(restoredAccount);
          setAccount(restoredAccount);
          await loadInbox(restoredAccount);
        }
      } catch (initializationError) {
        if (active) setError(getErrorMessage(initializationError));
      } finally {
        if (active) setInitializing(false);
      }
    };

    restoreAccount();
    return () => {
      active = false;
    };
  }, [loadInbox]);

  const signIn = async () => {
    setAuthLoading(true);
    setError("");
    try {
      const instance = await initializeMsal();
      const response = await instance.loginPopup({
        scopes: outlookScopes,
        redirectUri: outlookRedirectUri,
      });
      instance.setActiveAccount(response.account);
      setAccount(response.account);
      await loadInbox(response.account);
    } catch (signInError) {
      console.error("Outlook sign-in failed", signInError);
      setError(getErrorMessage(signInError));
    } finally {
      setAuthLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await getMsalInstance().logoutPopup({ account });
      setAccount(null);
      setMessages([]);
      setSelectedMessage(null);
    } catch (signOutError) {
      console.error("Outlook sign-out failed", signOutError);
      setError(getErrorMessage(signOutError));
    }
  };

  const openMessage = async (message) => {
    setSelectedMessage(message);
    setMessageError("");
    setMessageLoading(true);
    try {
      const accessToken = await acquireGraphToken(getMsalInstance(), account);
      const response = await axios.get(`${GRAPH_URL}/me/messages/${message.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          "$select": "id,subject,from,toRecipients,receivedDateTime,body,isRead",
        },
      });
      setSelectedMessage(response.data);
    } catch (requestError) {
      console.error("Failed to load Outlook message", requestError);
      setMessageError(getErrorMessage(requestError));
    } finally {
      setMessageLoading(false);
    }
  };

  const prepareSend = () => {
    setComposeError("");
    if (recipients.length === 0) {
      setComposeError("Enter at least one recipient email address.");
      return;
    }
    if (recipients.some((address) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address))) {
      setComposeError("Check the recipient email address format.");
      return;
    }
    setComposeOpen(false);
    setSendError("");
    setConfirmOpen(true);
  };

  const sendMessage = async () => {
    setSending(true);
    setSendError("");
    setAuditWarning("");

    if (!outlookConfigured) {
      try {
        const encodedRecipients = recipients
          .map((address) => encodeURIComponent(address).replace(/%40/gi, "@"))
          .join(",");
        const query = [];
        if (subject.trim()) query.push(`subject=${encodeURIComponent(subject.trim())}`);
        query.push(`body=${encodeURIComponent(body)}`);
        const mailtoUrl = `mailto:${encodedRecipients}?${query.join("&")}`;
        const link = document.createElement("a");
        link.href = mailtoUrl;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        link.remove();

        setConfirmOpen(false);
        setSuccess(
          "Your default email app should open with this draft. Review it and press Send there; Biozone cannot verify delivery."
        );
        setTo("");
        setSubject("");
        setBody("");

        try {
          const appToken = localStorage.getItem("token");
          if (!appToken) throw new Error("Your Biozone session has expired.");
          await axios.post(
            `${API_URL}/api/audit-logs/email-compose`,
            { recipients },
            { headers: { Authorization: `Bearer ${appToken}` } }
          );
        } catch (auditError) {
          console.error("Could not record email app handoff", auditError);
          setAuditWarning(
            "The email draft was handed off, but Biozone could not record the audit event."
          );
        }
      } catch (handoffError) {
        console.error("Could not open the default email app", handoffError);
        setSendError("Could not open the default email app. Check your device's email app settings.");
      } finally {
        setSending(false);
      }
      return;
    }

    if (!account) {
      setSendError("Connect a Microsoft mailbox before sending from Outlook.");
      setSending(false);
      return;
    }

    try {
      const accessToken = await acquireGraphToken(getMsalInstance(), account);
      await axios.post(
        `${GRAPH_URL}/me/sendMail`,
        {
          message: {
            subject: subject.trim(),
            body: { contentType: "Text", content: body },
            toRecipients: recipients.map((address) => ({
              emailAddress: { address },
            })),
          },
          saveToSentItems: true,
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      try {
        const appToken = localStorage.getItem("token");
        if (!appToken) throw new Error("Your Biozone session has expired.");
        await axios.post(
          `${API_URL}/api/audit-logs/email-sent`,
          { recipients },
          { headers: { Authorization: `Bearer ${appToken}` } }
        );
      } catch (auditError) {
        console.error("Email was accepted, but the audit event could not be recorded", auditError);
        setAuditWarning(
          "Microsoft accepted the email, but Biozone could not record the audit event. Contact an administrator."
        );
      }
      setConfirmOpen(false);
      setTo("");
      setSubject("");
      setBody("");
      setSuccess(
        "Microsoft accepted the email submission. Delivery depends on Microsoft 365 and the recipient's mail provider."
      );
      await loadInbox(account);
    } catch (sendRequestError) {
      console.error("Failed to send Outlook email", sendRequestError);
      setSendError(getErrorMessage(sendRequestError));
    } finally {
      setSending(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 0, px: { xs: 0, md: 1 }, mb: 4 }}>
      <Paper elevation={0} sx={{ borderRadius: 2, overflow: "hidden" }}>
        <Toolbar
          sx={{
            minHeight: 64,
            borderBottom: "1px solid",
            borderColor: "divider",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h5" fontWeight={650}>
              Emails
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Outlook inbox and email composition
            </Typography>
          </Box>
          {(account || !outlookConfigured) && (
            <Stack direction="row" spacing={1} alignItems="center">
              {account ? (
                <>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ display: { xs: "none", sm: "block" } }}
                  >
                    {account.username}
                  </Typography>
                  <Button
                    startIcon={<RefreshIcon />}
                    onClick={() => loadInbox(account)}
                    disabled={inboxLoading}
                    variant="outlined"
                  >
                    Refresh
                  </Button>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Uses your default email app
                </Typography>
              )}
              <Button
                startIcon={<EmailOutlinedIcon />}
                onClick={() => {
                  setSuccess("");
                  setAuditWarning("");
                  setComposeOpen(true);
                }}
                variant="contained"
              >
                Compose
              </Button>
              {account && (
                <Button onClick={signOut} color="inherit">
                  Disconnect
                </Button>
              )}
            </Stack>
          )}
        </Toolbar>

        <Box sx={{ p: 2 }}>
          {!outlookConfigured && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Compose opens your device's default email app. Inbox viewing and
              sending directly through Outlook require optional Microsoft Graph
              configuration.
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
              {success}
            </Alert>
          )}
          {auditWarning && (
            <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setAuditWarning("")}>
              {auditWarning}
            </Alert>
          )}

          {outlookConfigured && !account && (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <EmailOutlinedIcon color="primary" sx={{ fontSize: 44, mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                Connect your Outlook mailbox
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                Choose your Microsoft account to view its inbox inside Biozone.
              </Typography>
              <Button
                onClick={signIn}
                disabled={initializing || authLoading}
                variant="contained"
              >
                {initializing || authLoading ? "Connecting..." : "Sign in with Microsoft"}
              </Button>
            </Box>
          )}

          {outlookConfigured && account && (
            <>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Inbox
              </Typography>
              {inboxLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                  <CircularProgress />
                </Box>
              ) : messages.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                  No messages found in your inbox.
                </Typography>
              ) : (
                <List disablePadding>
                  {messages.map((message, index) => (
                    <Box key={message.id}>
                      {index > 0 && <Divider />}
                      <ListItemButton onClick={() => openMessage(message)} sx={{ py: 1.5 }}>
                        <ListItemText
                          primary={
                            <Stack
                              direction={{ xs: "column", sm: "row" }}
                              justifyContent="space-between"
                              gap={1}
                            >
                              <Typography
                                fontWeight={message.isRead ? 400 : 700}
                                sx={{ overflowWrap: "anywhere" }}
                              >
                                {message.subject || "(No subject)"}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ whiteSpace: "nowrap" }}
                              >
                                {formatDate(message.receivedDateTime)}
                              </Typography>
                            </Stack>
                          }
                          secondary={
                            <>
                              <Typography component="span" variant="body2" color="text.primary">
                                {message.from?.emailAddress?.name ||
                                  message.from?.emailAddress?.address ||
                                  "Unknown sender"}
                              </Typography>
                              {" — "}
                              {message.bodyPreview || ""}
                            </>
                          }
                        />
                      </ListItemButton>
                    </Box>
                  ))}
                </List>
              )}
            </>
          )}
        </Box>
      </Paper>

      <Dialog
        open={Boolean(selectedMessage)}
        onClose={() => setSelectedMessage(null)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>{selectedMessage?.subject || "(No subject)"}</DialogTitle>
        <DialogContent dividers>
          {selectedMessage && (
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                From: {selectedMessage.from?.emailAddress?.name || ""}{" "}
                &lt;{selectedMessage.from?.emailAddress?.address || ""}&gt;
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Received: {formatDate(selectedMessage.receivedDateTime)}
              </Typography>
              <Divider />
              {messageLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : messageError ? (
                <Alert severity="error">{messageError}</Alert>
              ) : (
                <Typography sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                  {getMessageText(selectedMessage)}
                </Typography>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedMessage(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={composeOpen} onClose={() => setComposeOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Compose email</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {composeError && <Alert severity="error">{composeError}</Alert>}
            <TextField
              autoFocus
              label="To"
              placeholder="name@example.com; another@example.com"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              helperText="Any valid email address is allowed, including recipients outside your organization. Separate multiple addresses with commas, semicolons, or new lines."
              fullWidth
            />
            <TextField
              label="Subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              fullWidth
            />
            <TextField
              label="Message"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              multiline
              minRows={8}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setComposeOpen(false)}>Cancel</Button>
          <Button onClick={prepareSend} variant="contained" startIcon={<SendIcon />}>
            Review and send
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirmOpen}
        onClose={() => !sending && setConfirmOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Confirm email</DialogTitle>
        <DialogContent dividers>
          {sendError && <Alert severity="error" sx={{ mb: 2 }}>{sendError}</Alert>}
          <Typography>
            {outlookConfigured
              ? <>Send this email from <strong>{account?.username}</strong>?</>
              : "Open your default email app with this draft?"}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            To: {recipients.join(", ")}
          </Typography>
          <Typography variant="body2">Subject: {subject || "(No subject)"}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={sending}>
            Cancel
          </Button>
          <Button
            onClick={sendMessage}
            disabled={sending}
            variant="contained"
            startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
          >
            {sending
              ? "Opening..."
              : outlookConfigured
                ? "Send email"
                : "Open email app"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default OutlookEmails;
