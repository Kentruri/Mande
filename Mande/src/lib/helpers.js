const bcrypt = require('bcryptjs');
const helpers = {};

helpers.encryptNumCard = async (numCard) =>
{
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(numCard, salt);
    return hash;
};

helpers.matchNumCard = async(numCard, savedNum) =>
{
    await bcrypt.compare(numCard, savedNum);
}

module.exports = helpers;