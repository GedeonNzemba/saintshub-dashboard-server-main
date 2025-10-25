import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions } from 'react-native';

interface AlertPopupProps {
  visible: boolean;
  message: string;
  onClose: () => void;
}

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

const AlertPopup: React.FC<AlertPopupProps> = ({ visible, message, onClose }) => {
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View style={styles.popup}>
          <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
            <Text style={styles.closeIconText}>×</Text>
          </TouchableOpacity>
          
          <Text style={styles.message}>{message}</Text>
          
          <TouchableOpacity 
            style={styles.button}
            activeOpacity={0.7}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: windowWidth,
    height: windowHeight,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popup: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: windowWidth * 0.85,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  closeIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
    backgroundColor: '#030303',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeIconText: {
    color: 'white',
    fontSize: 24,
    lineHeight: 24,
    textAlign: 'center',
    fontFamily: 'Roboto',
  },
  message: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 32,
    marginBottom: 32,
    fontFamily: 'RobotoRegular',
    color: '#333',
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#030303',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignSelf: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'RobotoMedium',
    letterSpacing: 0.5,
  },
});

export default AlertPopup; 