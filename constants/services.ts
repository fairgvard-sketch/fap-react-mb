import type React from 'react';
import { NetflixIcon, YouTubeIcon, SpotifyIcon, CyberGhostIcon, ClaudeIcon, CustomIcon } from '../components/BrandIcons';

export type Service = {
  n: string;
  bg: string;
  Icon: React.ComponentType<{ size?: number }>;
};

export const SVCS: Service[] = [
  { n: 'Netflix',    bg: '#e50914', Icon: NetflixIcon    },
  { n: 'YouTube',    bg: '#ff0000', Icon: YouTubeIcon    },
  { n: 'Spotify',    bg: '#1db954', Icon: SpotifyIcon    },
  { n: 'CyberGhost', bg: '#ffb300', Icon: CyberGhostIcon },
  { n: 'Claude',     bg: '#cc785c', Icon: ClaudeIcon     },
  { n: 'Своя',       bg: '#1a4a35', Icon: CustomIcon     },
];
