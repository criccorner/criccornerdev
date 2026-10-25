import { rest, uploadAvatar, removeAvatar, publicAvatarUrl } from "../cloud/api";
import { friendlyError, BLOCKED_MESSAGE } from "../auth/db";
import { ROLES, parsePhoneOptional } from "../auth/validators";

export const BATTING_STYLES = ["Right-hand bat", "Left-hand bat"];
export const BOWLING_STYLES = [
  "Does not bowl",
  "Right-arm fast",
  "Right-arm medium",
  "Right-arm off spin",
  "Right-arm leg spin",
  "Left-arm fast",
  "Left-arm medium",
  "Left-arm spin",
];

const fail = (error) => ({ ok: false, error });
const AVATAR_MARKER = "/object/public/avatars/";

// The photo now lives online (so everyone can see it); the account keeps its web address.
export function photoUriFor(user) {
  return (user && (user.photoUrl || user.photoFile)) || null;
}

export const pathFromUrl = (url) => {
  const i = url ? url.indexOf(AVATAR_MARKER) : -1;
  return i >= 0 ? url.slice(i + AVATAR_MARKER.length) : null;
};

export async function updateMyProfile(userId, { name, role, battingStyle, bowlingStyle, city, phone, newPhotoUri, removePhoto }) {
  const nm = (name || "").trim();
  if (!nm) return fail("Please enter your name.");
  if (nm.length > 60) return fail("Name must be 60 characters or fewer.");
  if (!ROLES.includes(role)) return fail("Please choose your playing role.");
  if (battingStyle && !BATTING_STYLES.includes(battingStyle)) return fail("Please choose a valid batting style.");
  if (bowlingStyle && !BOWLING_STYLES.includes(bowlingStyle)) return fail("Please choose a valid bowling style.");
  const cityText = (city || "").trim();
  if (cityText.length > 60) return fail("City must be 60 characters or fewer.");
  const ph = parsePhoneOptional(phone);
  if (ph === null) return fail("Enter a valid mobile number (8-15 digits), or leave it empty.");

  try {
    const cur = await rest(`profiles?select=photo_url,blocked&id=eq.${encodeURIComponent(userId)}`);
    const me = Array.isArray(cur.json) ? cur.json[0] : null;
    if (!me) return fail("Please log in again.");
    if (me.blocked) return fail(BLOCKED_MESSAGE);

    const oldUrl = me.photo_url || null;
    let photoUrl = oldUrl;
    if (newPhotoUri) {
      try {
        const blob = await (await fetch(newPhotoUri)).blob();
        const path = `${userId}/avatar_${Date.now()}.jpg`;
        await uploadAvatar(path, blob, "image/jpeg");
        photoUrl = publicAvatarUrl(path);
      } catch (e) {
        return fail(e && e.status === 0 ? "No internet connection. Couldn't upload the photo." : "Couldn't upload the photo. Please try again.");
      }
    } else if (removePhoto) {
      photoUrl = null;
    }

    await rest(`profiles?id=eq.${encodeURIComponent(userId)}`, {
      method: "PATCH",
      body: { name: nm, role, batting_style: battingStyle || null, bowling_style: bowlingStyle || null, city: cityText || null, phone: ph || null, photo_url: photoUrl },
      headers: { Prefer: "return=minimal" },
    });

    if (oldUrl && oldUrl !== photoUrl) {
      const p = pathFromUrl(oldUrl);
      if (p) removeAvatar(p).catch(() => {});
    }
    return { ok: true };
  } catch (e) {
    return fail(friendlyError(e));
  }
}

// Use an existing picture file (e.g. the old one saved on this phone) as the profile picture.
export async function setPhotoFromUri(userId, uri) {
  try {
    const cur = await rest(`profiles?select=photo_url,blocked&id=eq.${encodeURIComponent(userId)}`);
    const me = Array.isArray(cur.json) ? cur.json[0] : null;
    if (!me) return fail("Please log in again.");
    if (me.blocked) return fail(BLOCKED_MESSAGE);
    let photoUrl;
    try {
      const blob = await (await fetch(uri)).blob();
      const path = `${userId}/avatar_${Date.now()}.jpg`;
      await uploadAvatar(path, blob, "image/jpeg");
      photoUrl = publicAvatarUrl(path);
    } catch (e) {
      return fail(e && e.status === 0 ? "No internet connection. Couldn't upload the photo." : "Couldn't upload the photo. Please try again.");
    }
    await rest(`profiles?id=eq.${encodeURIComponent(userId)}`, { method: "PATCH", body: { photo_url: photoUrl }, headers: { Prefer: "return=minimal" } });
    const oldPath = pathFromUrl(me.photo_url);
    if (oldPath) removeAvatar(oldPath).catch(() => {});
    return { ok: true };
  } catch (e) {
    return fail(friendlyError(e));
  }
}
