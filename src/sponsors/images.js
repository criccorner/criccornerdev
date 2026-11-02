import { uploadAvatar, publicAvatarUrl } from "../cloud/api";

// Uploads a sponsor's picture to the same public picture storage as profile photos and team logos
// (each person writes only into their own folder).
export async function uploadSponsorImage(userId, uri) {
  const blob = await (await fetch(uri)).blob();
  const path = `${userId}/sponsor_${Date.now()}.jpg`;
  await uploadAvatar(path, blob, "image/jpeg");
  return publicAvatarUrl(path);
}
