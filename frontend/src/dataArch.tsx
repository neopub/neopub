import { Link } from "react-router-dom"

export default function DataArch() {
  return (
    <div className="max-w-lg">
      <h1>data model</h1>
      <div className="mt-4">
        <p>Neopub has a thick-client architecture. The host does almost no work beyond serving and storing files.</p>
        <p>Neopub's data is designed to fit neatly into a filesystem or KV store, so the host doesn't require a relational DB and can run entirely as on-demand "serverless" workers (see <Link to="/host">hosting</Link>).</p>
        <p>Aside from user profiles, and their lists of posts ("post indexes"), all data stored on the host is encrypted end-to-end, before it reaches the host.</p>
        <p>To give the experience of a user account that persists across devices, Neopub uses the browser's password manager to transmit private data without storing it on the host.</p>
        <a href="/data-diag.png"><img src="/data-diag.png" alt="Diagram of data model" className="max-w-full border-2 border-green-400 rounded-lg my-4" /></a>
        <p>For details on Posts and Post Keys encryption, see <Link to="/arch/post">/arch/post</Link>.</p>
        <p>For details on Reqs encryption (subscription requests), see <Link to="/arch/sub">/arch/subs</Link>.</p>
      </div>
    </div>
  );
}