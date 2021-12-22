import { IIndex, TPost } from "core/types";
import Dexie from "dexie";

interface IDBSubscription {
  pubKey: string;
  host: string;
  worldKeyHex: string;
  handle?: string;
}

interface IDBFollower {
  pubKey: string;
  host: string;
}

interface IDBPost {
  hash: string;
  publisherPubKey: string;
  // createdAt: Date;
  post: TPost;
  replyToHash?: string;
}

interface IDBPostKey {
  keyLoc: string;
  postHash: string;
  subPubKey: string;
}

interface IDBIndex {
  pubKey: string;
  index: IIndex;
  // updatedAt: Date;
}

interface IDBProfile {
  pubKey: string;
  host?: string;
  worldKey: string;
  handle?: string;
  bio?: string;
  following: boolean;
  followsMe: boolean;
}
class NeoPubDexie extends Dexie {
  subscriptions!: Dexie.Table<IDBSubscription, string>;
  followers!: Dexie.Table<IDBFollower, string>;
  posts!: Dexie.Table<IDBPost, string>;
  postKeys!: Dexie.Table<IDBPostKey, string>;
  indexes!: Dexie.Table<IDBIndex, string>;
  profiles!: Dexie.Table<IDBProfile, string>;

  constructor() {
    super("neopub");

    this.version(11).stores({
      subscriptions: "pubKey",
      followers: "pubKey",
      posts: "hash, publisherPubKey, createdAt, replyToHash",
      postKeys: "postHash", // TODO: record post key and derive location instead?
      indexes: "pubKey",
      profiles: "pubKey",
    });
  }
}

const DB = new NeoPubDexie();

export async function wipeDB() {
  await DB.delete();
  return DB.open();
}

interface ILocalState {
  following: IDBSubscription[];
  followers: IDBFollower[];
  profiles: IDBProfile[];
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