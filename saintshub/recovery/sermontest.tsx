// PATH: saintshub-v3\saintshub\app\(app)\sermontest.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Button } from 'react-native';
import axios from 'axios';
import { DAILY_SCRIPTURE_AND_QUOTE_URI } from '@/utilities/tools';

// Helper function to diagnose URL issues
const diagnoseUrl = async (url: string) => {
  try {
    // First try a simple fetch with timeout
    console.log(`Diagnosing URL: ${url}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, { 
      signal: controller.signal,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log('URL is accessible via fetch');
      return {
        success: true,
        status: response.status,
        statusText: response.statusText,
        method: 'fetch'
      };
    } else {
      console.log(`Fetch failed with status: ${response.status}`);
      return {
        success: false,
        status: response.status,
        statusText: response.statusText,
        method: 'fetch'
      };
    }
  } catch (fetchError: any) {
    console.log('Fetch failed, trying XMLHttpRequest as fallback');
    
    // If fetch fails, try XMLHttpRequest for more details
    return new Promise((resolve) => {
      try {
        const xhr = new XMLHttpRequest();
        xhr.timeout = 10000;
        
        xhr.onreadystatechange = function() {
          if (xhr.readyState === 4) {
            console.log(`XHR completed with status: ${xhr.status}`);
            resolve({
              success: xhr.status >= 200 && xhr.status < 300,
              status: xhr.status,
              statusText: xhr.statusText,
              responseText: xhr.responseText?.substring(0, 100) || '',
              method: 'xhr'
            });
          }
        };
        
        xhr.onerror = function(e) {
          console.log('XHR error:', e);
          resolve({
            success: false,
            error: 'Network error',
            method: 'xhr'
          });
        };
        
        xhr.ontimeout = function() {
          console.log('XHR timeout');
          resolve({
            success: false,
            error: 'Timeout',
            method: 'xhr'
          });
        };
        
        xhr.open('GET', url, true);
        xhr.send();
      } catch (xhrError) {
        console.log('XHR setup failed:', xhrError);
        resolve({
          success: false,
          error: String(xhrError),
          method: 'xhr_setup_failed'
        });
      }
    });
  }
};

export default function SermonTest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<any>(null);
  const [endpoint, setEndpoint] = useState<string>('/api/v3/languages');
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Test if the base URL is accessible first
      console.log(`Attempting to fetch from: ${DAILY_SCRIPTURE_AND_QUOTE_URI}${endpoint}`);
      
      const response = await axios.get(`${DAILY_SCRIPTURE_AND_QUOTE_URI}${endpoint}`);
      console.log('Response:', response);
      
      setResponse(response.data);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'An error occurred');
      
      // Additional error details
      if (err.response) {
        console.log('Error response:', err.response.data);
        console.log('Error status:', err.response.status);
      } else if (err.request) {
        console.log('No response received:', err.request);
      }
    } finally {
      setLoading(false);
    }
  };

  // Run diagnostic on URL
  const runDiagnostic = async () => {
    setLoading(true);
    try {
      const result = await diagnoseUrl(`${DAILY_SCRIPTURE_AND_QUOTE_URI}${endpoint}`);
      setDiagnosticResult(result);
    } catch (err) {
      console.error('Diagnostic failed:', err);
      setDiagnosticResult({ success: false, error: String(err) });
    } finally {
      setLoading(false);
    }
  };

  // On mount, try to fetch data
  useEffect(() => {
    fetchData();
  }, []);

  const testEndpoints = [
    { name: 'Languages', endpoint: '/api/v3/languages' },
    { name: 'English Sermons', endpoint: '/api/v3/sermons?languageCode=en' },
    { name: 'Server Root', endpoint: '/' },
    { name: 'Ping', endpoint: '/ping' }
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>API Test</Text>
      <Text style={styles.subtitle}>Base URL: {DAILY_SCRIPTURE_AND_QUOTE_URI}</Text>
      <Text style={styles.subtitle}>Current Endpoint: {endpoint}</Text>
      
      <ScrollView horizontal style={styles.buttonContainer}>
        {testEndpoints.map((test, index) => (
          <TouchableOpacity
            key={index}
            style={styles.button}
            onPress={() => {
              setEndpoint(test.endpoint);
              setTimeout(() => fetchData(), 100);
            }}
          >
            <Text style={styles.buttonText}>{test.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.fetchButton} onPress={fetchData}>
          <Text style={styles.fetchButtonText}>Fetch Data</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.diagnosticButton} onPress={runDiagnostic}>
          <Text style={styles.fetchButtonText}>Run Diagnostic</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.responseContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Error</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <>
            {diagnosticResult && (
              <View style={[
                styles.diagnosticContainer, 
                { backgroundColor: diagnosticResult.success ? '#e8f5e9' : '#ffebee' }
              ]}>
                <Text style={styles.diagnosticTitle}>URL Diagnostic</Text>
                <Text style={styles.diagnosticText}>
                  Method: {diagnosticResult.method}{'\n'}
                  Success: {String(diagnosticResult.success)}{'\n'}
                  {diagnosticResult.status && `Status: ${diagnosticResult.status}\n`}
                  {diagnosticResult.statusText && `Status Text: ${diagnosticResult.statusText}\n`}
                  {diagnosticResult.error && `Error: ${diagnosticResult.error}\n`}
                </Text>
              </View>
            )}
            
            <Text style={styles.responseTitle}>Response:</Text>
            <Text style={styles.responseText}>
              {JSON.stringify(response, null, 2)}
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 16,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  fetchButton: {
    backgroundColor: '#2ecc71',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    marginRight: 8,
  },
  diagnosticButton: {
    backgroundColor: '#9b59b6',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  fetchButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  responseContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#ffebee',
    borderRadius: 8,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#d32f2f',
  },
  diagnosticContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  diagnosticTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  diagnosticText: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
  responseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  responseText: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
}); 