import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme as defaultTheme, lightTheme, darkTheme, Theme } from '../constants/theme';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    mode: ThemeMode;
    toggleTheme: () => void;
    setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [mode, setModeState] = useState<ThemeMode>('light');
    const [theme, setTheme] = useState<Theme>(lightTheme);

    useEffect(() => {
        loadThemePreference();
    }, []);

    const loadThemePreference = async () => {
        try {
            const savedMode = await AsyncStorage.getItem('themeMode');
            if (savedMode === 'dark') {
                setModeState('dark');
                setTheme(darkTheme);
            }
        } catch (error) {
            console.error('Failed to load theme preference:', error);
        }
    };

    const setMode = async (newMode: ThemeMode) => {
        setModeState(newMode);
        setTheme(newMode === 'dark' ? darkTheme : lightTheme);
        try {
            await AsyncStorage.setItem('themeMode', newMode);
        } catch (error) {
            console.error('Failed to save theme preference:', error);
        }
    };

    const toggleTheme = () => {
        setMode(mode === 'light' ? 'dark' : 'light');
    };

    return (
        <ThemeContext.Provider value={{ theme, mode, toggleTheme, setMode }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
