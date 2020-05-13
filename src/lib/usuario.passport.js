const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const pool = require('../database');
const helpers = require('./helpers');
const querys = require('../lib/querys');

passport.use('usuario.signup', new LocalStrategy(
    {
        usernameField: 'usuario_username',
        passwordField: 'usuario_password',
        passReqToCallback: true
    }, async (req, username, password, done) => {
        const { id_usuario, usuario_nombre, usuario_fechaNacimiento, usuario_direccion, usuario_localidad, usuario_latitud, usuario_longitud, usuario_recibo, usuario_email, usuario_numero, usuario_username, usuario_password } = req.body;
        const newUser = { id_usuario, usuario_nombre, usuario_fechaNacimiento, usuario_direccion, usuario_localidad, usuario_latitud, usuario_longitud, usuario_recibo, usuario_email, usuario_numero, usuario_username, usuario_password };
        newUser.usuario_password = await helpers.encryptPassword(password);
        console.log(newUser.usuario_password);
        crear = await querys.crearUsuario(id_usuario, usuario_nombre, usuario_fechaNacimiento, usuario_direccion, usuario_localidad, usuario_latitud, usuario_longitud, usuario_recibo, usuario_email, usuario_numero, usuario_username, newUser.usuario_password);
        if (crear == 'success') {
            done(null, req.flash('success', 'Solicita tu primer servicio!'));
            return done(null, newUser);
        } else if (crear == 'usuario_usuario_username_key') {
            done(null, req.flash('message', 'Ya hay alguien registrado con ese usario'));
        } else if (crear == 'usuario_usuario_numero_key') {
            done(null, req.flash('message', 'Ya hay alguien registrado con ese número celular'));
        } else {
            done(null, req.flash('message', 'Ya hay alguien registrado con ese correo electrónico'));
        }
    }
));

passport.use('usuario.signin', new LocalStrategy(
    {
        usernameField: 'usuario_username',
        passwordField: 'usuario_password',
        passReqToCallback: true
    }, async (req, usuario_username, usuario_password, done) => {
    const filas = await (await pool.query('SELECT * FROM usuario WHERE usuario_username=$1 AND eliminado=false OR usuario_numero=$2 AND eliminado=false ', [usuario_username, parseInt(usuario_username)])).rows;
    if (filas.length > 0) {
        const user = filas[0];
        const validPassword = await helpers.matchPassword(usuario_password, user.usuario_password);
        validPassword ? done(null, user, req.flash('success', 'Bienvenido ' + user.usuario_username)) : done(null, false, req.flash('message', 'Constraseña inválida'));
    } else {
        done(null, false, req.flash('message', 'Usuario inválido'));
    }
}
));

passport.serializeUser((user, done) => {
    done(null, user.id_usuario);
});

passport.deserializeUser(async (id_usuario, done) => {
    const filas = await (await pool.query('SELECT * FROM usuario WHERE id_usuario=$1', [id_usuario])).rows;
    done(null, filas[0]);
});