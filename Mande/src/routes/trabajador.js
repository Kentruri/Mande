const express = require('express');
const router = express.Router();
const passport = require('passport');
const pool = require('../database');

// REGISTER
router.get('/registro', (req, res) => {
    res.render('trabajador/registro');
});

router.post('/registro', passport.authenticate('trabajador.signup',
    {
        successRedirect: '/trabajador/inicio-sesion',
        failureRedirect: '/trabajador/registro',
        failureFlash: true
    }))

// SIGN-IN
router.get('/inicio-sesion', (req, res) => {
    res.render('trabajador/inicio');
});

router.post('/inicio-sesion', (req, res, next) => {
    passport.authenticate('trabajador_signin',
        {
            successRedirect: '/trabajador/addLabor',
            failureRedirect: '/trabajador/inicio-sesion',
            failureFlash: true
        })(req, res, next);
});

// ADD LABOR
router.get('/addLabor', async (req, res) => {
    const id_trabajador = req.user.id_trabajador;
    //console.log(id_trabajador);
    //await pool.query('CREATE VIEW $1 AS SELECT nombre_labor FROM laborvstrabajador WHERE trabajador_id=$2',[id_trabajador, id_trabajador]);
    const labores = await (await pool.query('SELECT labor_nombre FROM labor LEFT JOIN (SELECT nombre_labor FROM laborvstrabajador WHERE trabajador_id=$1) AS laboresOf ON labor_nombre = nombre_labor WHERE nombre_labor is null',[id_trabajador])).rows;
    //const labores = await (await pool.query('SELECT * FROM labor')).rows;
    res.render('trabajador/addLabor', { labores });
});

router.post('/addLabor', async (req, res) => {
    console.log(req.body);
    /*const id_trabajador = req.user.id_trabajador;
    const {id_trabajador, nombre_labor, precioxhora} = req.body;*/
});

router.get('/perfil', (req, res) => {
    res.send('this is your profile');
});

router.get('/labores', async (req, res) => {
    await pool.query('')
    const labores = await (await pool.query('SELECT labor_nombre FROM labor LEFT JOIN laborvstrabajador ON labor_nombre = nombre_labor WHERE nombre_labor =$1')).rows;
    console.log(labores);
    //res.send('hodi');
    res.render('trabajador/lista-labores', { labores });
});


module.exports = router;