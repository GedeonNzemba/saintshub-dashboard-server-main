// PATH:  saintshub\app\(app)\components\sermon-new\components\common\PdfViewer.tsx
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Dimensions, Platform, TouchableOpacity, Linking, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import WebView from 'react-native-webview';
import { WebViewMessageEvent } from 'react-native-webview/lib/WebViewTypes';
// TODO: Install rn-pdf-reader-js package
// import PDFReader from "rn-pdf-reader-js";
import { DAILY_SCRIPTURE_AND_QUOTE_URI } from '../../../../../../utilities/tools';

// Simple interface for WebView error event
interface WebViewErrorEventData {
  nativeEvent: {
    code?: string;
    description?: string;
    url?: string;
  };
}

interface PdfViewerProps {
  pdfUrl: string;
  title?: string;
  author?: string;
  date?: string;
  style?: any;
  isDarkMode?: boolean;
  onLoadComplete?: () => void;
  onError?: (error: string) => void;
}

const PdfViewer: React.FC<PdfViewerProps> = ({
  pdfUrl,
  title,
  author,
  date,
  style,
  isDarkMode = false,
  onLoadComplete,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const serverProxiedPdfUrl = useMemo(() => {
    if (!pdfUrl) return ''; // Handle case where pdfUrl might be initially empty or null
    return `${DAILY_SCRIPTURE_AND_QUOTE_URI}/api/v3/readSermonBook?url=${encodeURIComponent(pdfUrl)}`;
  }, [pdfUrl]);

  // Log the PDF URL for debugging
  useEffect(() => {
    console.log('PdfViewer - Rendering PDF:', pdfUrl);
    console.log('PdfViewer - Platform:', Platform.OS);
  }, [pdfUrl]);

  // Reset state when PDF URL changes
  useEffect(() => {
    setIsLoading(true);
    setError(null);
  }, [pdfUrl]);

  // Function to open PDF in external viewer
  const openInExternalViewer = async () => {
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert('Sharing not available', 'Sharing is not available on your device.');
      onError?.('Sharing not available on device');
      return;
    }

    setIsLoading(true); // Show loading indicator while downloading
    setError(null);
    const fileName = pdfUrl.split('/').pop() || 'sermon.pdf';
    const localUri = FileSystem.cacheDirectory + fileName.replace(/[^a-zA-Z0-9.]/g, '_'); // Sanitize filename

    try {
      console.log(`Downloading PDF from ${serverProxiedPdfUrl} (via server) to ${localUri}`);
      const { uri: downloadedUri } = await FileSystem.downloadAsync(serverProxiedPdfUrl, localUri);
      console.log('Finished downloading to ', downloadedUri);
      
      await Sharing.shareAsync(downloadedUri, {
        mimeType: 'application/pdf',
        dialogTitle: title || 'Open PDF',
        UTI: 'com.adobe.pdf',
      });
      setIsLoading(false);
    } catch (e: any) {
      console.error('Error downloading or sharing PDF:', e);
      setError('Failed to open PDF externally. Please check your internet connection and try again.');
      onError?.('Failed to open PDF externally: ' + e.message);
      setIsLoading(false);
      Alert.alert('Error', 'Could not open PDF. Please ensure you have an app to view PDFs installed and try again.');
    }
  };


  return (
    <View style={[styles.container, style, isDarkMode && styles.containerDark]}>
      <View style={styles.pdfReaderWrapper}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: isDarkMode ? '#fff' : '#1e293b', fontSize: 18, marginBottom: 10, textAlign: 'center' }}>
            PDF Reader Component Unavailable
          </Text>
          <Text style={{ color: '#64748b', textAlign: 'center' }}>
            The PDF reader library (rn-pdf-reader-js) is not installed.
            {'\n\n'}
            Please install the required package to view PDF documents.
          </Text>
        </View>
        {/* Temporarily commented out until rn-pdf-reader-js is installed
        <PDFReader
        source={{
          uri: serverProxiedPdfUrl,
        }}
        onError={(err: any) => {
          console.error("PDFReader error:", err);
          let errorMessage = 'Unknown error';
          if (typeof err === 'string') {
            errorMessage = err;
          } else if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
            errorMessage = err.message;
          }
          setError('Failed to render PDF with PDFReader. ' + errorMessage);
          setIsLoading(false);
          onError?.('PDFReader error: ' + errorMessage);
        }}
        onLoadEnd={() => {
          console.log("PDFReader onLoadEnd");
          // As a fallback, ensure loading is false if it's still true
          // This can help if onLoad doesn't fire reliably for some reason.
          if (isLoading) {
            setIsLoading(false);
          }
        }}
        onLoad={() => {
          console.log("PDFReader onLoad: PDF rendered successfully");
          setIsLoading(false);
          setError(null); // Clear any previous errors
          onLoadComplete?.();
        }}
        withScroll={true}
        withPinchZoom={true}
        style={styles.pdfReader}
      />
      */}
      </View>
      
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#6a11cb" />
          <Text style={styles.loadingText}>Loading PDF...</Text>
        </View>
      )}
      
      {error && (
        <View style={[styles.errorContainer, isDarkMode && styles.errorContainerDark]}>
          <Text style={styles.errorText}>Failed to load PDF: {error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => {
              // Retry by re-triggering the effect/state that loads the PDF
              // For PDFReader, this usually means resetting states and letting useEffect re-run
              setIsLoading(true);
              setError(null);
              // The useEffect watching serverProxiedPdfUrl (or pdfUrl) should re-trigger loading.
              // We can force a re-evaluation of serverProxiedPdfUrl if needed by adding a dummy state
              // or simply re-call a load function if we extract PDF loading logic.
              // For now, resetting isLoading and error. The main useEffect [pdfUrl] will handle it if pdfUrl is part of its deps.
              // If pdfUrl itself doesn't change, this might not re-fetch. 
              // Let's ensure the main useEffect for loading is robust or add a specific retry mechanism.
              // For now, this will reset the UI to loading state. The actual re-fetch depends on PDFReader or the effect.
              console.log('Retry pressed. Resetting UI to loading state.');
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.retryButton, styles.externalButton]} 
            onPress={openInExternalViewer}
          >
            <Text style={styles.externalButtonText}>Open in External Viewer</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    position: 'relative',
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  pdfReaderWrapper: {
    width: Dimensions.get('window').width * 0.95,
    flex: 1, // Takes available height within the main container
    alignSelf: 'center',
    overflow: 'hidden', // Ensures PDFReader respects bounds if it tries to overflow
  },
  pdfReader: {
    flex: 1, // PDFReader should fill its wrapper
    backgroundColor: 'transparent', // Or match theme
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(248, 248, 248, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainerDark: {
    backgroundColor: 'rgba(18, 18, 18, 0.95)',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#6a11cb',
    borderRadius: 12,
    marginTop: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  externalButton: {
    backgroundColor: '#8e44ad',
    marginTop: 12,
  },
  externalButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default PdfViewer;
