const express = require('express');
const router = express.Router();
const passport = require('passport');
const pool = require('../database');

router.get('/registro', (req, res)=>
{
    res.render('trabajador/registro');
});

router.get('/addLabor/', async (req, res)=> 
{
    const id=req.params.id_trabajador;
    const labores = await (await pool.query('SELECT * FROM labor')).rows;
    res.render('trabajador/labor', {labores});
});

router.post('/addLabor/:id_trabajador', async (req, res)=>
{

});

router.post('/registro', passport.authenticate('trabajador.signup', {
    successRedirect: '/profile',
    failureRedirect: '/registro',
    failureFlash: true
}))

router.get('/profile', (req, res)=>
{
    res.send('this is your profile');
})

router.get('/labores', async (req, res) =>
{
    const labores = await (await pool.query('SELECT * FROM labor')).rows;
    console.log(labores);
    //res.send('hodi');
    res.render('trabajador/lista-labores', {labores});
});

module.exports = router;