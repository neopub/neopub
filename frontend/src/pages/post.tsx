import { IIndex, PostVisibility } from "core/types";
import { usePrivateKey, usePublicKeyHex } from "lib/auth";
import { useToken, useWorldKey } from "lib/storage";
import { useJSON } from "lib/useJSON";
import { useState } from "react";
import { Link, useHistory } from "react-router-dom";
import KnowMore from "components/knowMore";
import { publishTextPost } from "models/post";

export default function Post() {
  const { hex: pubKeyHex } = usePublicKeyHex();
  const privKey = usePrivateKey("ECDSA");
  const privDH = usePrivateKey("ECDH");
  const { token } = useToken();
  const { worldKeyHex } = useWorldKey();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setIndex] = useJSON<IIndex>(pubKeyHex, "index.json", { posts: [], updatedAt: "" });
  const history = useHistory();

  const [text, setText] = useState("");

  const [viz, setViz] = useState<PostVisibility>("subs");
  function handleWorldCheckboxClicked(evt: any) {
    setViz(viz === "world" ? "subs" : "world");
  }
  
  if (!(pubKeyHex && worldKeyHex && privKey && privDH && token && setIndex)) {
    return <div>Can't post.</div>
  }

  async function handlePostClicked(visibility: PostVisibility) {
    if (!(pubKeyHex && worldKeyHex && privKey && privDH && token && setIndex)) {
      return;
    }

    const newIndex = await publishTextPost(text, worldKeyHex, privDH, pubKeyHex, token, privKey, visibility);

    setIndex(newIndex);

    history.push(`/users/${pubKeyHex}`);
  }

  return (
    <div className="flex flex-col max-w-lg">
      <h1 className="mb-4">post</h1>
      <div className="text-right mt-2 mb-1">
        <label htmlFor="worldcheck">
          <input type="checkbox" id="worldcheck" checked={viz === "world"} onClick={handleWorldCheckboxClicked} className="mr-1" />
          Make public
        </label>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="h-48 rounded p-2"
      />
      <button className="flex-1" onClick={() => handlePostClicked(viz)}>Post ({viz === "world" ? "World" : "Subscribers"})</button>

      <KnowMore more={
        <p>In neopub, all posts are encrypted. For public posts, the encryption key is published. For private posts, the encryption key is separately encrypted for each subscriber, then those are published. See <Link to="/arch/post">/arch/post</Link> to learn more about post security architecture.</p>
      } />
    </div>
  );
}
