const express = require('express');
const router = express.Router();
const passport = require('passport');
const pool = require('../database');
const querys = require('../lib/querys');
const helpers = require('../lib/helpers');
const { isLoggedInUser, isNotLoggedInUser } = require('../lib/auth');

// REGISTRO 
router.get('/registro', isNotLoggedInUser, (req, res) => {
    res.render('usuario/registro');
});

router.post('/registro', passport.authenticate('usuario.signup',
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
    passport.authenticate('usuario.signin',
        {
            successRedirect: '/usuario/ingreso',
            failureRedirect: '/usuario/inicio-sesion',
            failureFlash: true
        })(req, res, next);
});

// ESCOGER TIPO DE SERVICIO
router.get('/tipo-servicio', isLoggedInUser, async (req, res, done) => {
    const deuda = await querys.serviciosPorPagar(req.user.id_usuario);
    const labores = await querys.serviciosDisponibles();
    if (deuda.length > 0) {
        done(null, req.flash('success', 'No puedes solicitar servicios mientras tengas pagos pendientes'));
        res.redirect('/usuario/servicios-pagar');
    } else {
        res.render('usuario/tipoServicio', { labores });
    }
});

router.post('/tipo-servicio', async (req, res) => {
    const { nombre_labor, servicio_descipcion } = req.body, id_usuario = req.user.id_usuario;
    const userLocation = await querys.localidadUsuario(id_usuario);
    const userUbication = await querys.ubicacionTrabajador(id_usuario);
    const trabajadores = await querys.trabajadoresDisponibles(nombre_labor, userLocation);
    res.render('usuario/trabajadores', { nombre_labor: nombre_labor, servicio_descipcion: servicio_descipcion, userUbication: userUbication[0], trabajadores });
});

//PERFIL DE UN TRABAJADOR
router.get('/trabajador-perfil/:trabajador_id/:nombre_labor/:servicio_descipcion', isLoggedInUser, async (req, res) => {
    const { trabajador_id, nombre_labor, servicio_descipcion } = req.params;
    const userUbication = await querys.ubicacionUsuario(req.user.id_usuario);
    const trabajador = await querys.trabajadorPerfilProfesional(nombre_labor, trabajador_id);
    res.render('usuario/trabajadorPerfil', { nombre_labor: nombre_labor, servicio_descipcion: servicio_descipcion, userUbication: userUbication[0], trabajador });
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
    const servicios = await querys.serviciosActivos(req.user.id_usuario);
    res.render('usuario/serviciosActivos', { servicios });
});

// SERVICIOS POR PAGAR
router.get('/servicios-pagar', isLoggedInUser, async (req, res) => {
    const servicios = await querys.serviciosPorPagar(req.user.id_usuario);
    res.render('usuario/serviciosPagar', { servicios });
});

// PAGAR SERVICIO
router.get('/pagar-servicio/:id_servicio/:id_pago/:trabajador_id/:nombre_labor', isLoggedInUser, async (req, res) => {
    const { id_servicio, id_pago, trabajador_id } = req.params;
    const servicio = await querys.servicioInformacion(req.user.id_usuario, id_servicio);
    res.render('usuario/pagarServicio', { servicio });
});

router.post('/pagar-servicio/:id_servicio/:id_pago/:trabajador_id/:nombre_labor', async (req, res, done) => {
    const { id_servicio, id_pago, trabajador_id, nombre_labor } = req.params;
    const { calificacion } = req.body;
    querys.pagarServicio(trabajador_id, id_servicio, nombre_labor, calificacion);
    done(null, req.flash('success', 'Pago exitoso!'));
    res.redirect('/usuario/servicios-historial');
});

// SERVIVICIOS PAGADOS
router.get('/servicios-historial', isLoggedInUser, async (req, res) => {
    const servicios = await querys.historialServicios(req.user.id_usuario)
    res.render('usuario/serviciosHistorial', { servicios });
});

// INGRESO 
router.get('/ingreso', isLoggedInUser, async (req, res, done) => {
    const id_usuario = req.user.id_usuario;
    const deuda = await querys.serviciosPorPagar(id_usuario);
    const user = await querys.usuarioPerfil(id_usuario);

    if (deuda.length > 0) {
        done(null, user, req.flash('success', '¡' + user.usuario_nombre + '! Tienes un pago pendiente'));
        res.redirect('/usuario/servicios-pagar');
    } else {
        done(null, user, req.flash('success', 'Bienvenido ' + user.usuario_nombre));
        res.redirect('/usuario/servicios-activos');
    }
});


// PERFIL
router.get('/perfil', isLoggedInUser, async (req, res, done) => {
    const user = await querys.usuarioPerfil(req.user.id_usuario);
    res.render('usuario/perfil', { user });
});

router.post('/perfil', async (req, res, done) => {
    const id_usuario = req.user.id_usuario;
    const { usuario_nombre, usuario_direccion, usuario_localidad, usuario_latitud, usuario_longitud, usuario_recibo, usuario_email, usuario_numero, usuario_username, usuario_password, usuario_numCard } = req.body;
    const newUser = { usuario_nombre, usuario_direccion, usuario_localidad, usuario_latitud, usuario_longitud, usuario_recibo, usuario_email, usuario_numero, usuario_username, usuario_password, usuario_numCard };
    newUser.usuario_numCard = await helpers.encryptNumCard(usuario_numCard);
    restriccion = await querys.actualizarUsuario(id_usuario, usuario_nombre, usuario_direccion, usuario_localidad, usuario_latitud, usuario_longitud, usuario_recibo, usuario_email, usuario_numero, usuario_username, usuario_password, newUser.usuario_numCard);
    restriccion=='success'? done(null, req.flash('success', 'Actualización exitosa!')) : restriccion=='usuario_usuario_username_key'? done(null, req.flash('message', 'Ya hay alguien registrado con ese usario')) : 
    restriccion=='usuario_usuario_numero_key' ? done(null, req.flash('message', 'Ya hay alguien registrado con ese número celular')) : done(null, req.flash('message', 'Ya hay alguien registrado con ese correo electrónico'));
    res.redirect('/usuario/perfil');
});

router.get('/borrar-cuenta', isLoggedInUser, async (req, res, done) => {
    querys.borrarUsuario(req.user.id_usuario);
    res.redirect('/usuario/cerrar-sesion');
});

// CERRAR SESIÓN
router.get('/cerrar-sesion', isLoggedInUser, (req, res) => {
    req.logOut();
    res.redirect('/');
});

module.exports = router;