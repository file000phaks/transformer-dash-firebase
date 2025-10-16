export const sensors = [
    {
        "name": "DHT22",
        "desc": "Temperature and humidity sensor for ambient monitoring."
    },
    {
        "name": "Oil Level Sensor",
        "desc": "Measures transformer oil level to ensure cooling efficiency."
    },
    {
        "name": "Current & Voltage Sensor",
        "desc": "Monitors load and supply quality."
    },
    {
        "name": "Vibration Sensor",
        "desc": "Detects abnormal vibrations indicating faults or tampering."
    },
    {
        "name": "Reed Switch",
        "desc": "Door open/close detection for enclosures."
    },
    {
        "name": "PIR Motion Sensor",
        "desc": "Intruder motion detection near equipment."
    }
]

export const firebaseToLocalMap = {

    cabinetHumidity: "cab_humidity",
    cabinetTemp: "cab_temperature",
    currentSensor: "current",
    doorSensor: "door",
    oilLevelSensor: "oil",
    pirSensor: "intruder",
    transf_temperature: "trans_temperature",
    //   ts: number,
    vibrationSensor: "vibration",
    voltSensor: "voltage",

}

export const localToFirebaseMap = {

    "cab_humidity": "cabinetHumidity",
    "cab_temperature": "cabinetTemp",
    "current": "currentSensor",
    "door": "doorSensor",
    "oil": "oilLevelSensor",
    "intruder": "pirSensor",
    "trans_temperature": "transf_temperature",
    //   ts number,
    "vibration": "vibrationSensor",
    "voltage": "voltSensor",

}

export const sensorSchema = [
    {
        "key": "trans_temperature",
        "label": "Transformer Temp",
        "unit": "°C",
        "icon": "Thermometer",
        "kind": "number",
        "min": 35,
        "max": 95,
        "normal": [
            40,
            80
        ]
    },
    {
        "key": "cab_temperature",
        "label": "Cabinet Temp",
        "unit": "°C",
        "icon": "Thermometer",
        "kind": "number",
        "min": 35,
        "max": 95,
        "normal": [
            40,
            80
        ]
    },
    {
        "key": "cab_humidity",
        "label": "Humidity",
        "unit": "%",
        "icon": "Droplets",
        "kind": "number",
        "min": 10,
        "max": 95,
        "normal": [
            20,
            70
        ]
    },
    {
        "key": "vibration",
        "label": "Vibration",
        "unit": "mm/s",
        "icon": "Waves",
        "kind": "number",
        "min": 0,
        "max": 25,
        "normal": [
            0,
            8
        ]
    },
    {
        "key": "oil",
        "label": "Oil Level",
        "unit": "%",
        "icon": "Activity",
        "kind": "number",
        "min": 40,
        "max": 100,
        "normal": [
            60,
            100
        ]
    },
    {
        "key": "voltage",
        "label": "Voltage",
        "unit": "V",
        "icon": "Zap",
        "kind": "number",
        "min": 180,
        "max": 260,
        "normal": [
            210,
            240
        ]
    },
    {
        "key": "current",
        "label": "Current",
        "unit": "A",
        "icon": "Zap",
        "kind": "number",
        "min": 0,
        "max": 250,
        "normal": [
            5,
            120
        ]
    },
    {
        "key": "door",
        "label": "Door",
        "icon": "BellRing",
        "kind": "boolean"
    },
    {
        "key": "intruder",
        "label": "PIR Motion",
        "icon": "ShieldAlert",
        "kind": "boolean"
    }
]