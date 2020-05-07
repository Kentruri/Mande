const express = require('express');
const router = express.Router();
const passport = require('passport');
const pool = require('../database');
const helpers = require('../lib/helpers');
const {isLoggedInEmployee, isNotLoggedInEmployee} = require('../lib/auth');

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
    const id_trabajador = req.user.id_trabajador;
    const labores = await (await pool.query('SELECT labor_nombre FROM labor LEFT JOIN (SELECT nombre_labor FROM laborvstrabajador WHERE trabajador_id=$1) AS laboresOf ON labor_nombre = nombre_labor WHERE nombre_labor is null',[id_trabajador])).rows;
    res.render('trabajador/addLabor', { labores });
});

router.post('/addLabor', async (req, res) => {
    const {nombre_labor, precioxhora}=req.body;
    const id_trabajador = req.user.id_trabajador;
    const newLabor = {nombre_labor, id_trabajador, precioxhora};
    await pool.query('INSERT INTO laborvstrabajador(trabajador_id, nombre_labor, precioxhora) VALUES($1, $2, $3)', [id_trabajador, nombre_labor, precioxhora]);
    res.redirect('/trabajador/addLabor');
});

// LISTA DE LABORES
router.get('/mis-labores', isLoggedInEmployee, async (req, res) => {
    const id_trabajador = req.user.id_trabajador;
    const labores = await (await pool.query('SELECT * FROM laborvstrabajador WHERE trabajador_id=$1', [id_trabajador])).rows;
    console.log(labores);
    res.render('trabajador/misLabores', { labores });
});

// BORAR LABOR
router.get('/borrar-labor/:id', isLoggedInEmployee, async(req, res) => {
    const {id}=req.params;
    await pool.query('DELETE FROM laborvstrabajador WHERE id_traba=$1', [id]);
    res.redirect('/trabajador/mis-labores')
});

// EDITAR LABOR
router.get('/editar-labor/:id', isLoggedInEmployee, async(req, res) => {
    const id_trabajador = req.user.id_trabajador;
    const {id}=req.params;
    const labor = await (await pool.query('SELECT * FROM laborvstrabajador WHERE id_traba=$1', [id])).rows;
    const labores = await (await pool.query('SELECT labor_nombre FROM labor LEFT JOIN (SELECT nombre_labor FROM laborvstrabajador WHERE trabajador_id=$1) AS laboresOf ON labor_nombre = nombre_labor WHERE nombre_labor is null',[id_trabajador])).rows;
    res.render('trabajador/editLabor', {labor: labor[0], labores});
});

router.post('/editar-labor/:id', async(req, res) => {
    const {id}=req.params;
    const {nombre_labor, precioxhora} = req.body;
    const newLabor = {nombre_labor, precioxhora};
    const laborActual = await (await pool.query('SELECT nombre_labor FROM laborvstrabajador WHERE id_traba=$1',[id])).rows;
    if(nombre_labor=='')
    {
        pool.query('UPDATE laborvstrabajador SET nombre_labor=$1, precioxhora=$2 WHERE id_traba=$3', [laborActual[0].nombre_labor, precioxhora, id]);
    }else{
        pool.query('UPDATE laborvstrabajador SET nombre_labor=$1, precioxhora=$2 WHERE id_traba=$3', [nombre_labor, precioxhora, id]);
    }
    res.redirect('/trabajador/mis-labores');
    
});

// PERFIL
router.get('/ingreso', isLoggedInEmployee, async (req, res, done) => {
    const id_trabajador = req.user.id_trabajador;
    const trabajo = await (await pool.query('SELECT trabajador_disponibilidad FROM trabajador WHERE id_trabajador=$1 AND trabajador_disponibilidad=false', [id_trabajador])).rows; 
    const rows = await (await pool.query('SELECT * FROM trabajador WHERE id_trabajador=$1', [id_trabajador])).rows;
    const employee = rows[0];
    if(trabajo.length > 0)
    {
        done(null, employee, req.flash('success','¡' + employee.trabajador_nombre + '! Tienes trabajo activo'));
    }else
    {
        done(null, employee, req.flash('success','Bienvenido ' + employee.trabajador_username));
    }
    res.redirect('/trabajador/perfil');
});

// TRABAJOS ACTIVOS
router.get('/trabajos-activos', isLoggedInEmployee, async (req, res) => {
    const id_trabajador = req.user.id_trabajador;
    const servicios = await (await pool.query('SELECT * FROM servicio JOIN (SELECT * FROM usuario) AS U ON usuario_numero=usuario_numero WHERE trabajador_id=$1 AND servicio_estado=1', [id_trabajador])).rows;
    res.render('trabajador/trabajosActivos', {servicios}); 
});

// DETALLES DE UN TRABAJO
router.get('/detalles/:id_servicio', isLoggedInEmployee, async (req, res) => {
    const {id_servicio}=req.params;
    const id_trabajador = req.user.id_trabajador;
    const servicio = await (await pool.query('SELECT * FROM servicio JOIN (SELECT * FROM usuario JOIN (SELECT * FROM direccion) AS D ON usuario_numero=id_direccion) AS S ON usuario_numero=usuario_numero WHERE id_servicio=$1', [id_servicio])).rows[0];
    const employeeUbication = await (await pool.query('SELECT direccion_latitud, direccion_longitud FROM direccion WHERE id_direccion=$1', [id_trabajador])).rows;
    res.render('trabajador/trabajoDetalles', {servicio, employeeUbication: employeeUbication[0]});
});

