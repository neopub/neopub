import { powHeader, pubKeyHeader, tokenHeader } from "core/consts";

interface IEndpoint {
  method: "GET" | "PUT" | "POST" | "DELETE";
  path: string;
  desc: string;
  request: {
    body?: string;
    headers?: IHeader[];
  }
}

interface IHeader {
  name: string;
  desc: string;
}

function Endpoint({ endpoint }: { endpoint: IEndpoint }) {
  const { method, path, desc, request } = endpoint;
  const headers = request.headers ?? [];

  return (
    <div>
      <h2 className="font-mono">{method} {path}</h2>
      <p>{desc}</p>
      {request.body && (
        <div className="mt-2">
          <h3>Body</h3>
          {request.body}
        </div>
      )}
      {headers.length > 0 && (
        <div className="mt-2">
          <h3>Headers</h3>
          <table>
            <tbody>
              {
                headers.map(({ name, desc }) => {
                  return (
                    <tr key={name}>
                      <td className="font-mono">{name}</td>
                      <td className="pl-2">{desc}</td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function API() {
  const spec: IEndpoint[] = [
    {
      method: "POST",
      path: "/auth",
      desc: "Request a proof-of-work challenge.",
      request: {
        body: "JSON describing capabilities that client wants to pay PoW for.",
      },
    },

    {
      method: "POST",
      path: "/chal",
      desc: "Trade PoW for user auth token.",
      request: {
        body: "PoW solution.",
      },
    },

    {
      method: "POST",
      path: "/inbox",
      desc: "Send a message (reply, follow request, ...) to a user's inbox.",
      request: {
        body: "Encrypted message.",
        headers: [
          { name: pubKeyHeader, desc: "Hex-encoded public key of receipient user." },
          { name: powHeader, desc: "PoW solution." },
        ],
      },
    },

    {
      method: "GET",
      path: "/inbox",
      desc: "Fetch inbox contents.",
      request: {
        headers: [
          { name: pubKeyHeader, desc: "Hex-encoded public key of user to fetch inbox of." },
          { name: tokenHeader, desc: "Auth token of user to fetch inbox of." },
        ],
      },
    },
    
    {
      method: "GET",
      path: "<path>",
      desc: "Fetch the file at <path>. NOTE: this endpoint is not authenticated, because data access security is provided through encryption, not access control.",
      request: {},
    },

    {
      method: "PUT",
      path: "<path>",
      desc: "Put a file at <path> for an authenticated user.",
      request: {
        body: "Contents of file to put at <path>.",
        headers: [
          { name: tokenHeader, desc: "Auth token of user to put file for." },
        ],
      },
    },

    {
      method: "DELETE",
      path: "<path>",
      desc: "Delete the file at <path> for an authenticated user.",
      request: {
        headers: [
          { name: tokenHeader, desc: "Auth token of user to delete file for." },
        ],
      },
    },
  ]
  return (
    <div className="max-w-lg space-y-2">
      <h1 className="mb-4">api</h1>

      <div className="space-y-8">
        {
          spec.map(endpoint => {
            const key = `${endpoint.method} ${endpoint.path}`;
            return <Endpoint key={key} endpoint={endpoint} />;
          })
        }
      </div>
    </div>
  );
}