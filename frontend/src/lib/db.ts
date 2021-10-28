import Dexie from "dexie";

const DB = new Dexie("neopub");
DB.version(2).stores({
  subscriptions: "pubKey",
  posts: "hash, publisherPubKey, createdAt, post",
  indexes: "pubKey, index, updatedAt",
});

export default DB as any;