export interface IProfile {
  handle?: string;
  bio?: string;
  avatarURL?: string;
  worldKey: string;
}

interface IPostMetadata {
  createdAt: string;
}

export interface ITextPost extends IPostMetadata {
  type: "text";
  content: {
    text: string;
  };
}

export interface IEncPost {
  id: string;
}

export interface ICodePost extends IPostMetadata {
  type: "code";
  content: {
    code: string;
  };
}

export type TPost = ITextPost | ICodePost;

export interface IIndex {
  posts: Array<TPost | IEncPost>;
  updatedAt: string;
}

export type PostVisibility = "world" | "subs";

export interface IAuthChallenge {
  chal: Uint8Array;
  diff: number;
}

export interface IPostKey {
  loc: string; // hex
  key: string; // hex-encoded ciphertext
}

// An IMessage is a message sent directly from one user to another.
export interface IMessage {
  pubKey: string; // Sender's identity.
  type: "subscribe" | "reply";
}
export interface ISubReq extends IMessage {
  msg: string;
  host: string;
}

export interface IReply extends IMessage {
  msg: string;
  postId: string;
  createdAt: string;
}

export type NotFound = "notfound";

interface IUserCapability {
  type: "user";
  pubKey: string;
}
interface IMessageCapability {
  type: "message";
  hash: string;
  numBytes: number;
}

export type CapabilityDescription = IUserCapability | IMessageCapability;