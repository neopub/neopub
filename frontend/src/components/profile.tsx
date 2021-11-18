 import type { IProfile, IIndex } from "core/types";
import { useProfile } from "lib/useJSON";
import Hexatar from "./hexatar";
import { useHistory } from "react-router-dom";
import { useEffect, useState } from "react";
import DB from "lib/db";
import { fileLoc, getFileJSON, hostPrefix } from "lib/net";
import HexQR from "./hexQR";
import PostList from "./postList";
import SubscriberList from "./subscriberList";
import SubscribeView from "./subscribeView";
import SubscriptionList from "./subscriptionList";
import Tabs, { ITab } from "./tabs";
import Empty from "./empty";
import { useID } from "models/id";

function BracketButton({ label, onClick }: { label: string, onClick: () => void }) {
  return <span className="whitespace-nowrap">[<button className="border-0 m-0 p-0" onClick={onClick}>{label}</button>]</span>;
}

function ButtonLink({ label, to }: { label: string, to: string }) {
  const history = useHistory();
  return <button onClick={() => history.push(to)} className="border-0">{`${label} »`}</button>
}

function Handle({ handle, setHandle, editable }: { handle?: string, setHandle: (newHandle: string) => void, editable: boolean}) {
  function handleEdit() {
    const newHandle = prompt("New handle");
    if (!newHandle) {
      return;
    }

    setHandle(newHandle);
  }

  const emptyText = editable ? "handle" : "No handle";
  const text = !handle ? emptyText : handle;

  return (
    <div className="flex flex-row space-x-2 mb-2 flex-grow-0">
      <h2 className={!handle ? "italic" : undefined}>{text}</h2>
      {editable && <BracketButton label="edit" onClick={handleEdit} />}
    </div>
  );
}

function Bio({ bio, setBio, editable }: { bio?: string, setBio: (newBio: string) => void, editable: boolean }) {
  function handleEdit() {
    const newBio = prompt("New bio");
    if (!newBio) {
      return;
    }

    setBio(newBio);
  }

  const emptyText = editable ? "Write a bio, if you like." : "No bio";
  const text = !bio ? emptyText : bio;

  return (
    <div className="flex-1 mb-2 space-x-2">
      <span className={!bio ? "italic" : ""}>{text}</span>
      {editable && <BracketButton label="edit" onClick={handleEdit} />}
    </div>
  )
}

function IDCard({ profile, setProfile, id, host, isAuthedUser }: { profile?: IProfile, setProfile: (newProfile: IProfile) => void, id: string, host: string, isAuthedUser: boolean }) {
  if (!profile) {
    return null;
  }

  const { handle, bio } = profile;

  return (
    <div className="flex flex-row mb-2 space-x-4">
      <a href={`/users/${id}?host=${host}`}><HexQR hex={`https://${document.location.host}/users/${id}?host=${host}`} /></a>
      <div className="flex flex-col">
        <Handle handle={handle} setHandle={(newHandle) => setProfile({ ...profile, handle: newHandle })} editable={isAuthedUser} />
        <Bio bio={bio} setBio={(newBio) => setProfile({ ...profile, bio: newBio })} editable={isAuthedUser} />
        <Hexatar hex={id} />
      </div>
    </div>
  );
}
interface IProps {
  id: string;
}
export default function Profile({ id }: IProps) {
  const history = useHistory();
  
  const ident = useID();
  const isAuthedUser = ident && id === ident.pubKey.hex;

  const [profile, setProfile] = useProfile(id);

  const [index, setIndex] = useState<IIndex | "notfound">({ posts: [], updatedAt: "" });
  useEffect(() => {
    // TODO: manage potential local/remote index conflicts.
    async function load() {
      let updatedAt = "";

      // Must put an updatedAt timestamp on index, to know which should win.
      const row = await DB.indexes.get(id);
      if (row) {
        setIndex(row.index);
        updatedAt = row.updatedAt;
      }

      const location = fileLoc(id, "index.json");
      const remoteIndex = await getFileJSON<IIndex>(location);
      if (remoteIndex && remoteIndex !== "notfound" && remoteIndex.updatedAt > updatedAt) {
        setIndex(remoteIndex);
      }
    }

    if (!id) {
      return;
    }

    load();
  }, [id]);

  // const [index] = useJSON<IIndex>(id, "index.json", { posts: [] });

  const [isSubscribed, setIsSubscribed] = useState(false);
  useEffect(() => {
    if (!id) {
      return;
    }

    DB.subscriptions.get(id).then((sub: any) => {
      setIsSubscribed(sub != null);
    });
  }, [id])

  if (profile === "notfound") {
    return <div>Not found.</div>
  }

  const worldKeyHex = profile?.worldKey;

  const host = escape(hostPrefix);

  const tabs: ITab[] = [
    {
      name: "Posts",
      el: (
        <>
          {isAuthedUser && <button onClick={() => history.push("/post")} className="py-2 px-6 w-full md:max-w-sm">New Post</button>}
            {index === "notfound" || !index ? <Empty text="No posts" /> : <PostList pubKeyHex={ident?.pubKey.hex} id={id} worldKeyHex={worldKeyHex} index={index} host={unescape(host)} />}
        </>
      ),
    },
  ];

  if (isAuthedUser && ident) {
    tabs.push({
      name: "Followers",
      el: <SubscriberList />,
    });

    tabs.push({
      name: "Following",
      el: (
        <>
          <SubscriptionList />
          <SubscribeView pubKeyHex={ident.pubKey.hex} />
        </>
      ),
    });
  }

  return (
    <main>
      <h1 className="mb-8">profile</h1>

      <IDCard
        profile={profile}
        setProfile={setProfile}
        id={id}
        host={host}
        isAuthedUser={!!isAuthedUser}
      />

      <div className="flex flex-row space-x-1 mb-4">
        {isAuthedUser && <ButtonLink to="/creds/dump" label="Creds" />}
        {!isAuthedUser && (isSubscribed ? "Following" : <button className="px-4 py-2" onClick={() => history.push(`/users/${id}/sub`)}>Follow</button>)}
      </div>

      <Tabs tabs={tabs} initialActiveTab="Posts" />
    </main>
  );
}
