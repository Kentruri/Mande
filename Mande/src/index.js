const express = require('express');
const morgan = require('morgan');
const exphbs = require('express-handlebars');
const path = require('path');
const flash = require('connect-flash');
const session = require('express-session');
const {database}=require('./keys');
const passport = require('passport');

// Initializations
const app = express();
require('./lib/trabajador.passport');
require('./lib/usuario.passport');


// Settings
app.set('port', process.env.PORT || 5000);
app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', exphbs(
    {
        defaultLayout: 'main',
        layoutsDir: path.join(app.get('views'),'layouts'),
        partialsDir: path.join(app.get('views'), 'partials'),
        extname: '.hbs',
        helpers: require('./lib/handlebars')
    }));
    app.set('view engine', '.hbs');

// Middlewares
app.use(session(
    {
        secret: 'Mande',
        resave: false,
        saveUninitialized: false/*,
        store :  new (require('connect-pg-simple')(session))()*/
    }
))
app.use(flash());
app.use(morgan('dev'));
app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());

// Global Variables
app.use((req, res, next)=>
{
    app.locals.success = req.flash('success');
    app.locals.message = req.flash('message');
    app.locals.employee = req.employee;
    next();
});

// Routes
app.use(require('./routes/index.routes'));
app.use('/usuario',require('./routes/usuario'));
app.use('/trabajador', require('./routes/trabajador'))


// Public
app.use(express.static(path.join(__dirname, 'public')));

// Starting the sever
app.listen(app.get('port'),()=>
{
    console.log('Server on port', app.get('port'));
});