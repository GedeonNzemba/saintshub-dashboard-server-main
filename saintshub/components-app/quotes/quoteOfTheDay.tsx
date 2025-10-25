import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

interface QuoteData {
  quoteOfTheDay: {
    audio: string;
    sermonDate: string;
    sermonTitle: string;
    quote: string;
  };
  language: string;
}

export default function QuoteOfTheDay() {
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<'en' | 'fr'>('en');
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const fetchQuote = async (lang: 'en' | 'fr') => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`https://saintshub-bible-api.onrender.com/quotes/${lang}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setQuoteData(data);
    } catch (err) {
      console.error('Error fetching quote:', err);
      setError('Unable to load quote. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const setLanguageWithAnimation = (lang: 'en' | 'fr') => {
    setLanguage(lang);
  };

  const playSound = async () => {
    if (!quoteData?.quoteOfTheDay.audio) return;

    try {
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: quoteData.quoteOfTheDay.audio },
          { shouldPlay: true }
        );
        setSound(newSound);
        setIsPlaying(true);
        
        newSound.setOnPlaybackStatusUpdate(status => {
          if (status && 'isPlaying' in status) {
            setIsPlaying(status.isPlaying);
          }
        });
      }
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  useEffect(() => {
    fetchQuote(language);
  }, [language]);

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  if (error) {
    return (
      <View className="mx-4 my-2 p-6 bg-gradient-to-br from-red-100/90 to-red-50/90 dark:from-red-900/20 dark:to-red-800/20 rounded-3xl border border-red-200/50 dark:border-red-700/30">
        <Text className="text-red-600 dark:text-red-400 text-center font-medium">
          {error}
        </Text>
      </View>
    );
  }

  return (
    <Animated.View 
      entering={FadeInDown.duration(750)}
      className="mx-4 my-6"
    >
      <View className="bg-violet-500 dark:bg-violet-600 rounded-[32px] p-6">
        <View className="flex-row justify-between items-center mb-8">
          <View className="flex-row items-center space-x-4">
            <View className="bg-white/25 dark:bg-white/20 p-3.5 rounded-2xl shadow-lg mr-4">
              <Feather 
                name="message-circle" 
                size={24} 
                color="#ffffff"
              />
            </View>
            <Text className="text-2xl font-bold text-white" style={{ fontFamily: 'RobotoCondensedBold' }}>
              {language === 'en' ? 'Quote of the Day' : 'Citation du Jour'}
            </Text>
          </View>
          
          {/* Language Switcher */}
          <View className="flex-row bg-white/20 dark:bg-white/15 rounded-2xl p-1.5">
            <TouchableOpacity
              onPress={() => setLanguageWithAnimation('en')}
              className={`px-5 py-2.5 rounded-xl flex-row items-center ${
                language === 'en'
                ? 'bg-white/25 dark:bg-white/20'
                : ''
              }`}
            >
              <Text className="font-medium text-white" style={{ fontFamily: 'RobotoMedium' }}>
                EN
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setLanguageWithAnimation('fr')}
              className={`px-5 py-2.5 rounded-xl flex-row items-center ${
                language === 'fr'
                ? 'bg-white/25 dark:bg-white/20'
                : ''
              }`}
            >
              <Text className="font-medium text-white" style={{ fontFamily: 'RobotoMedium' }}>
                FR
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View className="py-16">
            <ActivityIndicator size="large" color="#ffffff" />
          </View>
        ) : quoteData ? (
          <View className="space-y-6">
            <View className="bg-white dark:bg-gray-900 rounded-2xl p-6">
              <Text className="text-xl text-gray-800 dark:text-gray-100 leading-loose tracking-wide" style={{ fontFamily: 'RobotoRegular' }}>
                {quoteData.quoteOfTheDay.quote.split('. ').map((sentence, index, array) => (
                  `"${sentence}${index < array.length - 1 ? '.\n\n' : ''}"${index === array.length - 1 ? '' : ''}`
                ))}
              </Text>
            </View>
            
            <View className="space-y-2 px-2 mt-8 mb-4">
              <Text className="text-xl text-white" style={{ fontFamily: 'RobotoBold' }}>
                {quoteData.quoteOfTheDay.sermonTitle}
              </Text>
              <Text className="text-base text-white/90" style={{ fontFamily: 'RobotoRegular' }}>
                {quoteData.quoteOfTheDay.sermonDate}
              </Text>
            </View>
            
            {quoteData.quoteOfTheDay.audio && (
              <TouchableOpacity
                onPress={playSound}
                className="flex-row items-center bg-white/20 dark:bg-white/15 p-4 rounded-2xl active:scale-[0.98] transform transition-all duration-200"
              >
                <View className="bg-white/25 dark:bg-white/20 p-3 rounded-xl mr-3">
                  <Feather
                    name={isPlaying ? 'pause' : 'play'}
                    size={28}
                    color="#ffffff"
                  />
                </View>
                <Text className="text-lg text-white" style={{ fontFamily: 'RobotoMedium' }}>
                  {isPlaying ? 'Pause Audio' : 'Play Audio'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}