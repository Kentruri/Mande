module.exports = {

    //AUTENTICAR SI HAY UNA SESION ABIERTA DEL TIPO TRABAJADOR
    isLoggedInEmployee(req, res, next){
        if(req.isAuthenticated()){
            return next();
        }
        return res.redirect('/trabajador/inicio-sesion');
    },

    //AUTENTICA QUE NO HAYA UNA SESION ABIERTA DEL TIPO TRABAJADOR
    isNotLoggedInEmployee(req, res, next){
        if(!req.isAuthenticated()){
            return next();
        }
        return res.redirect('/trabajador/perfil');
    },

    //AUTENTICAR SI HAY UNA SESION ABIERTA DEL TIPO USUARIO
    isLoggedInUser(req, res, next){
        if(req.isAuthenticated()){
            return next();
        }
        return res.redirect('/usuario/inicio-sesion');
    },

    //AUTENTICA QUE NO HAYA UNA SESION ABIERTA DEL TIPO USUARIO
    isNotLoggedInUser(req, res, next){
        if(!req.isAuthenticated()){
            return next();
        }
        return res.redirect('/usuario/perfil');
    }
};