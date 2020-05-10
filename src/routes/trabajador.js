const express = require('express');
const router = express.Router();
const passport = require('passport');
const pool = require('../database');
const querys = require('../lib/querys');
const { isLoggedInEmployee, isNotLoggedInEmployee } = require('../lib/auth');

// REGISTRO
router.get('/registro', isNotLoggedInEmployee, (req, res) => {
    res.render('trabajador/registro');
});

router.post('/registro', passport.authenticate('trabajador.signup',
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
    passport.authenticate('trabajador_signin',
        {
            successRedirect: '/trabajador/ingreso',
            failureRedirect: '/trabajador/inicio-sesion',
            failureFlash: true
        })(req, res, next);
});

// AÑADIR LABOR
router.get('/addLabor', isLoggedInEmployee, async (req, res) => {
    const labores = await querys.laboresSinAgregar(req.user.id_trabajador);
    res.render('trabajador/addLabor', { labores });
});

router.post('/addLabor', async (req, res, done) => {
    const { nombre_labor, precioxhora } = req.body;
    if (nombre_labor!='') {
        querys.addLabor(req.user.id_trabajador, nombre_labor, precioxhora);
        done(null, req.flash('success', 'Labor añadida exitosamente. Agrega otra!'));
    }else {
        done(null, req.flash('message', 'Debes escoger una labor'));
    }
    res.redirect('/trabajador/addLabor');
});

// LISTA DE LABORES
router.get('/mis-labores', isLoggedInEmployee, async (req, res) => {
    const labores = await querys.misLabores(req.user.id_trabajador);
    res.render('trabajador/misLabores', { labores });
});

// BORAR LABOR
router.get('/borrar-labor/:id', isLoggedInEmployee, async (req, res, done) => {
    const { id } = req.params;
    querys.borrarLabor(id);
    done(null, req.flash('success', 'Labor eliminada con éxito'));
    res.redirect('/trabajador/mis-labores');
});

// EDITAR LABOR
router.get('/editar-labor/:id', isLoggedInEmployee, async (req, res) => {
    const { id } = req.params;
    const labor = await querys.laborParaEditar(id);
    const labores = await querys.laboresSinAgregar(req.user.id_trabajador);
    res.render('trabajador/editLabor', { labor: labor[0], labores });
});

router.post('/editar-labor/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre_labor, precioxhora } = req.body;
    const laborActual = await querys.laborParaEditar(id);
    if (nombre_labor == '') {
        querys.editarLabor(laborActual[0].nombre_labor, precioxhora, id);
    } else {
        querys.editarLabor(nombre_labor, precioxhora, id);
    }
    res.redirect('/trabajador/mis-labores');
});

// INGRESO
router.get('/ingreso', isLoggedInEmployee, async (req, res, done) => {
    const employee = await querys.trabajadorDisponibilidad(req.user.id_trabajador);
    if (employee.trabajador_disponibilidad) {
        done(null, employee, req.flash('success', 'Bienvenido ' + employee.trabajador_username));
        res.redirect('/trabajador/mis-labores');
    } else {
        done(null, employee, req.flash('success', '¡' + employee.trabajador_nombre + '! Tienes trabajo activo'));
        res.redirect('/trabajador/trabajos-activos');
    }
});

// TRABAJOS ACTIVOS
router.get('/trabajos-activos', isLoggedInEmployee, async (req, res) => {
    const servicios = await querys.trabajosActivos(req.user.id_trabajador);
    res.render('trabajador/trabajosActivos', { servicios });
});

// DETALLES DE UN TRABAJO
router.get('/detalles/:id_servicio', isLoggedInEmployee, async (req, res) => {
    const { id_servicio } = req.params;
    const servicio = await querys.detallesTrabajo(id_servicio);
    const employeeUbication = await querys.ubicacionTrabajador(req.user.id_trabajador);
    res.render('trabajador/detallesTrabajo', { servicio, employeeUbication: employeeUbication[0] });
});

// CULMINAR TRABAJO
router.get('/culminar-trabajo/:id_servicio/:nombre_labor', isLoggedInEmployee, async (req, res) => {
    const { id_servicio, nombre_labor } = req.params;
    const precio = await querys.laborPrecio(req.user.id_trabajador, nombre_labor);
    const servicio = await querys.servicioInformacion(id_servicio);
    res.render('trabajador/terminarTrabajo', { servicio: servicio, precio: precio });
});

router.post('/culminar-trabajo/:id_servicio/:nombre_labor', async (req, res, done) => {
    const { id_servicio } = req.params;
    const { pago_valor } = req.body;
    querys.culminarTrabajo(id_servicio, req.user.id_trabajador, pago_valor);
    done(null, req.flash('success', 'El trabajo se culminó con éxito!'));
    res.redirect('/trabajador/trabajos-activos');
});

// TRABAJOS PENDIENTES DE PAGO
router.get('/trabajos-pendientes', isLoggedInEmployee, async (req, res) => {
    const id_trabajador = req.user.id_trabajador;
    const servicios = await querys.trabajosSinPagar(id_trabajador);
    res.render('trabajador/trabajosPendientes', { servicios });
});

//HISTORIAL DE TRABAJOS
router.get('/trabajos-historial', isLoggedInEmployee, async (req, res) => {
    const servicios = await querys.historialTrabajos(req.user.id_trabajador);
    res.render('trabajador/trabajosHistorial', { servicios });
});


// PERFIL
router.get('/perfil', isLoggedInEmployee, async (req, res, done) => {
    employee = await querys.trabajadorPerfil(req.user.id_trabajador);
    res.render('trabajador/perfil', { employee });
});

router.post('/perfil', async (req, res, done) => {
    try {
        const id_trabajador = req.user.id_trabajador;
        const { trabajador_nombre, trabajador_fechaNacimiento, trabajador_foto, trabajador_documento, trabajador_direccion, trabajador_localidad, trabajador_latitud, trabajador_longitud, trabajador_username, trabajador_password } = req.body;
        await pool.query('UPDATE trabajador SET trabajador_nombre=$1, trabajador_foto=$2, trabajador_documento=$3, trabajador_username=$4, trabajador_password=$5 WHERE id_trabajador=$6', [trabajador_nombre, trabajador_foto, trabajador_documento, trabajador_username, trabajador_password, id_trabajador]);
        await pool.query('UPDATE direccion SET direccion_address=$1, direccion_localidad=$2, direccion_latitud=$3, direccion_longitud=$4 WHERE id_direccion=$5', [trabajador_direccion, trabajador_localidad, trabajador_latitud, trabajador_longitud, id_trabajador]);
        done(null, req.flash('success', 'Actualización exitosa!'));
    } catch (error) {
        done(null, req.flash('message', 'Ya hay alguien registrado con ese usuario'));
    }
    res.redirect('/trabajador/perfil');
});

router.get('/borrar-cuenta', isLoggedInEmployee, async (req, res, done) => {
    querys.borrarTrabajador(req.user.id_trabajador);
    res.redirect('/trabajador/cerrar-sesion');
});

// CERRAR SESIÓN
router.get('/cerrar-sesion', isLoggedInEmployee, (req, res) => {
    req.logOut();
    res.redirect('/');
});

module.exports = router;