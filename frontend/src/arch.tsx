import { Link } from "react-router-dom"

export default function Arch() {
  return (
    <div className="max-w-lg space-y-2">
      <h1>arch</h1>

      <p>Neopub is a social network.</p>

      <p>Neopub uses pseudonymous identity. Users identify by the public key of a cryptographic public/private keypair. There are no email addresses, no phone numbers, and no passwords.</p>

      <p>Neopub end-to-end encrypts both the content of posts, and the network structure (links between publishers and subscribers). This minimizes trust in the host.</p>

      <Link to="/arch/data"><img src="/data-diag.png" alt="Diagram of data model" className="max-w-full border-2 border-green-400 rounded-lg my-4" /></Link>

      <div>
        <Link to="/arch/data">Read about data architecture »</Link>
      </div>
      <div>
        <Link to="/arch/post">Read about post security »</Link>
      </div>
      <div>
        <Link to="/arch/sub">Read about subscription security »</Link>
      </div>
      <div>
        <Link to="/host">Read about hosting »</Link>
      </div>
    </div>
  );
}