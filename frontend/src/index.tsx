import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './pages/App';
import reportWebVitals from './reportWebVitals';

import {
  BrowserRouter as Router,
  Switch,
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
import { useInbox } from 'models/inbox';
import { useID } from 'models/id';

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
  const ident = useID();
  const inbox = useInbox(ident);
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

ReactDOM.render(
  <React.StrictMode>
    <div className="p-4">
      <Router>
        <Menu />
        <Switch>
          <Route exact path="/">
            <App />
          </Route>
          <Route exact path="/feed">
            <Feed />
          </Route>
          <Route exact path="/post">
            <Post />
          </Route>
          <Route exact path="/posts/:userId/:postId">
            <PostDetails />
          </Route>
          <Route exact path="/inbox">
            <Inbox />
          </Route>
          <Route exact path="/exit">
            <Exit />
          </Route>
          <Route exact path="/creds/dump*">
            <DumpCreds />
          </Route>
          <Route exact path="/creds/load">
            <LoadCreds />
          </Route>
          <Route exact path="/users/:id">
            <UserProfile />
          </Route>
          <Route exact path="/users/:id/sub">
            <Sub />
          </Route>
          <Route exact path="/host">
            <Host />
          </Route>
          <Route exact path="/arch">
            <Arch />
          </Route>
          <Route exact path="/arch/sub">
            <SubArch />
          </Route>
          <Route exact path="/arch/post">
            <PostArch />
          </Route>
          <Route exact path="/arch/data">
            <DataArch />
          </Route>
        </Switch>
      </Router>
    </div>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
