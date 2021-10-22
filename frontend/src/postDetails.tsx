import EncryptedPost from "components/encryptedPost";
import { IProfile } from "core/types";
import { useJSON } from "lib/useJSON";
import { useParams } from "react-router-dom";

export default function PostDetails() {
  const { userId, postId } = useParams<{ userId: string, postId: string }>();

  const [profile] = useJSON<IProfile>(userId, "profile.json", { handle: "", avatarURL: "", worldKey: "" });

  if (!(userId && postId)) {
    return null;
  }
  
  if (profile === "notfound") {
    return null;
  }

  const worldKeyHex = profile?.worldKey;

  return (
    <EncryptedPost
      enc={{ id: postId }}
      pubKey={userId}
      worldKeyHex={worldKeyHex}
      showEncHex
    />
  )
}
