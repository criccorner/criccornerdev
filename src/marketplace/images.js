import { uploadAvatar, publicAvatarUrl } from "../cloud/api";

// A marketplace picture goes to the same public picture storage as profile photos (each person writes into their own folder).
export async function uploadMarketImage(userId, uri) {
  const blob = await (await fetch(uri)).blob();
  const path = `${userId}/market_${Date.now()}.jpg`;
  await uploadAvatar(path, blob, "image/jpeg");
  return publicAvatarUrl(path);
}
