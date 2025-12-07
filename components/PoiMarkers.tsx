import { Marker } from 'react-native-maps';
import { Image, View } from 'react-native';

interface Item {
  x: number;
  y: number;
  name: string;
  type: string;
  img?: string;
}

type Props = {
  points: { latitude: number; longitude: number }[];
  data: Item[];
  wantedType: string;
  onPressMarker: (item: Item | undefined) => void;
};

const TYPE_COLORS: Record<string, string> = {
  sport: '#FF5733',
  kultura: '#33FF57',
  historia: '#3357FF',
};

const getRandomColor = () => '#' + Math.floor(Math.random() * 16777215).toString(16);

export default function PoiMarkers({ points, data, wantedType, onPressMarker }: Props) {
  const color = TYPE_COLORS[wantedType.toLowerCase()] || getRandomColor();


  
  return points.map((item, index) => {
    const markerData = data.find((d) => d.x === item.latitude && d.y === item.longitude);
    return (
      <Marker
        key={index}
        coordinate={item}
        title={markerData?.name}
        description={markerData?.type}
        pinColor={color}
        onPress={() => onPressMarker(markerData)}
        tracksViewChanges={false}
      >
        {data[index].img ? (
          <View style={{
            padding: 2,
            backgroundColor: '#ffffff',
            borderRadius: 16,
            shadowColor: '#000',
            shadowOpacity: 0.2,
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 2,
          }}>
            <Image
              source={{ uri: data[index].img }}
              style={{ width: 32, height: 32, borderRadius: 16 }}
            />
          </View>
        ) : null}
      </Marker>
    );
  });
}
