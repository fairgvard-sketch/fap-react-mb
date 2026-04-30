import {
  Umbrella, Car, House, AirplaneTilt, Laptop, DeviceMobile,
  GraduationCap, Diamond, Gift, Dog, Leaf, CurrencyCircleDollar,
  MusicNotes, Barbell, PaintBrush,
} from 'phosphor-react-native';
import type React from 'react';

type PhosphorIcon = React.ComponentType<{ size?: number; weight?: string; color?: string }>;

export const GOAL_ICON_MAP: Record<string, PhosphorIcon> = {
  beach:     Umbrella,
  car:       Car,
  house:     House,
  plane:     AirplaneTilt,
  laptop:    Laptop,
  phone:     DeviceMobile,
  education: GraduationCap,
  ring:      Diamond,
  gift:      Gift,
  pet:       Dog,
  plant:     Leaf,
  savings:   CurrencyCircleDollar,
  music:     MusicNotes,
  fitness:   Barbell,
  art:       PaintBrush,
};

export const GOAL_ICON_KEYS = Object.keys(GOAL_ICON_MAP);
