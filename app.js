const express = require('express');
const app = express();


app.set('view engine', 'ejs');
app.disable('x-powered-by');

app.use('/public', express.static(__dirname + '/public/' + (process.env.NODE_ENV === 'development' ? 'development' : 'production')));

app.use('/', require('./routes/index.js'));

const systemlogger = require('./lib/log/systemlogger.js');
app.use(systemlogger());

const accessLogger = require('./lib/log/accesslogger.js');
app.use(accessLogger());

app.listen(3000);
console.log('listening Port: 3000');
