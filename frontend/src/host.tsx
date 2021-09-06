import { Link } from "react-router-dom"

export default function Host() {
  return (
    <div className="max-w-lg space-y-2">
      <h1>hosting</h1>

      <p>Neopub is built for easy self-hosting (for tech-savvy people, at least). Because it's designed for an adversarial hosting environment, with end-to-end encryption (see <Link to="/arch">arch</Link>), cloud hosting is fine.</p>

      <p>Initially, neopub is just built to run on Cloudflare Pages + Workers + KV, but the API is so simple it should be easy to port to other platforms.</p>

      <p>To host your own neopub node:</p>
      <ol className="list-decimal ml-8">
        <li>Make a Cloudflare account, at <a href="https://www.cloudflare.com">https://www.cloudflare.com</a>.</li>
        <li>Make a Github account, at <a href="https://www.github.com">https://www.github.com</a>.</li>
        <li>Fork <a href="https://www.github.com/neopub/neopub">neopub/neopub</a> to your Github account.</li>
        <li>Clone that fork to your local machine.</li>
        <li>Set up Cloudflare <a href="https://developers.cloudflare.com/workers/cli-wrangler/install-update">Wrangler</a>.</li>
        <li>In the Cloudflare web UI, add a Workers KV namespace. Then, copy the KV namespace ID and edit <pre className="inline">/workers/wrangler.toml</pre> to set the KV namespace binding to that ID.</li>
        <li>In the <pre className="inline">/workers</pre> directory, run <pre className="inline">yarn && wrangler publish</pre>.</li>
        <li>Also in the <pre className="inline">/workers</pre> directory, run <pre className="inline">wrangler secret put SESS_TOKEN_SEED</pre> and enter some random chars, then run <pre className="inline">wrangler secret put POW_SEED</pre> and enter some other random chars.</li>
        <li>Create a Cloudflare Pages project, and link it to the forked repo you just made. Configure the "root directory" to be <pre className="inline">/frontend</pre>.</li>
        <li>In that Cloudflare Pages project web UI, go to Settings and add an environment variable named "REACT_APP_HOST_PREFIX" to the URL of your Cloudflare worker, without the trailing slash.</li>
        <li>Retry the Cloudflare Pages deployment, if necessary.</li>
      </ol>
    </div>
  );
}