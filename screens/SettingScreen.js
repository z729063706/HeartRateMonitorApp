import React, { useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import bluetoothManager from './BluetoothManager';

const SettingScreen = () => {
  const [publicKey, setPublicKey] = useState(null);

  const getCert = async () => {
    if (bluetoothManager.connectedDevice) {
      const deviceName = bluetoothManager.connectedDevice.name;
      const deviceIdMatch = deviceName.match(/HeartMoniter-(\d{4})/);
      if (deviceIdMatch) {
        const deviceId = deviceIdMatch[1];
        try {
          const response = await fetch(`https://iomt.6barlow.place/get_public_key?device_id=${deviceId}`);
          const data = await response.json();
          setPublicKey(data['public_key']);
          bluetoothManager.setPublicKey(data['public_key']);
          Alert.alert('Success', 'Public key retrieved successfully');
        } catch (error) {
          console.error('Failed to fetch public key', error);
          Alert.alert('Error', 'Failed to retrieve public key');
        }
      } else {
        Alert.alert('Error', 'Invalid device name format');
      }
    } else {
      Alert.alert('Error', 'No connected device found');
    }
  };

  const pufCheck = async () => {
    if (!publicKey) {
      Alert.alert('Error', 'No public key found');
      return;
    }

    // 获取当前时间戳，精确到秒
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const message = `00:${timestamp.padStart(10, '0')}`;

    try {
      await bluetoothManager.sendMessage(message, publicKey);
      Alert.alert('Success', 'PUF check message sent');
    } catch (error) {
      console.error('Failed to encrypt and send message', error);
      Alert.alert('Error', 'Failed to send PUF check message');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>PUF TEST</Text>
      <Button title="GET CERT" onPress={getCert} />
      <View style={{ marginTop: 20 }}>
        <Button title="PUF CHECK" onPress={pufCheck} disabled={!publicKey} />
      </View>
      {publicKey && (
        <View style={{ marginTop: 20 }}>
          <Text>Public Key:</Text>
          <Text>{JSON.stringify(publicKey, null, 2)}</Text>
        </View>
      )}
    </View>
  );
};

export default SettingScreen;
