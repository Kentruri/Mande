const express = require('express');
const router = express.Router();
const passport = require('passport');
const pool = require('../database');
const helpers = require('../lib/helpers');
const querys = require('../lib/querys');
const { isLoggedInEmployee, isNotLoggedInEmployee } = require('../lib/auth');

// REGISTRO
router.get('/registro', isNotLoggedInEmployee, (req, res) => {
    res.render('trabajador/registro');
});

router.post('/registro', passport.authenticate('local.signup',
    {
        successRedirect: '/trabajador/addLabor',
        failureRedirect: '/trabajador/registro',
        failureFlash: true
    }))

// INCIO DE SESIÓN
router.get('/inicio-sesion', isNotLoggedInEmployee, (req, res) => {
    res.render('trabajador/inicio');
});

router.post('/inicio-sesion', (req, res, next) => {
    passport.authenticate('local.signin',
        {
            successRedirect: '/trabajador/ingreso',
            failureRedirect: '/trabajador/inicio-sesion',
            failureFlash: true
        })(req, res, next);
});

// AÑADIR LABOR
router.get('/addLabor', isLoggedInEmployee, async (req, res) => {
    const labores = await querys.laboresSinAgregar(req.user.id_trabajador), trabajador_nombre = req.user.trabajador_nombre, trabajador_foto = req.user.trabajador_foto;
    res.render('trabajador/addLabor', { labores, trabajador_nombre, trabajador_foto });
});

router.post('/addLabor', async (req, res, done) => {
    const { nombre_labor, precioxhora } = req.body;
    if (nombre_labor != '') {
        querys.addLabor(req.user.id_trabajador, nombre_labor, precioxhora);
        done(null, req.flash('success', 'Labor añadida exitosamente. Agrega otra!'));
    } else {
        done(null, req.flash('message', 'Debes escoger una labor'));
    }
    res.redirect('/trabajador/addLabor');
});

// LISTA DE LABORES
router.get('/mis-labores', isLoggedInEmployee, async (req, res) => {
    const labores = await querys.misLabores(req.user.id_trabajador), trabajador_nombre = req.user.trabajador_nombre, trabajador_foto = req.user.trabajador_foto;
    res.render('trabajador/misLabores', { labores, trabajador_nombre, trabajador_foto });
});

// BORAR LABOR
router.get('/borrar-labor/:id', isLoggedInEmployee, async (req, res, done) => {
    const { id } = req.params;
    mensaje = await querys.borrarLabor(id, req.user.id_trabajador);
    mensaje == 'failed' ? done(null, req.flash('message', 'No puedes borrar una labor con la que tienes un trabajo activo')) :
        done(null, req.flash('success', 'Labor eliminada con éxito'));
    res.redirect('/trabajador/mis-labores');
});

// EDITAR LABOR
router.get('/editar-labor/:id', isLoggedInEmployee, async (req, res) => {
    const { id } = req.params, trabajador_nombre = req.user.trabajador_nombre, trabajador_foto = req.user.trabajador_foto,
        labor = await querys.laborParaEditar(id),
        labores = await querys.laboresSinAgregar(req.user.id_trabajador);
    res.render('trabajador/editLabor', { labor: labor[0], labores, trabajador_nombre, trabajador_foto });
});

router.post('/editar-labor/:id', async (req, res, done) => {
    const { id } = req.params,
        { nombre_labor, precioxhora } = req.body,
        laborActual = await querys.laborParaEditar(id);
    if (nombre_labor == '') {
        mensaje = await querys.editarLabor(laborActual[0].nombre_labor, precioxhora, id, req.user.id_trabajador);
        mensaje == 'failed' ? done(null, req.flash('message', 'No puedes editar una labor con la que tienes un trabajo activo')) :
            done(null, req.flash('success', 'Labor editada con éxito'));
    } else {
        mesanje = await querys.editarLabor(nombre_labor, precioxhora, id, req.user.id_trabajador);
        mensaje == 'failed' ? done(null, req.flash('message', 'No puedes editar una labor con la que tienes un trabajo activo')) :
            done(null, req.flash('success', 'Labor editada con éxito'));
    }
    res.redirect('/trabajador/mis-labores');
});

// INGRESO
router.get('/ingreso', isLoggedInEmployee, async (req, res, done) => {
    const employee = await querys.trabajadorDisponibilidad(req.user.id_trabajador);
    if (employee.trabajador_disponibilidad) {
        res.redirect('/trabajador/mis-labores');
    } else {
        done(null, employee, req.flash('success', '¡' + employee.trabajador_nombre + '! Tienes trabajo activo'));
        res.redirect('/trabajador/trabajos-activos');
    }
});

// TRABAJOS ACTIVOS
router.get('/trabajos-activos', isLoggedInEmployee, async (req, res) => {
    const servicios = await querys.trabajosActivos(req.user.id_trabajador), trabajador_nombre = req.user.trabajador_nombre, trabajador_foto = req.user.trabajador_foto;;
    res.render('trabajador/trabajosActivos', { servicios, trabajador_nombre, trabajador_foto });
});

