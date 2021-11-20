import Empty from "components/empty";
import Post from "components/post";
import { TPost } from "core/types";
import { useID } from "models/id";
import { DBPost, fetchPosts, loadPosts } from "models/post";
import { useEffect, useState } from "react"

export default function Feed() {
  const id = useID();
  
  const [posts, setPosts] = useState<DBPost[]>([])
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts().then(setPosts);

    if (id) {
      fetchPosts(id.privKey.dhKey)
        .then(async () => {
          const posts = await loadPosts();
          setPosts(posts);
          setLoading(false);
        });
    }
  }, [id]);

  if (!id) {
    return null;
  }

  return (
    <div>
      <h1 className="mb-8">feed</h1>
      {loading && (<div>Loading...</div>)}
      <div className="space-y-4">
        {posts.map(post => {
          return <Post key={post.hash} id={post.hash} post={post.post as TPost} pubKey={id.pubKey.hex} />;
        })}
      </div>
      {posts.length < 1 && <Empty text="No feed items." subtext="Follow some people to get content here." />}
    </div>
  );
}
