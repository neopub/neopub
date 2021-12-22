import http from "http";

const host = "localhost";
const port = "8888"

export async function fetch(path: string, init?: { method: "GET" | "POST" | "PUT" | "DELETE", headers?: Record<string, string>, body?: any }): Promise<any> {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: host,
      port,
      path,
      method: init?.method,
      headers: init?.headers,
    };

    const req = http.request(opts, res => {
      let resData: any;
      res.on("data", d => {
        resData = d;
      });
      res.on("close", () => {
        resolve({
          ok: res.statusCode === 200,
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          data: resData,
          async arrayBuffer() {
            return resData;
          },
          async text() {
            return new TextDecoder().decode(resData);
          },
        });
      })
    });

    if (init?.body) {
      req.write(init?.body);
    }

    req.end();
  });
}