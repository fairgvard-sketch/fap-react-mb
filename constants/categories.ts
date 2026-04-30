import {
  ForkKnife, ShoppingBag, Bus, Taxi, DeviceMobile, TShirt,
  Heartbeat, FilmSlate, GameController, Sparkle, Lightning,
  AirplaneTilt, Gift, BookOpen, Package,
  CurrencyCircleDollar, Coins,
} from 'phosphor-react-native';
import type React from 'react';

type PhosphorIcon = React.ComponentType<{ size?: number; weight?: string; color?: string }>;

export type CategoryMeta = { color: string; Icon: PhosphorIcon };

export const EXPENSE_CATS = [
  'Рестораны','Продукты','Транспорт','Такси','Гаджеты','Одежда',
  'Здоровье','Развлечения','Игры','Бьюти','Коммунальные','Путешествия',
  'Подарки','Образование','Разное',
];

export const INCOME_CATS = ['Зарплата','Чаевые','Другое'];

export const CATEGORY_META: Record<string, CategoryMeta> = {
  'Рестораны':    { color: '#E88D67', Icon: ForkKnife },
  'Продукты':     { color: '#7B9E6A', Icon: ShoppingBag },
  'Транспорт':    { color: '#6B8CAE', Icon: Bus },
  'Такси':        { color: '#E2B973', Icon: Taxi },
  'Гаджеты':      { color: '#5E6E8C', Icon: DeviceMobile },
  'Одежда':       { color: '#C07E9E', Icon: TShirt },
  'Здоровье':     { color: '#CB6A6A', Icon: Heartbeat },
  'Развлечения':  { color: '#A068B5', Icon: FilmSlate },
  'Игры':         { color: '#3D7F7A', Icon: GameController },
  'Бьюти':        { color: '#E88DA8', Icon: Sparkle },
  'Коммунальные': { color: '#D9A441', Icon: Lightning },
  'Путешествия':  { color: '#4C7D8C', Icon: AirplaneTilt },
  'Подарки':      { color: '#D97676', Icon: Gift },
  'Образование':  { color: '#6B7B99', Icon: BookOpen },
  'Разное':       { color: '#8B8680', Icon: Package },
  'Зарплата':     { color: '#2B5B43', Icon: CurrencyCircleDollar },
  'Чаевые':       { color: '#E9A020', Icon: Coins },
  'Другое':       { color: '#6B8CAE', Icon: CurrencyCircleDollar },
  'Аренда':       { color: '#6B7B99', Icon: Package },
  'Подписки':     { color: '#5E6E8C', Icon: DeviceMobile },
};
