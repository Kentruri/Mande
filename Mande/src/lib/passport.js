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
        const { trabajador_nombre, trabajador_fechaNacimiento, trabajador_foto, trabajador_documento, trabajador_direccion, trabajador_latitud, trabajador_longitud, trabajador_username, trabajador_password } = req.body;
        const newEmployee = { trabajador_nombre, trabajador_fechaNacimiento, trabajador_foto, trabajador_documento, trabajador_direccion, trabajador_latitud, trabajador_longitud, trabajador_username, trabajador_password };
        await pool.query('INSERT INTO trabajador(trabajador_nombre, trabajador_fechaNacimiento, trabajador_foto, trabajador_documento, trabajador_direccion, trabajador_latitud, trabajador_longitud, trabajador_username, trabajador_password) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)', [trabajador_nombre, trabajador_fechaNacimiento, trabajador_foto, trabajador_documento, trabajador_direccion, trabajador_latitud, trabajador_longitud, trabajador_username, trabajador_password]);
    }
));

passport.use('usuario.signup', new LocalStrategy(
    {
        usernameField: 'usuario_username',
        passwordField: 'usuario_password',
        passReqToCallback: true
    }, async (req, username, password, done) => 
    {
        const {numero_usuario, usuario_nombre, usuario_fechaNacimiento, usuario_direccion, usuario_latitud, usuario_longitud, usuario_recibo, usuario_email, usuario_username, usuario_password, usuario_numCard} = req.body;
        const newUSer = {numero_usuario, usuario_nombre, usuario_fechaNacimiento, usuario_direccion, usuario_latitud, usuario_longitud, usuario_recibo, usuario_email, usuario_username, usuario_password, usuario_numCard};
        await pool.query('INSERT INTO usuario VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)', [numero_usuario, usuario_nombre, usuario_fechaNacimiento, usuario_direccion, usuario_latitud, usuario_longitud, usuario_recibo, usuario_email, usuario_username, usuario_password, usuario_numCard]);
        res.send('received');}
))

/*passport.serializeUser((usr, done)=>{

});*/