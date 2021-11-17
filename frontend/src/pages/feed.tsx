import Empty from "components/empty";
import Post from "components/post";
import { TPost } from "core/types";
import { usePrivateKey, usePublicKeyHex } from "lib/auth";
import { DBPost, fetchPosts, loadPosts } from "models/post";
import { useEffect, useState } from "react"

export default function Feed() {
  const privDH = usePrivateKey("ECDH");
  const { hex: pubKeyHex } = usePublicKeyHex();
  
  const [posts, setPosts] = useState<DBPost[]>([])
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts().then(setPosts);

    if (privDH) {
      fetchPosts(privDH)
        .then(async () => {
          const posts = await loadPosts();
          setPosts(posts);
          setLoading(false);
        });
    }
  }, [privDH]);

  if (!pubKeyHex) {
    return null;
  }

  return (
    <div>
      <h1 className="mb-8">feed</h1>
      {loading && (<div>Loading...</div>)}
      {posts.map(post => {
        return <Post key={post.hash} id={post.hash} post={post.post as TPost} pubKey={pubKeyHex} />;
      })}
      {posts.length < 1 && <Empty text="No feed items. Follow some people to get content here." />}
    </div>
  );
}