// DETALLES DE UN TRABAJO
router.get('/detalles/:id_servicio', isLoggedInEmployee, async (req, res) => {
    const { id_servicio } = req.params, trabajador_nombre = req.user.trabajador_nombre, trabajador_foto = req.user.trabajador_foto;
        servicio = await querys.detallesTrabajo(id_servicio),
        employeeUbication = await querys.ubicacionTrabajador(req.user.id_trabajador);
    res.render('trabajador/detallesTrabajo', { servicio, employeeUbication: employeeUbication[0], trabajador_nombre, trabajador_foto });
});

// CULMINAR TRABAJO
router.get('/culminar-trabajo/:id_servicio/:nombre_labor', isLoggedInEmployee, async (req, res) => {
    const { id_servicio, nombre_labor } = req.params, trabajador_nombre = req.user.trabajador_nombre, trabajador_foto = req.user.trabajador_foto,
        precio = await querys.laborPrecio(req.user.id_trabajador, nombre_labor),
        servicio = await querys.trabajoInformacion(id_servicio);
    res.render('trabajador/terminarTrabajo', { servicio, precio, trabajador_nombre, trabajador_foto });
});

router.post('/culminar-trabajo/:id_servicio/:nombre_labor', async (req, res, done) => {
    const { id_servicio } = req.params,
        { pago_valor } = req.body;
    querys.culminarTrabajo(id_servicio, req.user.id_trabajador, pago_valor);
    done(null, req.flash('success', 'El trabajo se culminó con éxito!'));
    res.redirect('/trabajador/trabajos-activos');
});

// TRABAJOS PENDIENTES DE PAGO
router.get('/trabajos-pendientes', isLoggedInEmployee, async (req, res) => {
    const id_trabajador = req.user.id_trabajador, trabajador_nombre = req.user.trabajador_nombre, trabajador_foto = req.user.trabajador_foto,
        servicios = await querys.trabajosSinPagar(id_trabajador);
    res.render('trabajador/trabajosPendientes', { servicios, trabajador_nombre, trabajador_foto });
});

//HISTORIAL DE TRABAJOS
router.get('/trabajos-historial', isLoggedInEmployee, async (req, res) => {
    const servicios = await querys.historialTrabajos(req.user.id_trabajador), trabajador_nombre = req.user.trabajador_nombre,  trabajador_foto = req.user.trabajador_foto;
    res.render('trabajador/trabajosHistorial', { servicios, trabajador_nombre, trabajador_foto});
});


// PERFIL
router.get('/perfil', isLoggedInEmployee, async (req, res, done) => {
    const employee = await querys.trabajadorPerfil(req.user.id_trabajador), trabajador_nombre = req.user.trabajador_nombre, trabajador_foto = req.user.trabajador_foto;
    res.render('trabajador/perfil', { employee, trabajador_nombre, trabajador_foto});
});

router.post('/perfil', async (req, res, done) => {
    const id_trabajador = req.user.id_trabajador,
        { trabajador_nombre, trabajador_foto, trabajador_documento, trabajador_direccion, trabajador_localidad, trabajador_latitud, trabajador_longitud, trabajador_username } = req.body;
    mensaje = await querys.actualizarTrabajador(trabajador_nombre, trabajador_foto, trabajador_documento, trabajador_direccion, trabajador_localidad, trabajador_latitud, trabajador_longitud, trabajador_username, id_trabajador);
    mensaje == 'success' ? done(null, req.flash('success', 'Actualización exitosa!')) : done(null, req.flash('message', 'Ya hay alguien registrado con ese usuario'));
    res.redirect('/trabajador/perfil');
});

router.post('/set-passoword', async (req, res, done) => {
    const { old_password, new_password } = req.body,
        validPassword = await helpers.matchPassword(old_password, req.user.trabajador_password);
    console.log(req.body);
    if (validPassword) {
        encrypt = await helpers.encryptPassword(new_password);
        querys.contraseñaTrabajador(encrypt, req.user.id_trabajador)
        done(null, req.flash('success', 'Actualización exitosa!'));
    } else {
        done(null, req.flash('message', 'La contraseña antigua no es válida'))
    }
    res.redirect('/trabajador/perfil');
});

router.get('/borrar-cuenta', isLoggedInEmployee, async (req, res, done) => {
    borrar = await querys.borrarTrabajador(req.user.id_trabajador);
    if (borrar) {
        res.redirect('/trabajador/cerrar-sesion');
    } else {
        done(null, req.flash('message', 'No puedes eliminar tu cuenta mientras tengas servicios sin culminar'))
        res.redirect('/trabajador/perfil');
    }
});

// CERRAR SESIÓN
router.get('/cerrar-sesion', isLoggedInEmployee, (req, res) => {
    req.logOut();
    res.redirect('/');
});

module.exports = router;