import { OWNER_NAME, SUPPORT_EMAIL, GOVERNING_LAW, FIRST_YEAR } from "./config";

const unset = (v) => !v || /^YOUR_/.test(v);
export const ownerName = () => (unset(OWNER_NAME) ? "CricCorner" : OWNER_NAME);
export const supportEmail = () => (unset(SUPPORT_EMAIL) ? "the support contact in the app store listing" : SUPPORT_EMAIL);
export const governingLaw = () => (unset(GOVERNING_LAW) ? "the country where the app owner is based" : GOVERNING_LAW);

export function copyrightLine(now = new Date()) {
  const y = now.getFullYear();
  return `© ${y > FIRST_YEAR ? `${FIRST_YEAR}–${y}` : FIRST_YEAR} ${ownerName()}. All rights reserved.`;
}

// Short notice shown once after login and in the footer.
export const NOTICE =
  "CricCorner, its name, design, software and content are protected by copyright. You may not copy, modify, reverse-engineer or redistribute the app. " +
  "You keep the rights to what you add (team logos, photos, scores) and must only add things you have the right to use.";

export function termsSections() {
  return [
    { h: "1. Using CricCorner", p: `By using CricCorner you agree to these terms and to our Privacy Policy. If you do not agree, please do not use the app.` },
    { h: "2. Copyright and ownership", p: `${copyrightLine()} The CricCorner app, its name, logo, design, software and written content belong to ${ownerName()} or its licensors. You may use the app for its intended purpose, but you may not copy, modify, sell, rent, decompile, reverse-engineer or redistribute the app or any part of it, except where the law allows it.` },
    { h: "3. Your content", p: `You keep ownership of what you add to CricCorner, such as team names, logos, photos, scores and links. You give us permission to store it and to show it to other users of the app so the app can work. You confirm that you have the right to use everything you add, and that it does not infringe anyone else's copyright, trademark or privacy.` },
    { h: "4. Other people's content and trademarks", p: `Instagram, Facebook, WhatsApp, Google and Apple are trademarks of their owners. CricCorner is not affiliated with or endorsed by them. Highlight links open third-party websites and apps; we do not control or own that content. Only add links to content you own or have permission to share.` },
    { h: "5. Acceptable use", p: `Do not add unlawful, abusive, misleading or offensive content, impersonate another person, create fake accounts, try to get around the app's security, collect other users' information, or interfere with how the app works. Captains and administrators may correct or remove content, and we may suspend accounts that break these rules.` },
    { h: "6. Copyright complaints", p: `If you believe something in CricCorner infringes your copyright, email ${supportEmail()} with what it is, where you saw it, and why you own the rights. We will review it and remove content where appropriate.` },
    { h: "7. Your account", p: `You are responsible for your login and for what is done with it. You can delete your account at any time from Profile → Delete my account.` },
    { h: "8. Accuracy and liability", p: `Scores, statistics and awards are entered by users and calculated automatically, so they may contain mistakes. CricCorner is provided “as is”. To the extent the law allows, ${ownerName()} is not liable for losses caused by using the app or by missing or incorrect data. Nothing in these terms limits any rights you have under consumer law that cannot be excluded.` },
    { h: "9. Changes and contact", p: `We may update these terms and will tell you in the app when they change in an important way. They are governed by the laws of ${governingLaw()}. Questions: ${supportEmail()}.` },
  ];
}
