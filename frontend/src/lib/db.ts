import Dexie from "dexie";

const DB = new Dexie("neopub");
DB.version(3).stores({
  subscriptions: "pubKey, host, worldKeyHex",
  posts: "hash, publisherPubKey, createdAt, post",
  indexes: "pubKey, index, updatedAt", // Is this used? delete if dead
});

export async function wipeDB() {
  await DB.delete();
  return DB.open();
}

export default DB as any;