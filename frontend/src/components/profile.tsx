 import type { IProfile } from "core/types";
import { useIndex, useIsSubscribedTo, useProfile } from "models/profile";
import Hexatar from "./hexatar";
import { useNavigate } from "react-router-dom";
import { hostPrefix } from "lib/net";
import HexQR from "./hexQR";
import PostList from "./postList";
import SubscriberList from "./subscriberList";
import SubscribeView from "./subscribeView";
import SubscriptionList from "./subscriptionList";
import Tabs, { ITab } from "./tabs";
import Empty from "./empty";
import { IdentityContext } from "models/id";
import KnowMore from "./knowMore";
import RepliesList from "./repliesList";
import { useContext } from "react";

function BracketButton({ label, onClick }: { label: string, onClick: () => void }) {
  return <span className="whitespace-nowrap">[<button className="border-0 m-0 p-0" onClick={onClick}>{label}</button>]</span>;
}

function ButtonLink({ label, to }: { label: string, to: string }) {
  const navigate = useNavigate();
  return <button onClick={() => navigate(to)} className="border-0">{`${label} »`}</button>
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

function IDCard({ profile, setProfile, id, isAuthedUser }: { profile?: IProfile, setProfile: (newProfile: IProfile) => void, id: string, isAuthedUser: boolean }) {
  if (!profile) {
    return null;
  }

  const { handle, bio } = profile;

  return (
    <div className="flex flex-row mb-2 space-x-4">
      <Hexatar hex={id} />
      <div className="flex flex-col">
        <Handle handle={handle} setHandle={(newHandle) => setProfile({ ...profile, handle: newHandle })} editable={isAuthedUser} />
        <Bio bio={bio} setBio={(newBio) => setProfile({ ...profile, bio: newBio })} editable={isAuthedUser} />
      </div>
    </div>
  );
}

interface IProps {
  id: string;
}
export default function Profile({ id }: IProps) {
  const navigate = useNavigate();
  const ident = useContext(IdentityContext);
  const isAuthedUser = ident && id === ident.pubKey.hex;

  let host = new URLSearchParams(window.location.search).get("host") ?? undefined;

  const [profile, setProfile] = useProfile(id, host);
  const isSubscribed = useIsSubscribedTo(id);

  if (!host) {
    host = (profile !== "notfound" ? profile?.host : null) ?? hostPrefix;
  }

  const index = useIndex(id, host);

  if (profile === "notfound") {
    return <div>Not found.</div>
  }

  const emptyPostList = <Empty text="No posts" subtext={isAuthedUser ? "Write a post and it will show up here." : `When ${profile.handle ?? id.slice(0, 8)} posts, it will show up here.`} />;

  const tabs: ITab[] = [
    {
      name: "Posts",
      el: (
        <>
          {isAuthedUser && <button onClick={() => navigate("/post")} className="py-2 px-6 w-full md:max-w-sm">New Post</button>}
          {
            index === "notfound" || !index
              ? emptyPostList
              : <PostList pubKeyHex={ident?.pubKey.hex} id={id} worldKeyHex={profile?.worldKey} posts={index.posts ?? []} host={host} empty={emptyPostList} />
          }
        </>
      ),
    },
  ];

  if (isAuthedUser && ident) {
    tabs.push({
      name: "Replies",
      el: <RepliesList />,
    });

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
        isAuthedUser={!!isAuthedUser}
      />

      <div className="flex flex-row space-x-1 mb-4 items-start">
        <KnowMore
          label="Show QR"
          more={
            <a href={`/users/${id}?host=${escape(host)}`}>
              <HexQR hex={`https://${document.location.host}/users/${id}?host=${escape(host)}`} />
            </a>
          }
        />
        {isAuthedUser && <ButtonLink to="/creds/dump" label="Creds" />}
        {!isAuthedUser && (isSubscribed ? "Following" : <button className="px-4 py-2" onClick={() => navigate(`/users/${id}/sub`)}>Follow</button>)}
      </div>

      <Tabs tabs={tabs} initialActiveTab="Posts" />
    </main>
  );
}
