const passport = require('passport');
const LocalStrategy = require('passport-local-roles').Strategy;
const pool = require('../database');
const helpers = require('./helpers');
const querys = require('./querys');

passport.use('local.signup', new LocalStrategy(
    {
        usernameField: 'username',
        passwordField: 'password',
        roleField: 'role',
        passReqToCallback: true
    }, async (req, username, password, role, done) => {
        if (role == 'trabajador') {
            const { id_trabajador, trabajador_nombre, trabajador_fechaNacimiento, trabajador_foto, trabajador_documento, trabajador_direccion, trabajador_localidad, trabajador_latitud, trabajador_longitud } = req.body;
            const newEmployee = { id_trabajador, trabajador_nombre, trabajador_fechaNacimiento, trabajador_foto, trabajador_documento, username, trabajador_password, role };
            newEmployee.trabajador_password = await helpers.encryptPassword(password);
            crear = await querys.crearTrabajador(id_trabajador, trabajador_nombre, trabajador_fechaNacimiento, trabajador_foto, trabajador_documento, trabajador_direccion, trabajador_localidad, trabajador_latitud, trabajador_longitud, username, newEmployee.trabajador_password);
            if (crear == 'success') {
                done(null, req.flash('success', 'Agrega labores a tu perfil!'));
                return done(null, newEmployee);
            } else if (crear == 'trabajador_pkey') {
                done(null, false, req.flash('message', 'Ya hay alguien registrado con tu mismo número de documento'));
            } else {
                done(null, false, req.flash('message', 'Ya hay alguien registrado con ese mismo usuario'));
            }
        } else if (role == 'usuario') {
            const { id_usuario, usuario_nombre, usuario_fechaNacimiento, usuario_direccion, usuario_localidad, usuario_latitud, usuario_longitud, usuario_recibo, usuario_email, usuario_numero, usuario_username, usuario_password } = req.body;
            const newUser = { id_usuario, usuario_nombre, usuario_fechaNacimiento, usuario_direccion, usuario_localidad, usuario_latitud, usuario_longitud, usuario_recibo, usuario_email, usuario_numero, username, usuario_password, role };
            newUser.usuario_password = await helpers.encryptPassword(password);
            crear = await querys.crearUsuario(id_usuario, usuario_nombre, usuario_fechaNacimiento, usuario_direccion, usuario_localidad, usuario_latitud, usuario_longitud, usuario_recibo, usuario_email, usuario_numero, username, newUser.usuario_password);
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
    }
));

passport.use('local.signin', new LocalStrategy(
    {
        usernameField: 'username',
        passwordField: 'password',
        roleField: 'role',
        passReqToCallback: true
    }, async (req, username, password, role, done) => {
        if (role == 'trabajador') {
            const rows = await (await pool.query('SELECT * FROM trabajador WHERE trabajador_username=$1 AND eliminado=false', [username])).rows;
            if (rows.length > 0) {
                const employee = rows[0];
                employee.NewField = 'role';
                employee.role = 'trabajador'
                const validPassword = await helpers.matchPassword(password, employee.trabajador_password);
                validPassword ? done(null, employee, req.flash('success', 'Bienvenido ' + employee.trabajador_username)) : done(null, false, req.flash('message', 'Contraseña incorrecta'));
            } else {
                done(null, false, req.flash('message', 'El trabajador no existe'));
            }
        } else if (role == 'usuario') {
            const filas = await (await pool.query('SELECT * FROM usuario WHERE usuario_username=$1 AND eliminado=false OR usuario_numero=$2 AND eliminado=false ', [username, parseInt(username)])).rows;
            if (filas.length > 0) {
                const user = filas[0];
                user.NewField = 'role';
                user.role = 'usuario'
                const validPassword = await helpers.matchPassword(password, user.usuario_password);
                validPassword ? done(null, user, req.flash('success', 'Bienvenido ' + user.usuario_username)) : done(null, false, req.flash('message', 'Constraseña incorrecta'));
            } else {
                done(null, false, req.flash('message', 'El usuario no existe'));
            }
        }
    }
));

passport.serializeUser((employee, done) => {
    if (employee.role == 'trabajador') {
        done(null, employee.id_trabajador);
    } else if (employee.role == 'usuario') {
        done(null, employee.id_usuario);
    }

});

passport.deserializeUser(async (id, done) => {
    const trabajador = await (await pool.query('SELECT * FROM trabajador WHERE id_trabajador=$1', [id])).rows;
    const usuario = await (await pool.query('SELECT * FROM usuario WHERE id_usuario=$1', [id])).rows;
    if (trabajador.length > 0) {
        done(null, trabajador[0]);
    } else if (usuario.length > 0) {
        done(null, usuario[0]);
    }

});