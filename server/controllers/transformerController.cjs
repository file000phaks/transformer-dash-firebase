const fs = require("fs");
const path = require("path");

const readFile = (dataPath) => {

    const filePath = path.join(__dirname, `../data/${dataPath}`);

    if (!fs.existsSync(filePath)) return [];

    const data = fs.readFileSync(filePath);

    return JSON.parse(data);

}

const dataFile = "transformers.json";

const getAllTransformers = (req, res) => {

    const transformers = readFile(dataFile);

    res.json({ data: transformers });

};

const getTransformerById = (req, res) => {

    const { id } = req.params;

    const transformers = readFile(dataFile);

    const transformer = transformers.find(t => String(t.id) === String(id));

    res.json({ data: transformer });

}

const getTransformerByName = (req, res) => {

    const { name } = req.params;

    const transformers = readFile(dataFile);

    const transformer = transformers.find(t => t.name === name)

    res.json({ data: transformer });

}

module.exports = {
    getTransformerById,
    getTransformerByName,
    getAllTransformers
}