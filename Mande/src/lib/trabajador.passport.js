const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const pool = require('../database');

passport.use('trabajador.signup', new LocalStrategy(
    {
        usernameField: 'trabajador_username',
        passwordField: 'trabajador_password',
        passReqToCallback: true
    }, async (req, username, password, done) => 
    {
        const {id_trabajador, trabajador_nombre, trabajador_fechaNacimiento, trabajador_foto, trabajador_documento, trabajador_direccion, trabajador_latitud, trabajador_longitud, trabajador_username, trabajador_password } = req.body;
        const newEmployee = {id_trabajador, trabajador_nombre, trabajador_fechaNacimiento, trabajador_foto, trabajador_documento, trabajador_direccion, trabajador_latitud, trabajador_longitud, trabajador_username, trabajador_password };
        const result = await pool.query('INSERT INTO trabajador(id_trabajador, trabajador_nombre, trabajador_fechaNacimiento, trabajador_foto, trabajador_documento, trabajador_direccion, trabajador_latitud, trabajador_longitud, trabajador_username, trabajador_password) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)', [id_trabajador, trabajador_nombre, trabajador_fechaNacimiento, trabajador_foto, trabajador_documento, trabajador_direccion, trabajador_latitud, trabajador_longitud, trabajador_username, trabajador_password]);
        //console.log(newEmployee);
        return done(null, newEmployee);
    }
));

passport.use('trabajador_signin', new LocalStrategy(
    {
        usernameField: 'trabajador_username',
        passwordField: 'trabajador_password',
        passReqToCallback: true
    }, async (req, trabajador_username, trabajador_password, done) =>
    {
        const rows = await (await pool.query('SELECT * FROM trabajador WHERE trabajador_username=$1 AND trabajador_password=$2', [trabajador_username, trabajador_password])).rows;
        if(rows.length > 0)
        {
            const employee = rows[0];
            done(null, employee, req.flash('success','Bienvenido ' + employee.trabajador_username));
        }else
        {
            done(null, false, req.flash('message','Usuario o contraseña inválida'));
        }
    }
));

passport.serializeUser((employee, done) =>
{
    done(null, employee.id_trabajador);
});

passport.deserializeUser(async (id_trabajador, done) => 
{
    const rows = await (await pool.query('SELECT * FROM trabajador WHERE id_trabajador=$1', [id_trabajador])).rows;
    done(null, rows[0]);
});