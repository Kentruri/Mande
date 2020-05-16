const express = require('express');
const router = express.Router();
const passport = require('passport');
const pool = require('../database');
const querys = require('../lib/querys');
const helpers = require('../lib/helpers');
const stripe = require('stripe')('sk_test_V4ma8MKhvEFqZpKu2CCNQHCd00tHQ3g0Xv');
const { isLoggedInUser, isNotLoggedInUser } = require('../lib/auth');

// REGISTRO 
router.get('/registro', isNotLoggedInUser, (req, res) => {
    res.render('usuario/registro');
});

router.post('/registro', passport.authenticate('local.signup',
    {
        successRedirect: '/usuario/tipo-servicio',
        failureRedirect: '/usuario/registro',
        failureFlash: true
    }))

// INICIO DE SESIÓN
router.get('/inicio-sesion', isNotLoggedInUser, (req, res) => {
    res.render('usuario/inicio');
});

router.post('/inicio-sesion', (req, res, next) => {
    passport.authenticate('local.signin',
        {
            successRedirect: '/usuario/ingreso',
            failureRedirect: '/usuario/inicio-sesion',
            failureFlash: true
        })(req, res, next);
});

// ESCOGER TIPO DE SERVICIO
router.get('/tipo-servicio', isLoggedInUser, async (req, res, done) => {
    const deuda = await querys.serviciosPorPagar(req.user.id_usuario), usuario_nombre = req.user.usuario_nombre, usuario_foto = req.user.usuario_foto,
        labores = await querys.serviciosDisponibles();
    if (deuda.length > 0) {
        done(null, req.flash('success', 'No puedes solicitar servicios mientras tengas pagos pendientes'));
        res.redirect('/usuario/servicios-pagar');
    } else {
        res.render('usuario/tipoServicio', { labores, usuario_nombre, usuario_foto });
    }
});

router.post('/tipo-servicio', async (req, res) => {
    const { nombre_labor, servicio_descipcion } = req.body, id_usuario = req.user.id_usuario, usuario_nombre = req.user.usuario_nombre, usuario_foto = req.user.usuario_foto,
        userLocation = await querys.localidadUsuario(id_usuario),
        userUbication = await querys.ubicacionUsuario(id_usuario),
        trabajadores = await querys.trabajadoresDisponibles(nombre_labor, userLocation);
        console.log(userLocation);
    res.render('usuario/trabajadores', { nombre_labor, servicio_descipcion, userUbication: userUbication[0], trabajadores, usuario_nombre, usuario_foto });
});

//PERFIL DE UN TRABAJADOR
router.get('/trabajador-perfil/:trabajador_id/:nombre_labor/:servicio_descipcion', isLoggedInUser, async (req, res) => {
    const { trabajador_id, nombre_labor, servicio_descipcion } = req.params, usuario_nombre = req.user.usuario_nombre, usuario_foto = req.user.usuario_foto,
        userUbication = await querys.ubicacionUsuario(req.user.id_usuario),
        trabajador = await querys.trabajadorPerfilProfesional(nombre_labor, trabajador_id);
    res.render('usuario/trabajadorPerfil', { nombre_labor, servicio_descipcion, userUbication: userUbication[0], trabajador, usuario_nombre, usuario_foto });
});

// CONTRATAR TRABAJADOR
router.get('/contratar-trabajador/:trabajador_id/:nombre_labor/:servicio_descipcion', isLoggedInUser, async (req, res, done) => {
    const { trabajador_id, nombre_labor, servicio_descipcion } = req.params;
    querys.contratarTrabajo(nombre_labor, servicio_descipcion, trabajador_id, req.user.id_usuario);
    done(null, req.flash('success', 'Trabajador contratado!'));
    res.redirect('/usuario/servicios-activos');
});

// SERVIVICIOS ACTIVOS
router.get('/servicios-activos', isLoggedInUser, async (req, res) => {
    const servicios = await querys.serviciosActivos(req.user.id_usuario), usuario_nombre = req.user.usuario_nombre, usuario_foto = req.user.usuario_foto;
    res.render('usuario/serviciosActivos', { servicios, usuario_nombre, usuario_foto });
});

// SERVICIOS POR PAGAR
router.get('/servicios-pagar', isLoggedInUser, async (req, res) => {
    const servicios = await querys.serviciosPorPagar(req.user.id_usuario), usuario_nombre = req.user.usuario_nombre, usuario_foto = req.user.usuario_foto;
    res.render('usuario/serviciosPagar', { servicios, usuario_nombre, usuario_foto });
});

