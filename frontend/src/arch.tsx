import { Link } from "react-router-dom"

export default function Arch() {
  return (
    <div className="max-w-lg space-y-2">
      <h1>arch</h1>

      <p>Neopub is a social network protocol, and an example implementation (you're looking at it).</p>

      <p>Neopub uses a pseudonymus identity model. Users are identified by the public key in a cryptographic public/private keypair. There are no email addresses, no phone numbers, and no passwords involved.</p>

      <p>Neopub encrypts both the contents of posts, and the social network structure, which consists of the links between publishers and subscribers.</p>

      <div>
        <Link to="/arch/post">Read about post security architecture.</Link>
      </div>
      <div>
        <Link to="/arch/sub">Read about subscription security architecture.</Link>
      </div>
    </div>
  );
}