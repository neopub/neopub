import { TPost } from "core/types";
import Timestamp from "components/timestamp";
import PostContent from "components/postContent";
import Hexatar from "./hexatar";
import { Link } from "react-router-dom";

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

export default function Post({ id, post, pubKey }: { id: string, post?: TPost, pubKey: string }) {
  return (
    <Link to={`/posts/${pubKey}/${id}`} className="flex space-x-3 no-underline">
      <Hexatar hex={pubKey} />
      <Contents post={post} />
    </Link>
  );
}
