import { StyleSheet } from 'react-native';

export const COLORS = {
    // Backgrounds
    background: '#120D16', // Deep purple-black
    surface: '#1F1B24', // Slightly lighter
    surfaceLight: '#2D2636',

    // Accents (Neon/Cyberpunk)
    primary: '#D946EF', // Magenta/Pink
    primaryDark: '#A21CAF',
    secondary: '#06B6D4', // Cyan
    secondaryDark: '#0891B2',
    accent: '#F59E0B', // Amber/Gold

    // States
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',

    // Typography
    text: '#F3F4F6', // Off-white
    textSecondary: '#9CA3AF', // Gray-400
    textMuted: '#6B7280',

    // Resources
    gold: '#FBBF24',
    diamond: '#38BDF8',
    bronze: '#B45309', // Real bronze color

    // Glass
    glassBorder: 'rgba(255, 255, 255, 0.1)',
};

export const COMMON_STYLES = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        fontSize: 32,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 8,
        letterSpacing: 1,
        textShadowColor: COLORS.primary,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    subHeader: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.secondary,
        marginBottom: 12,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    card: {
        backgroundColor: COLORS.surface,
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    text: {
        color: COLORS.text,
        fontSize: 16,
    },
    textSecondary: {
        color: COLORS.textSecondary,
        fontSize: 14,
    },
    buttonPrimary: {
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 8,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});
