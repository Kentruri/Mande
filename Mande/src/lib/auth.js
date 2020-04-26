module.exports = {

    //AUTENTICAR LA SESIÓN DE UN TRABAJADOR

    isLoggedInEmployee(req, res, next){
        if(req.isAuthenticated()){
            return next();
        }
        return res.redirect('/trabajador/inicio-sesion');
    },

    isNotLoggedInEmployee(req, res, next){
        if(!req.isAuthenticated()){
            return next();
        }
        return res.redirect('/trabajador/perfil');
    },


    //AUTENTICAR SESIÓN DE UN USUARIO

    isLoggedInUser(req, res, next){
        if(req.isAuthenticated()){
            return next();
        }
        return res.redirect('usuario/inicio-sesion');
    },

    isNotLoggedInUser(req, res, next){
        if(!req.isAuthenticated()){
            return next();
        }
        return res.redirect('/usuario/perfil');
    }
};