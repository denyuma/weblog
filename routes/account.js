const router = require('express').Router();
const { CONNECTION_URL, OPTIONS, DATABASE } = require('../config/mongodb.config');
const { authenticate, authorize } = require('../lib/security/accountcontrol.js');
const MongoClient = require('mongodb').MongoClient;

const tokens = new (require('csrf'))();

router.get('/', authorize('readWrite'), (req, res, next) => {
  res.render('./account/index.ejs');
});

router.get('/login', (req, res, next) => {
  res.render('./account/login.ejs', { message: req.flash('message') });
});

router.post('/login', authenticate());

router.get('/posts/regist', authorize('readWrite'), (req, res, next) => {
  tokens.secret((error, secret) => {
    const token = tokens.create(secret);
    req.session._csrf = secret;
    res.cookie('_csrf', token);
    res.render('./account/posts/regist-form.ejs');
  });
});

router.post('/posts/regist/input', authorize('readWrite'), (req, res, next) => {
  const original = createRegistData(req.body);
  res.render('./account/posts/regist-form.ejs', { original });
});

router.post('/posts/regist/confirm', authorize('readWrite'), (req, res, next) => {
  const original = createRegistData(req.body);
  const errors = validateRegistData(req.body);
  if (errors) {
    res.render('./account/posts/regist-form.ejs', { errors, original });
    return;
  }
  res.render('./account/posts/regist-confirm.ejs', { original });
});

router.get('/posts/regist/complete', authorize('readWrite'), (req, res, next) => {
  res.render('./account/posts/regist-complete.ejs');
});

router.post('/posts/regist/execute', authorize('readWrite'), (req, res, next) => {
  const secret = req.session._csrf;
  const token = req.cookies._csrf;

  if (tokens.verify(secret, token) === false) {
    throw new Error('Invalid Token');
  }

  const original = createRegistData(req.body);
  const errors = validateRegistData(req.body);

  if (errors) {
    res.render('./account/posts/regist-form.ejs', { errors, original });
    return;
  }

  MongoClient.connect(CONNECTION_URL, OPTIONS, (error, client) => {
    const db = client.db(DATABASE);
    db.collection('posts')
      .insertOne(original)
      .then(() => {
        delete req.session._csrf;
        res.clearCookie('_csrf');
        res.redirect('/account/posts/regist/complete');
      }).catch((error) => {
        throw error;
      }).then(() => {
        client.close();
      });
  });
});

const createRegistData = function (body) {
  const datetime = new Date();
  return {
    url: body.url,
    published: datetime,
    update: datetime,
    title: body.title,
    content: body.content,
    keywords: (body.keywords || '').split(','),
    authors: (body.authors || '').split(',')
  };
};

const validateRegistData = function (body) {
  let isValidated = true;
  let errors = {};

  if (!body.url) {
    isValidated = false;
    errors.url = 'URLが未入力です。"/"から始まるURLを入力してください ';
  }

  if (body.url && /^\//.test(body.url) === false) {
    isValidated = false;
    errors.url = '"/"から始まるURLを入力してください ';
  }

  if (!body.title) {
    isValidated = false;
    errors.title = 'タイトルが未入力です。任意のタイトルを入力してください';
  }

  return isValidated ? undefined : errors;
};

module.exports = router;