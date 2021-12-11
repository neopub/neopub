import fs from "fs";

async function loadID() {
  const id = await fs.promises.readFile("id.json");
  const json = id.toString();
  const creds = JSON.parse(json);
  console.log(creds)
}

loadID();

// Get index.

// Get auth token.
// 