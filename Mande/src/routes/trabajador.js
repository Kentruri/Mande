const express = require('express');
const router = express.Router();
const passport = require('passport');
const pool = require('../database');

// REGISTRO
router.get('/registro', (req, res) => {
    res.render('trabajador/registro');
});

router.post('/registro', passport.authenticate('trabajador.signup',
    {
        successRedirect: '/trabajador/addLabor',
        failureRedirect: '/trabajador/registro',
        failureFlash: true
    }))

// INCIO DE SESIÓN
router.get('/inicio-sesion', (req, res) => {
    res.render('trabajador/inicio');
});

router.post('/inicio-sesion', (req, res, next) => {
    passport.authenticate('trabajador_signin',
        {
            successRedirect: '/trabajador/perfil',
            failureRedirect: '/trabajador/inicio-sesion',
            failureFlash: true
        })(req, res, next);
});

// AÑADIR LABOR
router.get('/addLabor', async (req, res) => {
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
router.get('/mis-labores', async (req, res) => {
    const id_trabajador = req.user.id_trabajador;
    const labores = await (await pool.query('SELECT * FROM laborvstrabajador WHERE trabajador_id=$1', [id_trabajador])).rows;
    console.log(labores);
    res.render('trabajador/misLabores', { labores });
});

// BORAR LABOR
router.get('/borrar-labor/:id', async(req, res) => {
    const {id}=req.params;
    await pool.query('DELETE FROM laborvstrabajador WHERE id_traba=$1', [id]);
    res.redirect('/trabajador/mis-labores')
});

// EDITAR LABOR
router.get('/editar-labor/:id', async(req, res) => {
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
router.get('/perfil', async (req, res, done) => {
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
    res.redirect('/trabajador/mis-labores');
});

// TRABAJOS ACTIVOS
router.get('/trabajos-activos', async (req, res) => {
    const id_trabajador = req.user.id_trabajador;
    const servicios = await (await pool.query('SELECT * FROM servicio WHERE trabajador_id=$1 AND servicio_estado=1', [id_trabajador])).rows;
    res.render('trabajador/trabajosActivos', {servicios}); 
});

// DETALLES DE UN TRABAJO
router.get('/detalles/:id_servicio', async (req, res) => {
    const {id_servicio}=req.params;
    const id_trabajador = req.user.id_trabajador;
    const servicio = await (await pool.query('SELECT * FROM usuario JOIN (SELECT * FROM servicio WHERE id_servicio=$1) AS S ON numero_usuario=usuario_numero;', [id_servicio])).rows[0];
    const employeeUbication = await (await pool.query('SELECT trabajador_latitud, trabajador_longitud FROM trabajador WHERE id_trabajador=$1', [id_trabajador])).rows;
    res.render('trabajador/trabajoDetalles', {servicio, employeeUbication: employeeUbication[0]});
});

// CULMINAR TRABAJO
router.get('/culminar-trabajo/:id_servicio/:nombre_labor', async (req, res) => {
    const {id_servicio, nombre_labor} = req.params;
    const precio = await (await pool.query('SELECT precioxhora FROM laborvstrabajador WHERE trabajador_id=$1 AND nombre_labor=$2', [req.user.id_trabajador, nombre_labor])).rows[0].precioxhora;
    const servicio = await (await pool.query ('SELECT * FROM servicio WHERE id_servicio=$1', [id_servicio])).rows[0];
    res.render('trabajador/trabajoTerminar', {servicio: servicio, precio: precio});
});

router.post('/culminar-trabajo/:id_servicio/:nombre_labor', async (req, res) => {
    const {id_servicio} = req.params;
    const {pago_valor} = req.body;
    await pool.query('UPDATE servicio SET servicio_estado=2 WHERE id_servicio=$1', [id_servicio]);
    await pool.query('UPDATE trabajador SET trabajador_disponibilidad=true WHERE id_trabajador=$1', [req.user.id_trabajador]);
    await pool.query('INSERT INTO pago(servicio_id, pago_valor) VALUES ($1, $2)', [id_servicio, pago_valor]);
    res.redirect('/trabajador/trabajos-activos');
});

module.exports = router;