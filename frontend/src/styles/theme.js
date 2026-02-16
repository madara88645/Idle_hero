import { StyleSheet } from 'react-native';

export const COLORS = {
    background: '#121212',
    surface: '#1E1E1E',
    primary: '#BB86FC', // Light Purple
    primaryDark: '#8A2BE2', // Blue Violet
    secondary: '#03DAC6', // Teal
    text: '#FFFFFF',
    textSecondary: '#B3B3B3',
    error: '#CF6679',
    success: '#03DAC6',
    white: '#FFFFFF',
    black: '#000000',
    // Resources
    gold: '#FFD700',
    diamond: '#00BFFF',
    bronze: '#CD7F32',
};

export const COMMON_STYLES = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        padding: 20,
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 20,
        letterSpacing: 0.5,
    },
    subHeader: {
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 10,
    },
    card: {
        backgroundColor: COLORS.surface,
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
        // Shadow for iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        // Elevation for Android
        elevation: 5,
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
        backgroundColor: COLORS.primaryDark,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25, // Pill shape
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10,
        elevation: 3,
    },
    buttonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    input: {
        backgroundColor: COLORS.surface,
        color: COLORS.text,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.textSecondary,
        marginBottom: 10,
    },
});
