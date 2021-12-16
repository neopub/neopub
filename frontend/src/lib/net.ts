import Net from "core/client/net";

export const hostPrefix = process.env.REACT_APP_HOST_PREFIX ?? "NOHOST";

export default new Net(hostPrefix, fetch.bind(window));
