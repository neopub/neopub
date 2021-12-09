import React, { useContext } from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './pages/App';
import reportWebVitals from './reportWebVitals';

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import LoadCreds from 'pages/loadCreds';
import DumpCreds from 'pages/dumpCreds';
import UserProfile from 'pages/userProfile';
import Post from 'pages/post';
import Exit from './pages/exit';
import { isAuthenticated } from 'lib/auth';
import Sub from 'pages/sub';
import SubArch from 'pages/subArch';
import PostArch from 'pages/postArch';
import Arch from 'pages/arch';
import Host from 'pages/host';
import Feed from 'pages/feed';
import PostDetails from 'pages/postDetails';
import DataArch from 'pages/dataArch';
import Inbox from 'pages/inbox';
import { InboxContext, useInbox } from 'models/inbox';
import { IdentityContext, useID } from 'models/id';
import API from 'pages/api';

interface IMenuItemProps {
  curPath: string;
  path: string;
  text: string;
}
function MenuItem({ curPath, path, text }: IMenuItemProps) {
  const highlight = curPath === path;
  return <Link key={text} to={path} className={highlight ? "text-green-200" : undefined}>{text}</Link>;
}

function InboxMenuItem({ curPath, path, text }: IMenuItemProps) {
  const highlight = curPath === path;
  const inbox = useContext(InboxContext);
  const count = inbox?.length;
  const showCount = count != null && count > 0;

  return (
    <Link key={text} to={path} className={`flex flex-row items-start ${highlight ? "text-green-200" : ""}`}>
      {text}
      {showCount && <div className="ml-1 text-xs bg-green-300 text-gray-800 rounded-sm px-1 no-underline">{count}</div>}
    </Link>
  );
}

type MenuItems = Array<{ path: string, text: string, el?: (props: IMenuItemProps) => React.ReactElement }>;
const authedMenu: MenuItems = [
  { path: "/", text: "me" },
  { path: "/inbox", text: "inbox", el: InboxMenuItem },
  { path: "/feed", text: "feed" },
  { path: "/arch", text: "arch" },
  { path: "/exit", text: "exit" },
];

const unauthedMenu: MenuItems = [
  { path: "/", text: "neopub" },
  { path: "/arch", text: "arch" },
];

function Menu() {
  const loc = useLocation();

  const items: MenuItems = isAuthenticated() ? authedMenu : unauthedMenu;

  const kbLink = isAuthenticated() ? "/post" : "/";

  return (
    <div className="flex flex-row mb-2 space-x-4 font-mono">
      <Link to={kbLink}><img src="/keyboard.png" alt="Pixelated keyboard icon" style={{ width: 48 }} /></Link>
      {
        items.map(({ path, text, el }) => {
          const props = { key: text, path, text, curPath: loc.pathname };
          if (el) {
            return el(props);
          }
          return <MenuItem {...props} />;
        })
      }
    </div>
  )
}

function Main() {
  const ident = useID();
  const inbox = useInbox(ident);

  return (
    <React.StrictMode>
      <IdentityContext.Provider value={ident}>
      <InboxContext.Provider value={inbox}>
        <div className="flex justify-center">
          <div className="flex-1 p-4 max-w-full md:max-w-5xl">
            <Router>
              <Menu />
              <Routes>
                <Route path="/" element={<App />} />
                <Route path="/feed" element={<Feed />} />
                <Route path="/post" element={<Post />} />
                <Route path="/posts/:userId/:postId" element={<PostDetails />} />
                <Route path="/inbox" element={<Inbox />} />
                <Route path="/exit" element={<Exit />} />
                <Route path="/creds/dump" element={<DumpCreds />} />
                <Route path="/creds/load" element={<LoadCreds />} />
                <Route path="/users/:id" element={<UserProfile />} />
                <Route path="/users/:id/sub" element={<Sub />} />
                <Route path="/host" element={<Host />} />
                <Route path="/arch" element={<Arch />} />
                <Route path="/arch/sub" element={<SubArch />} />
                <Route path="/arch/post" element={<PostArch />} />
                <Route path="/arch/data" element={<DataArch />} />
                <Route path="/arch/api" element={<API />} />
              </Routes>
            </Router>
          </div>
        </div>
      </InboxContext.Provider>
      </IdentityContext.Provider>
    </React.StrictMode>
  );
}

ReactDOM.render(
  <Main />,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
