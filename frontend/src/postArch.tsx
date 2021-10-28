import { Link } from "react-router-dom";

export default function PostArch() {
  return (
    <div className="max-w-lg">
      <h1>posting</h1>
      <div>
        <p>In neopub, all posts are encrypted with a "post key".</p>
        <p>When someone posts publicly, they publish the post key publicly.</p>
        <p>When someone posts privately, they encrypt the post key for each of their subscribers, and then publish those wrapped post keys.</p>
        <a href="/post-diag.png"><img src="/req-diag.png" alt="Diagram of posting flow" className="max-w-full border-2 border-green-400 rounded-lg my-4" /></a>
        <a href="/symbols-diag.png"><img src="/symbols-diag.png" alt="Legend" className="max-w-full border-2 border-green-400 rounded-lg my-4" /></a>
        <p>To read someone's private posts, you must send them a subscription request, and they must accept it. Then you're a subscriber.</p>
        <Link to="/arch/sub">Read about subscription architecture »</Link>
      </div>
    </div>
  );
}