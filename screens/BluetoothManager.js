import { NativeEventEmitter, NativeModules, Platform, PermissionsAndroid, Alert } from 'react-native';
import BleManager from 'react-native-ble-manager';
import { RSA } from 'react-native-rsa-native';
import { Buffer } from 'buffer';
import { EventEmitter } from 'events';

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

class BluetoothManager extends EventEmitter {
  constructor() {
    super();
    this.devices = [];
    this.connectedDevice = null;
    this.characteristic = null;
    this.accumulatedData = '';
    this.publicKey = null;
    BleManager.start({ showAlert: false });

    bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', this.handleDiscoverPeripheral.bind(this));
    bleManagerEmitter.addListener('BleManagerStopScan', this.handleStopScan.bind(this));
    bleManagerEmitter.addListener('BleManagerConnectPeripheral', this.handleConnectPeripheral.bind(this));
    bleManagerEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', this.handleUpdateValueForCharacteristic.bind(this));
  }

  async requestPermissions() {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);

      return granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
             granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
             granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  }

  handleDiscoverPeripheral(peripheral) {
    const deviceName = peripheral.name || peripheral.localName;
    if (deviceName && /^HeartMoniter-\d{4}$/.test(deviceName)) {
      console.log('Discovered peripheral', peripheral);
      if (!this.devices.find((d) => d.id === peripheral.id)) {
        this.devices.push(peripheral);
      }
    }
  }

  handleStopScan() {
    console.log('Scan stopped');
  }

  async handleConnectPeripheral(peripheral) {
    console.log('Connected to', peripheral);
    this.connectedDevice = peripheral;

    const peripheralInfo = await BleManager.retrieveServices(peripheral.id);
    console.log('Peripheral info:', peripheralInfo);

    peripheralInfo.characteristics.forEach((char) => {
      if (char.properties.Write) {
        this.characteristic = char;
      }
      if (char.properties.Read || char.properties.Notify) {
        BleManager.startNotification(peripheral.id, char.service, char.characteristic)
          .then(() => {
            console.log('Notification started for', char.characteristic);
          })
          .catch((error) => {
            console.error('Notification error', error);
          });
      }
    });
  }

handleUpdateValueForCharacteristic(data) {
  const buffer = Buffer.from(data.value);
  const message = buffer.toString();
  console.log('Received message:', message);

  this.accumulatedData += message;

  try {
    // 尝试解析累积的数据
    const jsonMessage = JSON.parse(this.accumulatedData);
    console.log('Parsed JSON message:', jsonMessage);

    // 解析成功后，清除累积的数据
    this.accumulatedData = '';

    // 处理你的 JSON 消息
    this.emit('data', jsonMessage);
  } catch (error) {
    // 如果解析失败，不清除累积的数据，继续累积
  }
}

  async scanForDevices() {
    console.log('Scanning for devices...');
    const permissionsGranted = await this.requestPermissions();
    if (!permissionsGranted) {
      console.warn('Permissions not granted');
      return;
    }

    this.devices = [];
    await BleManager.scan([], 5, true);
    console.log('Scan started');
  }

  async connectToDevice(device) {
    console.log(`Connecting to device ${device.name}`);
    try {
      await BleManager.connect(device.id);
      console.log(`Connected to ${device.name}`);
      await this.handleConnectPeripheral(device);
    } catch (error) {
      console.error('Connection error', error);
      Alert.alert('Connection failed', `Failed to connect to ${device.name}`);
    }
  }

  async sendMessage(message, publicKey = this.publicKey) {
    if (this.characteristic && this.connectedDevice) {
      try {
        const encryptedMessage = await RSA.encrypt(message, publicKey);
        console.log('Encrypted Message:', encryptedMessage);
        const data = Buffer.from(encryptedMessage);
        const lengthBytes = Buffer.alloc(4);
        lengthBytes.writeUInt32BE(data.length, 0);
        const fullData = Buffer.concat([lengthBytes, data]);

        await BleManager.write(this.connectedDevice.id, this.characteristic.service, this.characteristic.characteristic, fullData.toJSON().data);
        console.log(`Sent "${message}" to the device`);
      } catch (error) {
        console.error('Failed to send message', error);
      }
    } else {
      console.warn('No writable characteristic found');
    }
  }

  setPublicKey(publicKey) {
    this.publicKey = publicKey;
  }
}


const bluetoothManager = new BluetoothManager();
export default bluetoothManager;
