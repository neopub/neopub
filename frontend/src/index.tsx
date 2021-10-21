import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import LoadCreds from 'loadCreds';
import DumpCreds from 'dumpCreds';
import UserProfile from 'userProfile';
import Post from 'post';
import Subs from 'subs';
import Exit from './exit';
import { isAuthenticated } from 'lib/auth';
import Sub from 'sub';
import SubArch from 'subArch';
import PostArch from 'postArch';
import Arch from 'arch';
import Host from 'host';
import Feed from 'feed';

type MenuItems = Array<{ path: string, text: string }>;
const authedMenu: MenuItems = [
  { path: "/", text: "me" },
  { path: "/feed", text: "feed" },
  { path: "/subs", text: "subs" },
  { path: "/arch", text: "arch" },
  { path: "/exit", text: "exit" },
];

const unauthedMenu: MenuItems = [
  { path: "/", text: "neopub" },
  { path: "/arch", text: "arch" },
]

function Menu() {
  const loc = useLocation();

  const items: MenuItems = isAuthenticated() ? authedMenu : unauthedMenu;

  return (
    <div className="flex flex-row mb-2 space-x-4 font-mono">
      <Link to="/"><img src="keyboard.png" style={{ width: 48 }} /></Link>
      {
        items.map(({ path, text }) => {
          const highlight = loc.pathname === path;
          return <Link key={text} to={path} className={highlight ? "text-green-200" : undefined}>{text}</Link>;
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
          <Route exact path="/subs">
            <Subs />
          </Route>
          <Route exact path="/exit">
            <Exit />
          </Route>
          <Route exact path="/creds/dump">
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
