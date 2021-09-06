import { TPost, IEncPost } from "core/types";
import EncryptedPost from "components/encryptedPost";
import Post from "components/post";

interface IProps {
  post: TPost | IEncPost;
  pubKey: string;
  worldKeyHex?: string;
}
export default function MaybeEncryptedPost({
  post,
  pubKey,
  worldKeyHex,
}: IProps) {
  if ((post as any).id) {
    return (
      <EncryptedPost
        enc={post as IEncPost}
        pubKey={pubKey}
        worldKeyHex={worldKeyHex}
      />
    );
  }

  return <Post post={post as TPost} pubKey={pubKey} />;
}
