import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native'; // 引入 useNavigation 钩子

import bluetoothManager from './BluetoothManager';

const PairScreen = () => {
  const [devices, setDevices] = useState([]);
  const navigation = useNavigation(); // 获取导航对象


  useEffect(() => {
    bluetoothManager.requestPermissions();

    const updateDevices = () => {
      setDevices([...bluetoothManager.devices]);
    };

    bluetoothManager.scanForDevices();
    const interval = setInterval(updateDevices, 1000); // 每秒更新一次设备列表

    return () => clearInterval(interval);
  }, []);

  const connectToDevice = (device) => {
    bluetoothManager.connectToDevice(device);
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Pair</Text>
      <Button title="Search Devices" onPress={() => bluetoothManager.scanForDevices()} />
      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => connectToDevice(item)}>
            <View style={{ padding: 10, margin: 5, backgroundColor: '#ddd', borderRadius: 5 }}>
              <Text>{item.name || 'Unknown Device'} {item.id}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
      {bluetoothManager.connectedDevice && (
        <View style={{ marginTop: 20 }}>
          <Text>Connected to {bluetoothManager.connectedDevice.name || 'Unknown Device'}</Text>
          <Button title="Connction Test" onPress={() => navigation.navigate('Setting')} />
        </View>
      )}
    </View>
  );
};

export default PairScreen;
