// Shapes the cloud "profiles" row into the account object the screens use.
export const BLOCKED_MESSAGE = "You have been blocked by administrator to use this application.";

export function profileToUser(p) {
  if (!p) return null;
  const blocked = !!p.blocked;
  return {
    id: p.id,
    identifier: p.email, // what is shown as the login (email)
    email: p.email,
    type: "email",
    phone: p.phone || null,
    name: p.name || "",
    role: p.role || "Batter",
    battingStyle: p.batting_style || null,
    bowlingStyle: p.bowling_style || null,
    city: p.city || null,
    photoUrl: p.photo_url || null,
    photoFile: p.photo_url || null,
    verified: true,
    blocked,
    isAdmin: !!p.is_admin && !blocked,
    isPrimaryAdmin: !!p.is_primary,
    createdAt: p.created_at ? Date.parse(p.created_at) : 0,
  };
}

// Friendly text for common network / server problems.
export function friendlyError(e, fallback = "Something went wrong. Please try again.") {
  if (!e) return fallback;
  if (e.status === 0) return e.message || "No internet connection.";
  if (e.status === 429) return "Too many attempts right now. Please wait a minute and try again.";
  if (e.status >= 500) return "The server is having trouble. Please try again shortly.";
  return e.message || fallback;
}
