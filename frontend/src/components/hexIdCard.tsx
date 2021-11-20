import { hostPrefix } from "lib/net";
import { Link } from "react-router-dom";
import Hexatar from "./hexatar";

export default function HexIDCard({ pubKey, host, handle }: { pubKey: string, host: string, handle?: string }) {
  let link = `/users/${pubKey}`;
  if (host !== hostPrefix) {
    link += `?host=${escape(host)}`;
  }

  return (
    <Link className="flex flex-row items-center space-x-2 no-underline" to={link}>
      <Hexatar hex={pubKey} />
      {handle && <div>{handle}</div>}
    </Link>
  )
}