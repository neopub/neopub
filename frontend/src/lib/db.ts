import Dexie from "dexie";

const DB = new Dexie("neopub");
DB.version(1).stores({
  subscriptions: "pubKey",
  posts: "hash, publisherPubKey, post",
});

export default DB as any;