const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const pool = require('../database');
const helpers = require('./helpers');

passport.use('usuario.signup', new LocalStrategy(
    {
        usernameField: 'usuario_username',
        passwordField: 'usuario_password',
        passReqToCallback: true
    }, async (req, username, password, done) => 
    {
        const {numero_usuario, usuario_nombre, usuario_fechaNacimiento, usuario_direccion, usuario_latitud, usuario_longitud, usuario_recibo, usuario_email, usuario_username, usuario_password, usuario_numCard} = req.body;
        const newUser = {numero_usuario, usuario_nombre, usuario_fechaNacimiento, usuario_direccion, usuario_latitud, usuario_longitud, usuario_recibo, usuario_email, usuario_username, usuario_password, usuario_numCard};
        newUser.usuario_numCard = await helpers.encryptNumCard(usuario_numCard);
        const result = await pool.query('INSERT INTO usuario VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)', [numero_usuario, usuario_nombre, usuario_fechaNacimiento, usuario_direccion, usuario_latitud, usuario_longitud, usuario_recibo, usuario_email, usuario_username, usuario_password, newUser.usuario_numCard]);
        return done(null, newUser);
    }
));

passport.use('usuario.signin', new LocalStrategy(
    {
        usernameField: 'usuario_username',
        passwordField: 'usuario_password',
        passReqToCallback: true
    }, async(req, usuario_username, usuario_password, done) =>
    {
        const filas = await (await pool.query('SELECT * FROM usuario WHERE usuario_username=$1 AND usuario_password=$2', [usuario_username, usuario_password])).rows;
        if(filas.length>0)
        {
            const user=filas[0];
            done(null, user, req.flash('success','Bienvenido ' + user.usuario_username));
        }else
        {
            done(null, false, req.flash('message','Cuenta inválida'));
        }
    }
));

passport.serializeUser((user, done) =>
{
    done(null, user.numero_usuario);
});

passport.deserializeUser(async (numero_usuario, done) => 
{
    const filas = await (await pool.query('SELECT * FROM usuario WHERE numero_usuario=$1', [numero_usuario])).rows;
    done(null, filas[0]);
});