import React, { useState, useEffect } from 'react';
import { View, Text, Button } from 'react-native';
import bluetoothManager from './BluetoothManager';

const DataScreen = () => {
  const [realTimeData, setRealTimeData] = useState(null);
  const [timestamp, setTimestamp] = useState(0);
  const [dataEntries, setDataEntries] = useState([]);

  useEffect(() => {
    const handleData = (jsonMessage) => {
      if (jsonMessage.msgType === 1) {
        setRealTimeData(jsonMessage);
      }
      else if (jsonMessage.msgType === 2) {
        setTimestamp(jsonMessage.timestamp);
        setDataEntries((prevEntries) => [...prevEntries, jsonMessage]);
      }
    };

    bluetoothManager.on('data', handleData);
    return () => {
      bluetoothManager.off('data', handleData);
    };
  }, []);

  const convertToCSV = (objArray) => {
    const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
    let str = '';
  
    const keys = Object.keys(array[0]);
    str += keys.join(',') + '\r\n';
  
    for (let i = 0; i < array.length; i++) {
      let line = '';
      for (let index in array[i]) {
        if (line !== '') line += ',';
        line += array[i][index];
      }
      str += line + '\r\n';
    }
  
    return str;
  };

  const handleSyncOldData = () => {
    console.log('Syncing old data...');
    console.log('Timestamp:', timestamp);
    bluetoothManager.sendMessage(`01:${timestamp}`);
  };

  const handleSendDataToServer = () => {
    console.log('Sending data to server...');
    const csvData = convertToCSV(dataEntries);
    console.log(csvData);
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {realTimeData ? (
        <View>
          <Text>Heart Rate: {realTimeData.heartRate}</Text>
          <Text>SpO2: {realTimeData.SpO2}</Text>
          <Text>Timestamp: {realTimeData.timestamp}</Text>
        </View>
      ) : (
        <Text>Waiting for real-time data...</Text>
      )}
      {dataEntries.length > 0 ? (
        <View>
          <Text>Data count:{dataEntries.length}</Text>
        </View>
      ) : (
        <Text>No data to display</Text>
      )}
      <View style={{ marginTop: 20 }}>
        <Button title="SYNC OLD DATA" onPress={handleSyncOldData} /> 
      </View>
      <View style={{ marginTop: 20 }}>
        <Button title="SEND DATA TO SERVER" onPress={handleSendDataToServer} />
      </View>
    </View>
  );
};

export default DataScreen;
