import { IProfile } from "core/types";

export default function User({ profile }: { profile: IProfile }) {
  return (
    <div className="mb-3 w-16 h-16 border-dashed border-2 p-2" style={{ flexDirection: "row" }}>
      <img width={64} height={64} alt="Avatar" src={profile.avatarURL} />
      <span style={{ fontSize: "3rem" }}>{profile.handle}</span>
    </div>
  );
}
