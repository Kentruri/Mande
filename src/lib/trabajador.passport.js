const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const pool = require('../database');
const helpers = require('./helpers');
const querys = require('../lib/querys');

passport.use('trabajador.signup', new LocalStrategy(
    {
        usernameField: 'trabajador_username',
        passwordField: 'trabajador_password',
        passReqToCallback: true
    }, async (req, username, password, done) => {
        const { id_trabajador, trabajador_nombre, trabajador_fechaNacimiento, trabajador_foto, trabajador_documento, trabajador_direccion, trabajador_localidad, trabajador_latitud, trabajador_longitud, trabajador_username, trabajador_password } = req.body;
        const newEmployee = { id_trabajador, trabajador_nombre, trabajador_fechaNacimiento, trabajador_foto, trabajador_documento, trabajador_username, trabajador_password };
        newEmployee.trabajador_password = helpers.encryptPassword(password);
        console.log(newEmployee.trabajador_password);
        crear = await querys.crearTrabajador(id_trabajador, trabajador_nombre, trabajador_fechaNacimiento, trabajador_foto, trabajador_documento, trabajador_direccion, trabajador_localidad, trabajador_latitud, trabajador_longitud, trabajador_username, newEmployee.trabajador_password);
        if (crear == 'success') {
            done(null, req.flash('success', 'Agrega labores a tu perfil!'));
            return done(null, newEmployee);
        } else if (crear == 'trabajador_pkey') {
            done(null, false, req.flash('message', 'Ya hay alguien registrado con tu mismo número de documento'));
        } else {
            done(null, false, req.flash('message', 'Ya hay alguien registrado con ese mismo usuario'));
        }
    }
));

passport.use('trabajador_signin', new LocalStrategy(
    {
        usernameField: 'trabajador_username',
        passwordField: 'trabajador_password',
        passReqToCallback: true
    }, async (req, trabajador_username, trabajador_password, done) => {
        const rows = await (await pool.query('SELECT * FROM trabajador WHERE trabajador_username=$1 AND eliminado=false', [trabajador_username])).rows;
        if (rows.length > 0) {
            const employee = rows[0];
            const validPassword = await helpers.matchPassword(trabajador_password, employee.trabajador_password);
            validPassword? done(null, employee, req.flash('success', 'Bienvenido ' + employee.trabajador_username)) : done(null, false, req.flash('message', 'Contraseña inválida'));
        } else {
            done(null, false, req.flash('message', 'Usuario inválido'));
        }
    }
));

passport.serializeUser((employee, done) => {
    done(null, employee.id_trabajador);
});

passport.deserializeUser(async (id_trabajador, done) => {
    const rows = await (await pool.query('SELECT * FROM trabajador WHERE id_trabajador=$1', [id_trabajador])).rows;
    done(null, rows[0]);
});