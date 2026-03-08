/**
 * Module dependencies.
 */

//const snyk = require('@snyk/nodejs-runtime-agent')
//snyk({
//  projectId: process.env.SNYK_PROJECT_ID,
//});

require('./db');

var st = require('st');
var crypto = require('crypto');
var express = require('express');
var http = require('http');
var path = require('path');
var ejsEngine = require('ejs-locals');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var logger = require('morgan');
var errorHandler = require('errorhandler');
var optional = require('optional');
var marked = require('marked');
var fileUpload = require('express-fileupload');
var dust = require('dustjs-linkedin');
var dustHelpers = require('dustjs-helpers');
var cons = require('consolidate');
var csrf = require('csurf'); // Importação única do CSRF

var app = express();
var routes = require('./routes');

// all environments
app.set('port', process.env.PORT || 3001);
app.engine('ejs', ejsEngine);
app.engine('dust', cons.dust);
cons.dust.helpers = dustHelpers;
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(methodOverride());
app.use(cookieParser()); // Obrigatório antes do CSRF
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(fileUpload());

// --- CONFIGURAÇÃO DO CSRF ---
// Definimos a proteção APÓS o body-parser e cookie-parser
var csrfProtection = csrf({ cookie: true });

// Middleware para passar o token para os templates (EJS/Dust)
// Isso evita que você tome 403 Forbidden ao navegar legitimamente
app.use(function (req, res, next) {
  res.locals.csrfToken = (typeof req.csrfToken === 'function') ? req.csrfToken() : '';
  next();
});
// ----------------------------

// Routes
app.use(routes.current_user);
app.get('/', routes.index); // Home geralmente é aberta

// Aplicando proteção nas rotas sensíveis
app.get('/admin', csrfProtection, routes.admin);
app.post('/admin', csrfProtection, routes.admin);
app.post('/create', csrfProtection, routes.create);
app.get('/destroy/:id', csrfProtection, routes.destroy);
app.get('/edit/:id', csrfProtection, routes.edit);
app.post('/update/:id', csrfProtection, routes.update);
app.post('/import', csrfProtection, routes.import);
app.get('/about_new', csrfProtection, routes.about_new);
app.get('/chat', csrfProtection, routes.chat.get);
app.put('/chat', csrfProtection, routes.chat.add);
app.delete('/chat', csrfProtection, routes.chat.delete);

// Static
app.use(st({ path: './public', url: '/public' }));

marked.setOptions({ sanitize: true });
app.locals.marked = marked;

if (app.get('env') == 'development') {
  app.use(errorHandler());
}

var token = process.env.SECRET_TOKEN;
console.log('token: ' + token);

http.createServer(app).listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});