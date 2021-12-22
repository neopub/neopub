import Net from "core/client/net";
import NPCrypto from "lib/crypto";

export const hostPrefix = process.env.REACT_APP_HOST_PREFIX ?? "NOHOST";

export default new Net(hostPrefix, fetch.bind(window), NPCrypto, crypto);
