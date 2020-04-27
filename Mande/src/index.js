const express = require('express');
const morgan = require('morgan');
const exphbs = require('express-handlebars');
const path = require('path');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const hbs = require('handlebars');

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

hbs.registerHelper("Dist",function(latT, lonT,latU,lonU){
    
    rad = function (x) { return x * Math.PI / 180; }

    var R = 6378.137;                          //Radio de la tierra en km
    var dLat = rad(latT - latU);
    var dLong = rad(lonT - lonU);

    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(rad(latU)) * Math.cos(rad(latT)) * Math.sin(dLong / 2) * Math.sin(dLong / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;

    return d.toFixed(1);                      //Retorna tres decimales


});

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