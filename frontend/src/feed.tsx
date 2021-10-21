import Post from "components/post";
import { TPost } from "core/types";
import { usePublicKeyHex } from "lib/auth";
import DB from "lib/db";
import { useEffect, useState } from "react"

export default function Feed() {
  const pubKeyHex = usePublicKeyHex();
  
  const [posts, setPosts] = useState<any[]>([])
  useEffect(() => {
    async function loadPosts() {
      const posts = await DB.posts.orderBy("createdAt").reverse().toArray();
      setPosts(posts);
    }

    loadPosts();
  }, []);

  if (!pubKeyHex) {
    return null;
  }

  return (
    <div>
      <h1 className="mb-8">feed</h1>
      {posts.map(post => {
        return <Post key={post.hash} post={post.post as TPost} pubKey={pubKeyHex} />;
      })}
    </div>
  );
}
