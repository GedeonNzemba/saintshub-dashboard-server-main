import { Image } from 'react-native';
import Palette from 'react-native-palette';

// Predefined color palette for fallback
const colorPalette = {
  blue: ['#E3F2FD', '#90CAF9', '#2196F3', '#1976D2', '#0D47A1'],
  purple: ['#F3E5F5', '#CE93D8', '#9C27B0', '#7B1FA2', '#4A148C'],
  teal: ['#E0F2F1', '#80CBC4', '#009688', '#00796B', '#004D40'],
  amber: ['#FFF8E1', '#FFE082', '#FFC107', '#FFA000', '#FF6F00'],
  indigo: ['#E8EAF6', '#9FA8DA', '#3F51B5', '#303F9F', '#1A237E'],
  pink: ['#FCE4EC', '#F48FB1', '#E91E63', '#C2185B', '#880E4F'],
  green: ['#E8F5E9', '#81C784', '#4CAF50', '#388E3C', '#1B5E20'],
  orange: ['#FFF3E0', '#FFB74D', '#FF9800', '#F57C00', '#E65100'],
};

// Function to extract colors from image
export const extractColors = async (imageUri: string): Promise<string[]> => {
  try {
    const colors = await Palette.getNamedSwatchesFromUrl(imageUri);
    if (colors && (colors.vibrant || colors.muted)) {
      const mainColor = colors.vibrant || colors.muted;
      const lightColor = colors.lightVibrant || colors.lightMuted || lightenColor(mainColor.color, 40);
      const darkColor = colors.darkVibrant || colors.darkMuted || darkenColor(mainColor.color, 40);
      
      return [lightColor.color, mainColor.color, darkColor.color];
    }
  } catch (error) {
    console.log('Color extraction error:', error);
  }
  
  // Fallback to generated colors if extraction fails
  return getFallbackColors();
};

// Fallback color generation
const getFallbackColors = (): string[] => {
  const randomPalette = colorPalette[
    Object.keys(colorPalette)[Math.floor(Math.random() * Object.keys(colorPalette).length)] as keyof typeof colorPalette
  ];
  return [randomPalette[1], randomPalette[2], randomPalette[3]];
};

// Function to get a color scheme based on track properties
export const getColorScheme = (trackName: string): string[] => {
  // Use a simple hash function to consistently map track names to colors
  const hash = trackName.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  const colorKeys = Object.keys(colorPalette);
  const selectedPalette = colorPalette[colorKeys[Math.abs(hash) % colorKeys.length] as keyof typeof colorPalette];
  
  return [
    selectedPalette[1], // Light shade for gradient start
    selectedPalette[2], // Main color
    selectedPalette[3], // Dark shade for gradient end
  ];
};

export const adjustColorOpacity = (color: string, opacity: number): string => {
  if (color.startsWith('#')) {
    // Convert hex to rgb
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  // If it's already rgb/rgba, just modify the opacity
  if (color.startsWith('rgb')) {
    return color.replace(/[\d.]+\)$/g, `${opacity})`);
  }
  return color;
};

const lightenColor = (color: string, amount: number): string => {
  const rgb = hexToRgb(color);
  const lightened = rgb.map(value => Math.min(255, value + amount));
  return rgbToHex(lightened[0], lightened[1], lightened[2]);
};

const darkenColor = (color: string, amount: number): string => {
  const rgb = hexToRgb(color);
  const darkened = rgb.map(value => Math.max(0, value - amount));
  return rgbToHex(darkened[0], darkened[1], darkened[2]);
};

const hexToRgb = (hex: string): number[] => {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0];
};

const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

export const createGradient = (baseColor: string): string[] => {
  return [
    adjustColorOpacity(baseColor, 0.9),
    adjustColorOpacity(baseColor, 0.7),
  ];
};
