export const theme = {
    colors: {
        background: '#1A1A2E',
        surface: '#16213E',
        primary: '#E94560',
        secondary: '#0F3460',
        text: '#EAEAEA',
        subtext: '#B0B0B0',
        gold: '#FFD700',
        danger: '#FF4444',
        success: '#4CAF50',
        cardBorder: '#2A2A40'
    },
    spacing: {
        s: 8,
        m: 16,
        l: 24,
        xl: 32
    },
    borderRadius: {
        s: 8,
        m: 12,
        l: 20
    }
};

export const commonStyles = {
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        padding: theme.spacing.m,
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: theme.spacing.l,
    },
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.m,
        padding: theme.spacing.m,
        marginBottom: theme.spacing.m,
        borderWidth: 1,
        borderColor: theme.colors.cardBorder,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    text: {
        color: theme.colors.text,
    }
};
