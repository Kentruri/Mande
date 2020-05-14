const bcrypt = require('bcryptjs');
const helpers = {};

// Retorna la contraseña encriptada
helpers.encryptPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    return hash;
};

// Verifica si la contraseña
helpers.matchPassword = async (password, saved) => {
    try {
        return await bcrypt.compare(password, saved);
    } catch (error) {
        console.log(error);
    }
};

// Calcula la distancia entre un usuario y un trabajador
helpers.calcularDistancia = function (latT, lonT, latU, lonU) {

    rad = function (x) { return x * Math.PI / 180; }

    var R = 6378.137; //Radio de la tierra en km's
    var dLat = rad(latT - latU);
    var dLong = rad(lonT - lonU);

    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(rad(latU)) * Math.cos(rad(latT)) * Math.sin(dLong / 2) * Math.sin(dLong / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;

    return d.toFixed(1);
};

// Retorna una fecha en un formato más legible
helpers.formatearFecha = function (str) {
    var date = new Date(str),
        mnth = ("0" + (date.getMonth() + 1)).slice(-2),
        day = ("0" + date.getDate()).slice(-2);
    hor = ("0" + date.getHours()).slice(-2);
    min = ("0" + date.getMinutes()).slice(-2);
    return [day, "-", mnth, "-", date.getFullYear(), " a las ", hor, ":", min].join("");
};

//Retorna un valor con sus milesimas marcadas
helpers.formatearPrecio = function format(number) {
    price = new Intl.NumberFormat().format(number);
    return price;
};

module.exports = helpers;