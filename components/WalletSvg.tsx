import Svg, { Path } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

export default function WalletSvg({ size = 28, color = '#fff' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 -2.5 46 46" fill={color}>
      <Path
        fillRule="evenodd"
        transform="translate(-1 -4.006)"
        d="M47,40h0a5,5,0,0,1-5,5H6a5,5,0,0,1-5-5V11A4,4,0,0,1,5,7H25.171l8.1-2.934a.99.99,
          0,0,1,1.268.589L35.391,7H39a4,4,0,0,1,4,4v2h0a4,4,0,0,1,4,4ZM5,9H5a2,2,0,0,0,0,
          4H8.634c.013-.005.021-.016.034-.021L19.65,9Zm29.078.181L33.016,6.257h0L30.964,
          7h0L25.453,9h-.01L14.4,13H35.466ZM41,11a2,2,0,0,0-2-2H36.117l1.454,4H41Zm2,
          4H5a3.955,3.955,0,0,1-2-.555V40a3,3,0,0,0,3,3H42a3,3,0,0,0,3-3V33H41a4,4,0,
          0,1,0-8h4V17A2,2,0,0,0,43,15Zm2,16V27H41a2,2,0,0,0,0,4Zm-4-3h2v2H41Z"
      />
    </Svg>
  );
}
