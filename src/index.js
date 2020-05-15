const express = require('express');
const morgan = require('morgan');
const exphbs = require('express-handlebars');
const path = require('path');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const hbs = require('handlebars');
const helpers = require('./lib/helpers');

// Initializations
const app = express();
require('./lib/passport');


// Settings
app.set('port', process.env.PORT || 5000);
app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', exphbs(
    {
        defaultLayout: 'main',
        layoutsDir: path.join(app.get('views'), 'layouts'),
        partialsDir: path.join(app.get('views'), 'partials'),
        extname: '.hbs'
    }));
app.set('view engine', '.hbs');

// Helpers
hbs.registerHelper("calcularDistancia", function (latT, lonT, latU, lonU) {
    return helpers.calcularDistancia(latT, lonT, latU, lonU);
});
hbs.registerHelper("formatearFecha", function (str) {
    return helpers.formatearFecha(str);
});
hbs.registerHelper("formatearPrecio", function format(price) {
    return helpers.formatearPrecio(price);
});

// Middlewares
app.use(session(
    {
        secret: 'Mande',
        resave: true,
        saveUninitialized: true
    }
))
app.use(flash());
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());

// Global Variables
app.use((req, res, next) => {
    app.locals.success = req.flash('success');
    app.locals.message = req.flash('message');
    app.locals.employee = req.employee;
    next();
});

// Routes
app.use(require('./routes/index.routes'));
app.use('/usuario', require('./routes/usuario.routes'));
app.use('/trabajador', require('./routes/trabajador.routes'))


// Public
app.use(express.static(path.join(__dirname, 'public')));

// Starting the sever
app.listen(app.get('port'), () => {
    console.log('Server on port', app.get('port'));
});