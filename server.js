
const express = require('express');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'corporate-portal-secret-key-99',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } 
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

function redirectLogin(req, res, next) {
  if (!req.session.userId) {
    res.redirect('/login');
  } else {
    next();
  }
}

function redirectFeed(req, res, next) {
  if (req.session.userId) {
    res.redirect('/');
  } else {
    next();
  }
}

app.use((req, res, next) => {
  if (req.session.userId) {
    res.locals.currentUser = db.getUser(req.session.userId);
  } else {
    res.locals.currentUser = null;
  }
  next();
});

app.get('/', redirectLogin, (req, res) => {
  const posts = db.getPosts();
  res.render('index', {
    title: 'Feed | Scalar Facebook',
    posts
  });
});

app.post('/posts', redirectLogin, (req, res) => {
  const { content } = req.body;
  
  if (content && content.trim()) {
    db.createPost(req.session.userId, content.trim());
  }
  res.redirect('/');
});

app.get('/login', redirectFeed, (req, res) => {
  res.render('login', {
    title: 'Login',
    error: null
  });
});

app.post('/login', redirectFeed, (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.render('login', {
      title: 'Login',
      error: 'Please fill in all fields.'
    });
  }
  
  const user = db.findByUsername(username);
  
  if (!user || !user.password || !bcrypt.compareSync(password, user.password)) {
    return res.render('login', {
      title: 'Login',
      error: 'Invalid username or password.'
    });
  }
  
  req.session.userId = user.id;
  res.redirect('/');
});

app.get('/register', redirectFeed, (req, res) => {
  res.render('register', {
    title: 'Register',
    error: null
  });
});

app.post('/register', redirectFeed, (req, res) => {
  const { name, username, password } = req.body;
  
  if (!name || !username || !password) {
    return res.render('register', {
      title: 'Register',
      error: 'Please fill in all fields.'
    });
  }
  
  if (db.findByUsername(username)) {
    return res.render('register', {
      title: 'Register',
      error: 'Username is already taken.'
    });
  }
  
  const user = db.registerUser(name, username, password);
  req.session.userId = user.id;
  res.redirect('/');
});

// GET /logout (protected)
app.get('/logout', redirectLogin, (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/login');
  });
});

// GET /about (protected)
app.get('/about', redirectLogin, (req, res) => {
  res.render('about', {
    title: 'About | Scalar Facebook'
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).render('error', {
    title: '404 - Not Found',
    errorCode: 404,
    errorMessage: 'Page could not be found.'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`Scalar Facebook Server Running!`);
  console.log(`   Portal URL: http://localhost:${PORT}`);
  console.log(`==================================================\n`);
});
