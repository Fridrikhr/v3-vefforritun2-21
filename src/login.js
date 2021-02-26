import express from 'express';
import passport from 'passport';
import session from 'express-session';
import { Strategy } from 'passport-local';

import { comparePasswords, findByUsername, findById } from './users.js';

// Hægt að útfæra passport virkni hér til að létta á router.js
export const router = express.Router();

const sessionSecret = 'leyndarmál';

router.use(express.urlencoded({ extended: true }));

router.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  maxAge: 20 * 1000,
}));

/**
 * Athugar hvort username og password sé til í notandakerfi.
 * Callback tekur við villu sem fyrsta argument, annað argument er
 * - `false` ef notandi ekki til eða lykilorð vitlaust
 * - Notandahlutur ef rétt
 *
 * @param {string} username Notandanafn til að athuga
 * @param {string} password Lykilorð til að athuga
 * @param {function} done Fall sem kallað er í með niðurstöðu
 */
async function strat(username, password, done) {
  try {
    const user = await findByUsername(username);

    if (!user) {
      return done(null, false);
    }

    // Verður annað hvort notanda hlutur ef lykilorð rétt, eða false
    const result = await comparePasswords(password, user);
    return done(null, result);
  } catch (err) {
    console.error(err);
    return done(err);
  }
}

passport.use(new Strategy(strat));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

router.use(passport.initialize());
router.use(passport.session());

// Til að geta notað user í viewum
/*
router.use((req, res, next) => {
  if (req, isAuthenticated()) {
    res.locals.user=req.user;
  }

  next();
});
*/

// isAuthendicaded() er undefined af einhverjum dularfullum ástæðum
function ensureLoggedIn(req, res, next) {
  /* if (req.isAuthenticated()) {
    return next();
  } */

  return res.redirect('/login');
}

router.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    // req.user kemur beint úr users.js
    return res.send(`
      <p>Innskráður notandi er ${req.user.username}</p>
      <p>Þú ert ${req.user.admin ? 'admin.' : 'ekki admin.'}</p>
      <p><a href="/logout">Útskráning</a></p>
      <p><a href="/admin">Skoða leyndarmál</a></p>
    `);
  }

  return res.send(`
    <p><a href="/login">Innskráning</a></p>
  `);
});

router.get('/login', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }

  let message = '';

  // Athugum hvort einhver skilaboð séu til í session, ef svo er birtum þau
  // og hreinsum skilaboð
  if (req.session.messages && req.session.messages.length > 0) {
    message = req.session.messages.join(', ');
    req.session.messages = [];
  }

  return res.send(`
    <form method="post" action="/login" autocomplete="off">
      <label>Notendanafn: <input type="text" name="username"></label>
      <label>Lykilorð: <input type="password" name="password"></label>
      <button>Innskrá</button>
    </form>
    <p>${message}</p>
  `);
});

router.post(
  '/login',

  passport.authenticate('local', {
    failureMessage: 'Notandanafn eða lykilorð vitlaust.',
    failureRedirect: '/login',
  }),

  // Ef við komumst hingað var notandi skráður inn, senda á /admin
  (req, res) => {
    res.redirect('/admin');
  },
);

router.get('/logout', (req, res) => {
  // logout hendir session cookie og session
  req.logout();
  res.redirect('/');
});

// ensureLoggedIn middleware passar upp á að aðeins innskráðir notendur geti
// skoðað efnið, aðrir lenda í redirect á /login, stillt í línu 103
router.get('/admin', ensureLoggedIn, (req, res) => {
  res.send(`
    <p>Hér eru leyndarmál</p>
    <p><a href="/">Forsíða</a></p>
  `);
});

export default passport;
