import Dexie from "dexie";

const DB = new Dexie("neopub");
DB.version(2).stores({
  subscriptions: "pubKey",
  posts: "hash, publisherPubKey, createdAt, post",
  indexes: "pubKey, index, updatedAt",
});

export async function wipeDB() {
  await DB.delete();
  return DB.open();
}

export default DB as any;