import { TPost } from "core/types";
import Timestamp from "components/timestamp";
import PostContent from "components/postContent";
import Hexatar from "./hexatar";
import { Link } from "react-router-dom";

function Contents({post, id, posterId}: {post?: TPost, id: string, posterId: string}) {
  if (!post) {
    return <div className="text-green-600 italic font-mono">encrypted</div>;
  }

  return (
    <div>
      <Link to={`/posts/${posterId}/${id}`}><Timestamp ts={post.createdAt} /></Link>
      <PostContent post={post} />
    </div>
  )
}

export default function Post({ id, post, pubKey }: { id: string, post?: TPost, pubKey: string }) {
  return (
    <div className="flex space-x-3 mb-5">
      <Hexatar hex={pubKey} />
      <Contents post={post} id={id} posterId={pubKey} />
    </div>
  );
}