// CULMINAR TRABAJO
router.get('/culminar-trabajo/:id_servicio/:nombre_labor', isLoggedInEmployee, async (req, res) => {
    const {id_servicio, nombre_labor} = req.params;
    const precio = await (await pool.query('SELECT precioxhora FROM laborvstrabajador WHERE trabajador_id=$1 AND nombre_labor=$2', [req.user.id_trabajador, nombre_labor])).rows[0].precioxhora;
    const servicio = await (await pool.query ('SELECT * FROM servicio JOIN (SELECT * FROM usuario)AS U ON usuario_numero=usuario_numero WHERE id_servicio=$1', [id_servicio])).rows[0];
    res.render('trabajador/trabajoTerminar', {servicio: servicio, precio: precio});
});

router.post('/culminar-trabajo/:id_servicio/:nombre_labor', async (req, res, done) => {
    const {id_servicio} = req.params;
    const {pago_valor} = req.body;
    await pool.query('UPDATE servicio SET servicio_estado=2, servicio_final=CURRENT_TIMESTAMP WHERE id_servicio=$1', [id_servicio]);
    await pool.query('UPDATE trabajador SET trabajador_disponibilidad=true WHERE id_trabajador=$1', [req.user.id_trabajador]);
    await pool.query('INSERT INTO pago(servicio_id, pago_valor) VALUES ($1, $2)', [id_servicio, pago_valor]);
    done(null, req.flash('success','El trabajo se culminó con éxito!'));
    res.redirect('/trabajador/trabajos-activos');
});

// TRABAJOS PENDIENTES DE PAGO
router.get('/trabajos-pendientes', isLoggedInEmployee, async (req, res) => {
    const id_trabajador = req.user.id_trabajador;
    const servicios = await (await pool.query('SELECT * FROM usuario JOIN (SELECT * FROM servicio JOIN (SELECT * FROM pago) AS P ON id_servicio=servicio_id) AS S ON usuario_numero=usuario_numero WHERE trabajador_id=$1 AND servicio_estado=2', [id_trabajador])).rows;
    res.render('trabajador/trabajosPendientes', {servicios}); 
});

//HISTORIAL DE TRABAJOS
router.get('/trabajos-historial', isLoggedInEmployee, async (req, res) => {
    const id_trabajador = req.user.id_trabajador;
    const servicios = await (await pool.query('SELECT * FROM usuario JOIN (SELECT * FROM servicio JOIN (SELECT * FROM pago) AS P ON id_servicio=servicio_id) AS S ON usuario_numero=usuario_numero WHERE trabajador_id=$1 AND servicio_estado=3', [id_trabajador])).rows;
    res.render('trabajador/trabajosHistorial', {servicios}); 
});

// PERFIL 
router.get('/perfil', isLoggedInEmployee, async (req, res) => {
    const employee = await (await pool.query('SELECT * FROM trabajador JOIN (SELECT * FROM direccion) AS D ON id_trabajador=id_direccion WHERE id_trabajador=$1', [req.user.id_trabajador])).rows[0];
    console.log(employee);
    res.render('trabajador/perfil', { employee });
});

router.post('/perfil', async (req, res, done) => {
    /*const id_usuario = req.user.id_usuario;
    const { usuario_nombre, usuario_direccion, usuario_localidad, usuario_latitud, usuario_longitud, usuario_recibo, usuario_email, usuario_numero, usuario_username, usuario_password, usuario_numCard } = req.body;
    const newUser = {usuario_nombre, usuario_direccion, usuario_localidad, usuario_latitud, usuario_longitud, usuario_recibo, usuario_email, usuario_numero, usuario_username, usuario_password, usuario_numCard};
    newUser.usuario_numCard = await helpers.encryptNumCard(usuario_numCard);
    console.log(usuario_nombre, usuario_direccion, usuario_localidad, usuario_latitud, usuario_longitud, usuario_recibo, usuario_email, usuario_numero, usuario_username, usuario_password, usuario_numCard);
    await pool.query('UPDATE usuario SET usuario_nombre=$1, usuario_email=$2, usuario_numero=$3, usuario_username=$4, usuario_password=$5, usuario_numcard=$6, usuario_recibo=$7 WHERE id_usuario=$8', [usuario_nombre, usuario_email, usuario_numero, usuario_username, usuario_password, newUser.usuario_numCard, usuario_recibo, id_usuario]);
    await pool.query('UPDATE direccion SET direccion_address=$1, direccion_localidad=$2, direccion_latitud=$3, direccion_longitud=$4 WHERE id_direccion=$5', [usuario_direccion, usuario_localidad, usuario_latitud, usuario_longitud, id_usuario]);
    done(null, req.flash('success', 'Edición exitosa!'));
    res.redirect('/usuario/perfil');*/
});

// CERRAR SESIÓN
router.get('/cerrar-sesion', isLoggedInEmployee, (req, res) => {
    req.logOut();
    res.redirect('/');
});

module.exports = router;