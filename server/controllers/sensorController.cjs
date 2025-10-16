const fs = require("fs");
const path = require("path");

const readFile = (dataPath) => {

    const filePath = path.join(__dirname, `../data/${dataPath}`);

    if (!fs.existsSync(filePath)) return [];

    const data = fs.readFileSync(filePath);

    return JSON.parse(data);

}

const getSensorData = (req, res) => {

    const sensorData = readFile("sensor-data.json");

    res.json({ data: sensorData });

}

const getSensorDataFor = (req, res) => {

    const id = req.params.id;

    const sensorData = readFile("sensor-data.json");

    res.json({ data: sensorData });

}

const getSensorsUsed = (req, res) => {

    const sensors = readFile("sensors.json");

    res.json({ data: sensors });

}

module.exports = {
    getSensorData,
    getSensorsUsed,
    getSensorDataFor
}