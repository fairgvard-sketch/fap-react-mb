import { View, StyleSheet } from 'react-native';
import { CATEGORY_META } from '../constants/categories';
import { Package } from 'phosphor-react-native';

interface Props {
  cat: string;
  size?: number;       // icon size, default 22
  boxSize?: number;    // container size, default 44
  radius?: number;     // border radius, default 12
}

export default function CategoryIcon({ cat, size = 22, boxSize = 44, radius = 12 }: Props) {
  const meta = CATEGORY_META[cat];
  const color = meta?.color ?? '#8B8680';
  const Icon = meta?.Icon ?? Package;

  return (
    <View style={[
      styles.box,
      {
        width: boxSize,
        height: boxSize,
        borderRadius: radius,
        backgroundColor: color + '1A',
      },
    ]}>
      <Icon size={size} weight="duotone" color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
});
