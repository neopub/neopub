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
        <li>Open a terminal in the <pre className="inline">neopub/workers</pre> directory.</li>
        <li>Set up Cloudflare <a href="https://developers.cloudflare.com/workers/cli-wrangler/install-update">Wrangler</a>.</li>
        <li>Run <pre className="inline">wrangler kv:namespace create neopub</pre>.</li>
        <li>Run <pre className="inline">yarn && wrangler publish</pre>.</li>
        <li>Run <pre className="inline">yarn init:secrets</pre>.</li>
        <li>Create a Cloudflare Pages project, and link it to the forked repo you just made. Configure the "root directory" to be <pre className="inline">/frontend</pre>.</li>
        <li>In that Cloudflare Pages project web UI, go to Settings and add an environment variable named "REACT_APP_HOST_PREFIX" to the URL of your Cloudflare worker, without the trailing slash.</li>
        <li>Retry the Cloudflare Pages deployment, if necessary.</li>
      </ol>
    </div>
  );
}