import Dexie from "dexie";

const db = new Dexie("neopub");
db.version(1).stores({
  subscriptions: "pubKey",
});

export default db as any;