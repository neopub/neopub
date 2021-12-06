import { PostVisibility } from "core/types";
import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import KnowMore from "components/knowMore";
import { publishTextPost } from "models/post";
import { IdentityContext } from "models/id";
import { TabBar } from "components/tabs";

export default function Post() {
  const ident = useContext(IdentityContext);

  const navigate = useNavigate();

  const [text, setText] = useState("");

  const [viz, setViz] = useState<PostVisibility>("subs");

  const tabs = ["Followers", "Public"]
  const activeTab = viz === "world" ? "Public" : "Followers";
  function handleTabSelected(tab: string) {
    if (tab === "Public") {
      setViz("world");
    } else if (tab === "Followers") {
      setViz("subs");
    }
  }
  
  if (!ident) {
    return <div>Can't post.</div>
  }

  async function handlePostClicked(visibility: PostVisibility) {
    if (!ident) {
      return;
    }

    await publishTextPost(ident, text, visibility);

    navigate(`/users/${ident.pubKey.hex}`);
  }

  return (
    <div className="flex flex-col max-w-lg">
      <h1 className="mb-4">post</h1>
      <TabBar tabs={tabs} activeTab={activeTab} onTabSelected={handleTabSelected} />
      <textarea
        value={text}
        placeholder="Type here..."
        onChange={(e) => setText(e.target.value)}
        className="h-48 rounded p-2"
      />
      <button className="flex-1 px-4 py-2" onClick={() => handlePostClicked(viz)} disabled={text.length < 1}>Post ({viz === "world" ? "World" : "Followers"})</button>

      <KnowMore more={
        <p>In neopub, all posts are encrypted. For public posts, the encryption key is published. For private posts, the encryption key is separately encrypted for each subscriber, then those are published. See <Link to="/arch/post">/arch/post</Link> to learn more about post security architecture.</p>
      } />
    </div>
  );
}
