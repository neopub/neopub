import Dexie from "dexie";

const DB: any = new Dexie("neopub");
DB.version(7).stores({
  subscriptions: "pubKey, host, worldKeyHex, handle",
  followers: "pubKey, host",
  posts: "hash, publisherPubKey, createdAt, post, replyToHash",
  indexes: "pubKey, index, updatedAt", // Is this used? delete if dead
  profiles: "pubKey, host, worldKeyHex, handle, bio, following, followsMe"
});

export async function wipeDB() {
  await DB.delete();
  return DB.open();
}

export async function dumpState() {
  const following = await DB.subscriptions.toArray();
  const followers = await DB.followers.toArray();
  return { followers, following };
}

export async function loadStateDangerously(state: any) {
  const { followers, following } = state;
  
  DB.transaction("rw", [DB.subscriptions, DB.followers], async () => {
    return Promise.all([
      DB.subscriptions.clear(),
      DB.subscriptions.bulkAdd(following),
      DB.followers.clear(),
      DB.followers.bulkAdd(followers),
    ]);
  });
}

export default DB;