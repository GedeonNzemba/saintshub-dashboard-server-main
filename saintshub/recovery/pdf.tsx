// PATH: saintshub-v3\saintshub\app\(app)\pdf.tsx
import React from 'react';
import { View, Text, ActivityIndicator, SafeAreaView, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import PDFReader from 'rn-pdf-reader-js';
import { DAILY_SCRIPTURE_AND_QUOTE_URI } from '../../utilities/tools';

// Helper to get styles based on dark mode
const getPdfScreenStyles = (isDarkMode: boolean) => {
  const lightThemeColors = {
    background: '#FFFFFF',
    text: '#1C1C1E',
    accent: '#6a11cb', // Purple accent for light mode
    headerBackground: '#F0F0F0',
    headerText: '#1C1C1E',
  };
  const darkThemeColors = {
    background: '#0f172a', // Dark slate background (from your snippet)
    text: '#FFFFFF',
    accent: '#8e44ad', // Purple accent for dark mode
    headerBackground: '#1C1C1E',
    headerText: '#FFFFFF',
  };
  const currentTheme = isDarkMode ? darkThemeColors : lightThemeColors;

  return {
    styles: StyleSheet.create({
      safeArea: {
        flex: 1,
        backgroundColor: currentTheme.background,
      },
      loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: currentTheme.background,
      },
      loadingText: {
        marginTop: 10,
        fontSize: 14,
        textAlign: 'center',
        color: currentTheme.text,
      },
      errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
      },
      errorText: {
        fontSize: 16,
        color: currentTheme.text,
        textAlign: 'center',
      },
      webView: {
        flex: 1,
        backgroundColor: currentTheme.background, // Match WebView background
      },
    }),
    themeColors: currentTheme,
  };
};

const PdfScreen = () => {
  console.log('[PdfScreen] Component mounted.');
  const [isLoadingPdf, setIsLoadingPdf] = React.useState(true);
  const [pdfError, setPdfError] = React.useState<string | null>(null);
  const params = useLocalSearchParams<{ pdfUrl: string; sermonTitle?: string; isDarkMode?: string }>();
  const { pdfUrl, sermonTitle } = params;
  console.log(`[PdfScreen] Received params: pdfUrl=${pdfUrl}, sermonTitle=${sermonTitle}, isDarkMode=${params.isDarkMode}`);
  
  // Determine dark mode. Default to false if not passed or invalid.
  const isDarkMode = params.isDarkMode === 'true'; 

  const serverProxiedPdfUrl = React.useMemo(() => {
    if (!pdfUrl) return '';
    console.log(`[PdfScreen] Creating proxied URL for: ${pdfUrl}`);
    const proxied = `${DAILY_SCRIPTURE_AND_QUOTE_URI}/api/v3/readSermonBook?url=${encodeURIComponent(pdfUrl)}`;
    console.log(`[PdfScreen] Proxied URL: ${proxied}`);
    return proxied;
  }, [pdfUrl]);

  React.useEffect(() => {
    console.log('[PdfScreen] useEffect on mount: Attempting to load PDF. isLoadingPdf is initially true.');
    // You could also explicitly set isLoadingPdf to true here if it wasn't initialized as such,
    // but since it is, this log primarily confirms the process start.
  }, []); // Empty dependency array ensures this runs only once on mount

  const { styles, themeColors } = getPdfScreenStyles(isDarkMode);

  if (!pdfUrl) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen 
          options={{ 
            title: 'Error',
            headerStyle: { backgroundColor: themeColors.headerBackground },
            headerTintColor: themeColors.headerText,
            headerTitleStyle: { color: themeColors.headerText },
          }} 
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>PDF URL not provided. Please go back and try again.</Text>
        </View>
      </SafeAreaView>
    );
  }



  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen 
        options={{ 
          title: sermonTitle || 'PDF Document',
          headerShown: true, // Explicitly show the header for this screen
          headerStyle: { backgroundColor: themeColors.headerBackground },
          headerTintColor: themeColors.headerText,
          headerTitleStyle: { color: themeColors.headerText },
        }} 
      />
      {serverProxiedPdfUrl && (
        <PDFReader
          source={{
            uri: serverProxiedPdfUrl,
          }}
          onError={(err: any) => {
            console.error("[PdfScreen] PDFReader onError triggered:", err);
            let errorMessage = 'Unknown error occurred while loading PDF.';
            if (typeof err === 'string') {
              errorMessage = err;
            } else if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
              errorMessage = err.message;
            }
            setPdfError('Failed to render PDF: ' + errorMessage);
            setIsLoadingPdf(false);
          }}
          onLoadEnd={() => {
            console.log("[PdfScreen] PDFReader onLoadEnd triggered.");
            // Fallback to ensure loading indicator is hidden
            if (isLoadingPdf) {
              setIsLoadingPdf(false);
            }
          }}
          onLoad={() => {
            console.log("[PdfScreen] PDFReader onLoad triggered: PDF should be rendered successfully.");
            setIsLoadingPdf(false);
            setPdfError(null); // Clear any previous errors
          }}
          withScroll={true}
          withPinchZoom={true}
          style={styles.webView} // Assuming styles.webView is appropriate, or create new style
        />
      )}
      {/* Overlays for loading and error states */}
      {isLoadingPdf && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.accent} />
          <Text style={styles.loadingText}>Loading PDF document...</Text>
        </View>
      )}
      {pdfError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{pdfError}</Text>
          {/* Optionally, add a retry button here */}
        </View>
      )}
    </SafeAreaView>
  );
};

export default PdfScreen;
