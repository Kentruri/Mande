const express = require('express');
const router = express.Router();

const passport = require('passport');

const pool = require('../database');

router.get('/registro', (req, res)=>
{
    res.render('usuario/registro');
});

router.post('registro', passport.authenticate('usuario.signup', 
{
    successRedirect: '/perfil',
    failureRedirect: '/registro',
    failureFlash: true
}))

router.get('/perfil', async(req, res) =>
{
    res.send('hey');
});

router.get('/', async (req, res)=>
{
    const users = await pool.query('SELECT * FROM usuario')
    console.log(users);
    res.send('perejil');    
});

module.exports = router;