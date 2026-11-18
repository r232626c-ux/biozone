# Email

The Emails page accepts valid recipient addresses from any domain. Separate
multiple addresses with commas, semicolons, or new lines.

Without Microsoft Graph configuration, Compose hands the draft to the device's
default email app; the user reviews and sends it there. Biozone cannot verify
delivery through this handoff. With Graph configured, inbox viewing and sending
are available inside Biozone. Setup instructions are in
[OUTLOOK_SETUP.md](./OUTLOOK_SETUP.md).

Biozone logs recipient addresses and whether a message was accepted by Graph or
handed off to a mail app. It does not record message subjects or bodies.
Microsoft 365 and recipient providers may still restrict or reject delivery.
