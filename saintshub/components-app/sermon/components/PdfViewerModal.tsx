// PATH: saintshub\app\(app)\components\sermon\components\PdfViewerModal.tsx
import React, { useMemo } from 'react';
import { Modal, View as RNView, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import PDFReader from 'rn-pdf-reader-js';
import { DAILY_SCRIPTURE_AND_QUOTE_URI } from '../../../../../utilities/tools';
import { Appbar, Text, useTheme, IconButton } from 'react-native-paper';
import { Sermon } from '../../sermon-new/types';


interface PdfViewerModalProps {
  visible: boolean;
  onClose: () => void;
  sermon: Sermon | null;
  title?: string; // Optional title for the modal header
}

const PdfViewerModal: React.FC<PdfViewerModalProps> = ({ 
  visible, 
  onClose, 
  sermon, 
  title = "Sermon Document" 
}) => {
  const theme = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background, // Added theme background
    },
    pdfReader: {
      flex: 1,
      width: '100%',
      height: '100%',
    },
    centeredMessageContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: theme.colors.background, // Added theme background
    },
    errorMessageText: { // Added for styling the error message
        color: theme.colors.error,
    }
  }), [theme]);

  const serverProxiedPdfUrl = useMemo(() => {
    if (!sermon?.pdfUrl) return '';
    return `https://saints-hub-pdf-proxy.vercel.app/api/pdf-proxy?url=${encodeURIComponent(sermon.pdfUrl)}`;
  }, [sermon?.pdfUrl]);

  const pdfSource = useMemo(() => ({
    uri: serverProxiedPdfUrl,
  }), [serverProxiedPdfUrl]);

  return (
    <Modal
      animationType="slide"
      transparent={false} // Full screen modal
      visible={visible}
      onRequestClose={onClose} // For Android back button
    >
      <SafeAreaView style={styles.safeArea}>
        <Appbar.Header 
          style={{ backgroundColor: theme.colors.elevation.level2 }} // Use theme surface color
          statusBarHeight={0} // Assume SafeAreaView handles status bar padding
        >
          <Appbar.Content title={title} titleStyle={{ color: theme.colors.onSurface }} />
          <Appbar.Action icon="close" onPress={onClose} color={theme.colors.onSurface} />
        </Appbar.Header>
        {serverProxiedPdfUrl ? (
          <PDFReader
            source={pdfSource}
            withPinchZoom={true}
            style={styles.pdfReader}
          />
        ) : (
          <RNView style={styles.centeredMessageContainer}>
            <Text style={styles.errorMessageText}>Invalid PDF URL provided.</Text>
          </RNView>
        )}
      </SafeAreaView>
    </Modal>
  );
};

export default React.memo(PdfViewerModal);
