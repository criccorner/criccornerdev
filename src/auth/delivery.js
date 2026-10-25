import { Alert } from "react-native";

// ---------------------------------------------------------------------------
// DEMO MODE: no email/SMS is actually sent. The code is shown in an alert so
// you can test the whole flow. For production, replace the body of this
// function with a call to YOUR backend (e.g. POST /auth/send-code), which
// sends the email/SMS using a provider such as SendGrid, AWS SES, or Twilio.
// See README-AUTH.md. Never put provider API keys inside the app.
// ---------------------------------------------------------------------------
export async function deliverCode({ type, identifier, code, purpose }) {
  const channel = type === "email" ? "email" : "SMS";
  const what = purpose === "reset" ? "password reset" : "verification";
  Alert.alert(
    "Demo mode: nothing was actually sent",
    `In production this ${channel} would go to ${identifier}.\n\nYour ${what} code is: ${code}`
  );
}
