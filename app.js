const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');

const accountcontrol = require('./lib/security/accountcontrol.js');
const { SESSION_SECRET } = require('./config/app.config').security;

const app = express();

app.set('view engine', 'ejs');
app.disable('x-powered-by');

app.use('/public', express.static(__dirname + '/public/' + (process.env.NODE_ENV === 'development' ? 'development' : 'production')));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(cookieParser());
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  name: 'sid'
}));

app.use(flash());
app.use(...accountcontrol.initialize());

app.use('/', require('./routes/index.js'));
app.use('/posts/', require('./routes/posts.js'));
app.use('/search/', require('./routes/search.js'));
app.use('/account/', require('./routes/account.js'));

const systemlogger = require('./lib/log/systemlogger.js');
app.use(systemlogger());

const accessLogger = require('./lib/log/accesslogger.js');
app.use(accessLogger());

app.listen(8000);
console.log('listening Port: 8000');
