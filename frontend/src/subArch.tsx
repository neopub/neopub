import { Link } from "react-router-dom"

export default function SubArch() {
  return (
    <div className="max-w-lg">
      <h1>arch/subscription</h1>
      <div className="mt-4">
        <p>Neopub is designed for a hostile hosting environment.</p>
        <p>Encrypting posts prevents the host from reading them.</p>
        (<Link to="/arch/post">Read about posting architecture.</Link>)
        <p>Neopub also prevents the host for discovering who follows whom.</p>
        <a href="/req-diag.png"><img src="/req-diag.png" className="max-w-full border-2 border-green-400 rounded-lg my-4" /></a>
        <a href="/symbols-diag.png"><img src="/symbols-diag.png" className="max-w-sm border-2 border-green-400 rounded-lg my-4" /></a>
        <ol className="list-decimal ml-8 my-2">
          <li>A user, the publisher, publishes their public key, <pre className="inline">P<sub>pub</sub></pre>.</li>
          <li>To subscribe to that user, the subscriber first generates an ephemeral key pair, <pre className="inline">(E<sub>pub</sub>, E<sub>pub</sub>)</pre>.</li>
          <li>Then, the subscriber uses Diffie-Helman to compute a shared secret, which only the subscriber and publisher are able to compute, by using the ephemeral keypair, and the publisher's public key: <pre className="inline">E<sub>DH</sub> = DH(P<sub>pub</sub>, E<sub>priv</sub>)</pre>.</li>
          <li>The subscriber forms the payload of the subscription request by using that shared secret, <pre className="inline">E<sub>DH</sub></pre>, to encrypt their own public key, <pre className="inline">S<sub>pub</sub></pre>, and optionally a message to include with the subscription request: <pre className="inline">R<sub>enc</sub> = ENC(E<sub>DH</sub>, S<sub>pub</sub> ++ M)</pre>.</li>
          <li>The subscriber forms the subscription request by prepending the ephemeral public key to that encrypted payload, <pre className="inline">R = E<sub>pub</sub> ++ R<sub>enc</sub></pre>.</li>
          <li>The subscriber then sends that request to the publisher, using an endpoint the publisher establishes to receive such requests, or through a side channel, such as a messaging app or carrier pigeon.</li>
          <li>The publisher's client retrieves that encrypted request from the host, and then decrypts it, by first computing the shared secret, <pre className="inline">E<sub>DH</sub> = DH(E<sub>pub</sub>, P<sub>priv</sub>)</pre>, then using that secret to decrypt the request payload: <pre className="inline">S<sub>pub</sub> ++ M = DEC(E<sub>DH</sub>, R<sub>enc</sub>)</pre>.</li>
        </ol>
        <p>With this architecture, the host is never able to observe the public keys of any of the publisher's subscribers. Only the publisher's client can see those keys, which are the identities of their subscribers. Thus the social graph is end-to-end encrypted.</p>
        <p>Neopub accomplishes access control to posts at "compile time", by the publisher's client publishing encrypted post keys for each of their subscribers, rather than at run time, by a server enforcing privacy policies. In addition to making the social graph opaque to the host, this architecture prevents server bugs and hacks that grant post access to unintended viewers.</p>
      </div>
    </div>
  );
}