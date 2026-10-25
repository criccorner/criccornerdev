import { uploadAvatar, publicAvatarUrl } from "../cloud/api";

// Uploads a team logo to the same public picture storage as profile photos.
// The file must sit in the uploader's own folder, which is what the storage rules allow.
export async function uploadTeamLogo(userId, teamId, uri) {
  const blob = await (await fetch(uri)).blob();
  const path = `${userId}/team_${String(teamId).replace(/[^a-zA-Z0-9_-]/g, "")}_${Date.now()}.jpg`;
  await uploadAvatar(path, blob, "image/jpeg");
  return publicAvatarUrl(path);
}
