import Svg, { Path, Line } from 'react-native-svg';

interface P { size?: number }

// Netflix — official SimpleIcons N-mark, white on red bg
export function NetflixIcon({ size = 24 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="m5.398 0 8.348 23.602c2.346.059 4.856.398 4.856.398L10.113 0H5.398zm8.489 0v9.172l4.715 13.33V0h-4.715zM5.398 1.5V24c1.873-.225 2.81-.312 4.715-.398V14.83L5.398 1.5z"
        fill="white"
      />
    </Svg>
  );
}

// YouTube — white play triangle on red bg
export function YouTubeIcon({ size = 24 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M8 6.5L8 17.5L19 12Z" fill="white" />
    </Svg>
  );
}

// Spotify — official full path in brand green, neutral bg (green circle + white arc holes)
export function SpotifyIcon({ size = 24 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"
        fill="white"
        fillRule="evenodd"
      />
    </Svg>
  );
}

// CyberGhost — official ghost mark from cyberghostvpn.com, white on yellow bg
export function CyberGhostIcon({ size = 24 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 34.024 34.024">
      <Path
        d="M45.381,28.721a8.407,8.407,0,1,0-16.814,0c0,4.65-1.956,13.043,2.694,13.043C51.959,41.763,45.381,33.371,45.381,28.721ZM35.117,33.569C33.388,33.569,32,31.613,32,29.2s1.389-4.366,3.119-4.366,3.119,1.956,3.119,4.366S36.819,33.569,35.117,33.569Zm7.23-1.446c-1.361,0-2.467-1.559-2.467-3.459s1.106-3.459,2.467-3.459,2.467,1.559,2.467,3.459C44.814,30.592,43.708,32.123,42.347,32.123Z"
        fill="white"
        fillRule="evenodd"
        transform="translate(-20.175 -14.544)"
      />
    </Svg>
  );
}

// Claude — official Anthropic A-mark, white on terracotta bg
export function ClaudeIcon({ size = 24 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M17.3041 3.541h-3.6718l6.696 16.918H24Zm-10.6082 0L0 20.459h3.7442l1.3693-3.5527h7.0052l1.3693 3.5528h3.7442L10.5363 3.5409Zm-.3712 10.2232 2.2914-5.9456 2.2914 5.9456Z"
        fill="white"
      />
    </Svg>
  );
}

// Custom / Своя — plus sign, white on green bg
export function CustomIcon({ size = 24 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Line x1="12" y1="5"  x2="12" y2="19" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="5"  y1="12" x2="19" y2="12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}
