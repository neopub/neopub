import { IIndex, ITextPost, PostVisibility } from "core/types";
import { publishPostAndKeys } from "lib/api";
import { usePrivateKey, usePublicKeyHex } from "lib/auth";
import { useToken, useWorldKey } from "lib/storage";
import { useJSON } from "lib/useJSON";
import { useState } from "react";
import { Link, useHistory } from "react-router-dom";
import DB from "lib/db";

export default function Post() {
  const pubKeyHex = usePublicKeyHex();
  const privKey = usePrivateKey("ECDSA");
  const privDH = usePrivateKey("ECDH");
  const token = useToken();
  const worldKeyHex = useWorldKey();
  const [_, setIndex] = useJSON<IIndex>(pubKeyHex, "index.json", { posts: [], updatedAt: "" });
  const history = useHistory();

  const [text, setText] = useState("");
  
  if (!(pubKeyHex && worldKeyHex && privKey && privDH && token && setIndex)) {
    return <div>Can't post.</div>
  }

  async function handlePostClicked(visibility: PostVisibility) {
    if (!(pubKeyHex && worldKeyHex && privKey && privDH && token && setIndex)) {
      return;
    }

    const now = new Date();
    const post: ITextPost = {
      createdAt: now.toISOString(),
      type: "text",
      content: {
        text,
      },
    };
    
    const newIndex = await publishPostAndKeys(
      post,
      worldKeyHex,
      privDH,
      pubKeyHex,
      privKey,
      token,
      visibility,
    );
    setIndex(newIndex);

    DB.indexes.put({ pubKey: pubKeyHex, index: newIndex })

    history.push(`/users/${pubKeyHex}`);
  }

  return (
    <div className="flex flex-col max-w-lg">
      <h1 className="mb-4">post</h1>
      <p>In neopub, all posts are encrypted. For public posts, the encryption key is published. For private posts, the encryption key is separately encrypted for each subscriber, then those are published. See <Link to="/arch/post">/arch/post</Link> to learn more about post security architecture.</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="h-48 rounded p-2 mt-4"
      />
      <div style={{ display: "flex", flexDirection: "row", justifyContent: "flex-end" }}>
        <button onClick={() => handlePostClicked("world")}>Post (Public)</button>
        <button onClick={() => handlePostClicked("subs")}>Post (Subscribers)</button>
      </div>
    </div>
  );
}
