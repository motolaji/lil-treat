import { colors } from '../../styles/colors'

export type CardAccent = 'green' | 'yellow' | 'black' | 'white'
export type CardBackground = 'black' | 'white'

export const getCardProgressPercent = (currentCount: number, requiredCount: number) => {
  if (requiredCount <= 0) {
    return undefined
  }

  return Math.max(0, (currentCount / requiredCount) * 100)
}

export const getCardAccent = (
  progressPercent: number | undefined,
  background: CardBackground,
): CardAccent => {
  if (progressPercent === undefined || !Number.isFinite(progressPercent)) {
    return background === 'black' ? 'white' : 'black'
  }

  if (progressPercent >= 100) {
    return 'green'
  }

  if (progressPercent >= 80) {
    return 'yellow'
  }

  return background === 'black' ? 'white' : 'black'
}

type CardTheme = {
  accent: CardAccent
  accentColor: string
  borderColor: string
  shadowColor: string
  cardBackground: string
  logoPaneBackground: string
  textPrimary: string
  textSecondary: string
  buttonTextColor: string
  expiryColor: string
  locationIconFilter: string
}

const accentColorMap: Record<CardBackground, Record<CardAccent, string>> = {
  black: {
    green: colors.greenOnBlack,
    yellow: colors.yellowOnBlack,
    black: colors.white,
    white: colors.white,
  },
  white: {
    green: colors.greenOnWhite,
    yellow: colors.yellowOnWhite,
    black: colors.black,
    white: colors.black,
  },
}

const shadowColorMap: Record<CardBackground, Record<CardAccent, string>> = {
  black: {
    green: 'rgba(127, 255, 42, 0.6)',
    yellow: 'rgba(255, 221, 85, 0.6)',
    black: 'rgba(255, 255, 255, 0.62)',
    white: 'rgba(255, 255, 255, 0.62)',
  },
  white: {
    green: 'rgba(18, 138, 58, 0.35)',
    yellow: 'rgba(214, 168, 0, 0.35)',
    black: 'rgba(0, 0, 0, 0.38)',
    white: 'rgba(0, 0, 0, 0.38)',
  },
}

export const getCardTheme = (
  progressPercent: number | undefined,
  background: CardBackground,
): CardTheme => {
  const accent = getCardAccent(progressPercent, background)

  if (background === 'black') {
    return {
      accent,
      accentColor: accentColorMap.black[accent],
      borderColor: accentColorMap.black[accent],
      shadowColor: shadowColorMap.black[accent],
      cardBackground: colors.black,
      logoPaneBackground: colors.white,
      textPrimary: colors.white,
      textSecondary: colors.white,
      buttonTextColor: colors.black,
      expiryColor: colors.grey200,
      locationIconFilter: 'brightness(0) invert(1)',
    }
  }

  return {
    accent,
    accentColor: accentColorMap.white[accent],
    borderColor: accentColorMap.white[accent],
    shadowColor: shadowColorMap.white[accent],
    cardBackground: colors.white,
    logoPaneBackground: colors.black,
    textPrimary: colors.black,
    textSecondary: colors.black,
    buttonTextColor: colors.white,
    expiryColor: colors.grey700,
    locationIconFilter: 'none',
  }
}
