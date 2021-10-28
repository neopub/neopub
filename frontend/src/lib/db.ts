import Dexie from "dexie";

let DB: Dexie;

function init() {
  const DB = new Dexie("neopub");
  DB.version(2).stores({
    subscriptions: "pubKey",
    posts: "hash, publisherPubKey, createdAt, post",
    indexes: "pubKey, index, updatedAt",
  });

  return DB;
}

export function wipeDB() {
  DB.delete();
  DB = init();
}

DB = init();

export default DB as any;