// PAGAR SERVICIO
router.get('/pagar-servicio/:id_servicio/:id_pago/:trabajador_id/:nombre_labor', isLoggedInUser, async (req, res) => {
    const { id_servicio, id_pago, trabajador_id } = req.params, usuario_nombre = req.user.usuario_nombre, usuario_email = req.user.usuario_email, usuario_foto = req.user.usuario_foto,
        servicio = await querys.servicioInformacion(req.user.id_usuario, id_servicio);
    res.render('usuario/pagarServicio', { servicio, usuario_nombre, usuario_email, usuario_foto });
});

router.post('/pagar-servicio/:id_servicio/:id_pago/:trabajador_id/:nombre_labor', async (req, res, done) => {
    const { id_servicio, id_pago, trabajador_id, nombre_labor } = req.params,
        { calificacion } = req.body;
    querys.pagarServicio(trabajador_id, id_servicio, nombre_labor, calificacion);
    done(null, req.flash('success', 'Pago exitoso!'));
    res.redirect('/usuario/servicios-historial');
});

// SERVIVICIOS PAGADOS
router.get('/servicios-historial', isLoggedInUser, async (req, res) => {
    const servicios = await querys.historialServicios(req.user.id_usuario), usuario_nombre = req.user.usuario_nombre, usuario_foto = req.user.usuario_foto;
    res.render('usuario/serviciosHistorial', { servicios, usuario_nombre, usuario_foto });
});

// INGRESO 
router.get('/ingreso', isLoggedInUser, async (req, res, done) => {
    const id_usuario = req.user.id_usuario,
        deuda = await querys.serviciosPorPagar(id_usuario),
        user = await querys.usuarioPerfil(id_usuario);

    if (deuda.length > 0) {
        res.redirect('/usuario/servicios-pagar');
    } else {
        done(null, user, req.flash('success', 'Bienvenido ' + user.usuario_nombre));
        res.redirect('/usuario/servicios-activos');
    }
});


// PERFIL
router.get('/perfil', isLoggedInUser, async (req, res, done) => {
    const user = await querys.usuarioPerfil(req.user.id_usuario), usuario_nombre = req.user.usuario_nombre, usuario_foto = req.user.usuario_foto;
    res.render('usuario/perfil', { user, usuario_nombre, usuario_foto });
});

router.post('/perfil', async (req, res, done) => {
    const id_usuario = req.user.id_usuario,
        { usuario_nombre, usuario_direccion, usuario_localidad, usuario_latitud, usuario_longitud, usuario_recibo, usuario_foto, usuario_email, usuario_numero, usuario_username } = req.body,
        restriccion = await querys.actualizarUsuario(id_usuario, usuario_nombre, usuario_direccion, usuario_localidad, usuario_latitud, usuario_longitud, usuario_recibo, usuario_foto, usuario_email, usuario_numero, usuario_username);
    restriccion == 'success' ? done(null, req.flash('success', 'Actualización exitosa!')) : restriccion == 'usuario_usuario_username_key' ? done(null, req.flash('message', 'Ya hay alguien registrado con ese usario')) :
        restriccion == 'usuario_usuario_numero_key' ? done(null, req.flash('message', 'Ya hay alguien registrado con ese número celular')) : done(null, req.flash('message', 'Ya hay alguien registrado con ese correo electrónico'));
    res.redirect('/usuario/perfil');
});

router.post('/set-passoword', async (req, res, done) => {
    const { old_password, new_password } = req.body,
        validPassword = await helpers.matchPassword(old_password, req.user.usuario_password);
    console.log(req.body);
    if (validPassword) {
        encrypt = await helpers.encryptPassword(new_password);
        querys.contraseñaUsuario(encrypt, req.user.id_usuario)
        done(null, req.flash('success', 'Actualización exitosa!'));
    } else {
        done(null, req.flash('message', 'La contraseña antigua no es válida'))
    }
    res.redirect('/usuario/perfil');
});

router.get('/borrar-cuenta', isLoggedInUser, async (req, res, done) => {
    borrar = await querys.borrarUsuario(req.user.id_usuario);
    if (borrar) {
        res.redirect('/usuario/cerrar-sesion');
    } else {
        done(null, req.flash('message', 'No puedes eliminar tu cuenta mientras tengas servicios sin culminar'))
        res.redirect('/usuario/perfil');
    }
});

// CERRAR SESIÓN
router.get('/cerrar-sesion', isLoggedInUser, (req, res) => {
    req.logOut();
    res.redirect('/');
});

module.exports = router;