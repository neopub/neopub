import { TPost } from "core/types";
import Timestamp from "components/timestamp";
import PostContent from "components/postContent";
import Hexatar from "./hexatar";

function Contents({post}: {post?: TPost}) {
  if (!post) {
    return <div className="text-green-600 italic font-mono">encrypted</div>;
  }

  return (
    <div>
      <Timestamp ts={post.createdAt} />
      <PostContent post={post} />
    </div>
  )
}

export default function Post({ post, pubKey }: { post?: TPost, pubKey: string }) {
  return (
    <div className="flex space-x-3 mb-5">
      <Hexatar hex={pubKey} />
      <Contents post={post} />
    </div>
  );
}
