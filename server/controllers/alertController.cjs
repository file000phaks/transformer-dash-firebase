const fs = require("fs");
const path = require("path");

const readFile = (dataPath) => {

    const filePath = path.join(__dirname, `../data/${dataPath}`);

    if (!fs.existsSync(filePath)) return [];

    const data = fs.readFileSync(filePath);

    return JSON.parse(data);

}

const getAlerts = (req, res) => {

    res.json([{}])

}

module.exports = {
    getAlerts
}
