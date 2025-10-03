import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNetwork } from '../contexts/NetworkContext';

const NetworkTest: React.FC = () => {
  const { isConnected, isInternetReachable, connectionType, isOffline } = useNetwork();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Network Status Test</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.label}>Connected:</Text>
        <Text style={[styles.value, { color: isConnected ? 'green' : 'red' }]}>
          {isConnected ? 'Yes' : 'No'}
        </Text>
        
        <Text style={styles.label}>Internet Reachable:</Text>
        <Text style={[styles.value, { color: isInternetReachable ? 'green' : 'red' }]}>
          {isInternetReachable === null ? 'Unknown' : isInternetReachable ? 'Yes' : 'No'}
        </Text>
        
        <Text style={styles.label}>Connection Type:</Text>
        <Text style={styles.value}>{connectionType || 'Unknown'}</Text>
        
        <Text style={styles.label}>Offline Mode:</Text>
        <Text style={[styles.value, { color: isOffline ? 'red' : 'green' }]}>
          {isOffline ? 'Yes' : 'No'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  statusContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
  },
  value: {
    fontSize: 14,
    marginLeft: 10,
  },
});

export default NetworkTest;
