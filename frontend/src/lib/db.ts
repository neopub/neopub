import Dexie from "dexie";

const DB: any = new Dexie("neopub");
DB.version(9).stores({
  subscriptions: "pubKey, host, worldKeyHex, handle",
  followers: "pubKey, host",
  posts: "hash, publisherPubKey, createdAt, post, replyToHash",
  postKeys: "keyLoc, postHash, subPubKey", // TODO: record post key and derive location instead?
  indexes: "pubKey, index, updatedAt", // Is this used? delete if dead
  profiles: "pubKey, host, worldKeyHex, handle, bio, following, followsMe",
});

export async function wipeDB() {
  await DB.delete();
  return DB.open();
}

// TODO: stronger types.
interface ILocalState {
  following: any[];
  followers: any[];
  profiles: any[];
}

export async function dumpState(): Promise<ILocalState> {
  const following = await DB.subscriptions.toArray();
  const followers = await DB.followers.toArray();
  const profiles = await DB.profiles.toArray();
  return { followers, following, profiles };
}

export async function loadStateDangerously(state: ILocalState) {
  const { followers, following, profiles } = state;
  
  DB.transaction("rw", [DB.subscriptions, DB.followers, DB.profiles], async () => {
    return Promise.all([
      DB.subscriptions.clear(),
      DB.subscriptions.bulkAdd(following),
      DB.followers.clear(),
      DB.followers.bulkAdd(followers),
      DB.profiles.clear(),
      DB.profiles.bulkAdd(profiles),
    ]);
  });
}

export default DB;