import Post from "components/post";
import { IEncPost, TPost } from "core/types";
import { fetchAndDecryptWorldOrSubPost } from "lib/api";
import { usePrivateKey, usePublicKeyHex } from "lib/auth";
import DB from "lib/db";
import { getIndex } from "lib/net";
import { useEffect, useState } from "react"

export default function Feed() {
  const privDH = usePrivateKey("ECDH");
  const { hex: pubKeyHex } = usePublicKeyHex();
  
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true);
  
  async function loadPosts() {
    const posts = await DB.posts.orderBy("createdAt").reverse().toArray();
    setPosts(posts);
  }

  useEffect(() => {
    async function fetchAndCachePost(pubKey: string, postHashHex: string, worldKeyHex: string) {
      const res = await fetchAndDecryptWorldOrSubPost(
        postHashHex,
        pubKey,
        privDH,
        worldKeyHex,
      );
      if (!res) {
        return;
      } 
      const { post } = res;
  
      return DB.posts.put({
        post,
        hash: postHashHex,
        publisherPubKey: pubKey,
        createdAt: post?.createdAt,
      });
    }

    if (!privDH) {
      return;
    }

    loadPosts();

    async function fetchPosts() {
      const subs: { pubKey: string, host: string, worldKeyHex: string }[] = await DB.subscriptions.orderBy("pubKey").toArray();

      await Promise.all(subs.map(async (sub) => {
        const { pubKey, host, worldKeyHex } = sub;
        const index = await getIndex(pubKey, host);
        if (index === "notfound" || !index) {
          return;
        }

        return Promise.all(index.posts.map(async (post) => {
          const postHash = (post as IEncPost).id;
          
          const local = await DB.posts.get(postHash);
          if (local) {
            return;
          }

          return fetchAndCachePost(pubKey, postHash, worldKeyHex);
        }));
      }));

      await loadPosts();
      setLoading(false);
    };

    fetchPosts();
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
    </div>
  );
}
