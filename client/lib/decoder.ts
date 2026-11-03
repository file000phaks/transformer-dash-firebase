// --- Decoder Function (No changes needed here for error handling) ---
export function decodeUC100(hexString: string) {
  if (!hexString || typeof hexString !== "string") {
    return {
      transf_temperature: null, cabinetTemp: null, cabinetHumidity: null,
      doorSensor: null, pirSensor: null, oilLevelSensor: null,
      vibrationSensor: null, currentSensor: null, voltSensor: null,
    };
  }

  const bytes: number[] = [];
  for (let i = 0; i < hexString.length; i += 2) {
    bytes.push(parseInt(hexString.substr(i, 2), 16));
  }

  const sensors: Record<string, number | null> = {
    transf_temperature: null, cabinetTemp: null, cabinetHumidity: null,
    doorSensor: null, pirSensor: null, oilLevelSensor: null,
    vibrationSensor: null, currentSensor: null, voltSensor: null,
  };

  for (let i = 0; i < bytes.length; i += 6) {
    const offset = bytes[i + 2];
    const value = bytes[i + 4] | (bytes[i + 5] << 8);

    switch (offset) {
      case 0x00: sensors.transf_temperature = value / 10; break;
      case 0x01: sensors.cabinetTemp = value / 10; break;
      case 0x02: sensors.cabinetHumidity = value / 10; break;
      case 0x03: sensors.doorSensor = value > 0 ? 1 : 0; break;
      case 0x04: sensors.pirSensor = value > 0 ? 1 : 0; break;
      case 0x05: sensors.oilLevelSensor = value > 0 ? 1 : 0; break;
      case 0x06: sensors.vibrationSensor = value > 0 ? 1 : 0; break;
      case 0x07: sensors.currentSensor = value > 0 ? 1 : 0; break;
      case 0x08: sensors.voltSensor = value / 10; break;
      default: break;
    }
  }
  return sensors;
}
