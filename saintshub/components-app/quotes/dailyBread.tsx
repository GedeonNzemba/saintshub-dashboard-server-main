import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

interface DailyBreadData {
  dailyBread: {
    scriptureReference: string;
    scriptureText: string;
  };
  language: string;
}

export default function DailyBread() {
  const [dailyBreadData, setDailyBreadData] = useState<DailyBreadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<'en' | 'fr'>('en');
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const fetchDailyBread = async (lang: 'en' | 'fr') => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`https://saintshub-bible-api.onrender.com/quotes/${lang}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setDailyBreadData(data);
    } catch (err) {
      console.error('Error fetching daily bread:', err);
      setError('Unable to load daily bread. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const setLanguageWithAnimation = (lang: 'en' | 'fr') => {
    setLanguage(lang);
  };

  useEffect(() => {
    fetchDailyBread(language);
  }, [language]);

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
      <View className="bg-emerald-500 dark:bg-emerald-600 rounded-[32px] p-6">
        <View className="flex-row justify-between items-center mb-8">
          <View className="flex-row items-center space-x-4">
            <View className="bg-white/25 dark:bg-white/20 p-3.5 rounded-2xl shadow-lg mr-4">
              <Feather
                name="book-open"
                size={24}
                color="#ffffff"
              />
            </View>
            <Text className="text-2xl font-bold text-white" style={{ fontFamily: 'RobotoCondensedBold' }}>
              {language === 'en' ? 'Daily Bread' : 'Pain Quotidien'}
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
        ) : dailyBreadData ? (
          <View className="space-y-6">
            <View className="bg-white dark:bg-gray-900 rounded-2xl p-6">
              <Text className="text-xl text-gray-800 dark:text-gray-100 leading-loose tracking-wide" style={{ fontFamily: 'RobotoRegular' }}>
                {dailyBreadData.dailyBread.scriptureText.split('. ').map((sentence, index, array) => (
                  sentence + (index < array.length - 1 ? '.\n\n' : '')
                ))}
              </Text>
            </View>
            
            <View className="bg-white/20 dark:bg-white/15 rounded-2xl p-5 mt-8">
              <Text className="text-xl text-white text-right" style={{ fontFamily: 'RobotoBold' }}>
                - {dailyBreadData.dailyBread.scriptureReference}
              </Text>
            </View>
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}