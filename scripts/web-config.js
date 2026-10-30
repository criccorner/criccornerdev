// Prepares app.json for the website build. Used by the GitHub workflow (the change is NOT committed).
//   node scripts/web-config.js <repo-name>
// A project site lives at https://<user>.github.io/<repo-name>/, so the app must know that sub-folder.
const fs = require("fs");
const repo = process.argv[2] || "";
const file = "app.json";
const j = JSON.parse(fs.readFileSync(file, "utf8"));
const ex = j.expo || (j.expo = {});
ex.web = { ...(ex.web || {}), bundler: "metro", output: "single", favicon: ex.web && ex.web.favicon ? ex.web.favicon : "./assets/favicon.png" };
if (repo && !/\.github\.io$/i.test(repo)) ex.experiments = { ...(ex.experiments || {}), baseUrl: "/" + repo };
fs.writeFileSync(file, JSON.stringify(j, null, 2));
console.log("app.json ready for web" + (ex.experiments && ex.experiments.baseUrl ? " at " + ex.experiments.baseUrl : ""));
