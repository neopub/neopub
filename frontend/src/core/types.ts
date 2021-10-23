export interface IProfile {
  handle: string;
  avatarURL: string;
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

export interface IReq {
  pubKey: string;
  msg: string;
}

export interface IAuthChallenge {
  chal: Uint8Array;
  diff: number;
}

export interface IPostKey {
  loc: string; // hex
  key: string; // hex-encoded ciphertext
}

export interface ISubReq {
  pubKey: string;
  msg: string;
}

export type NotFound = "notfound";
