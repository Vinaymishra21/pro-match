import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { DiscoverScreen } from '../screens/main/DiscoverScreen';
import { LikesScreen } from '../screens/main/LikesScreen';
import { MatchesScreen } from '../screens/main/MatchesScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import { useTheme } from '../theme/ThemeProvider';
import type { MainTabParamList } from '../types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const tabIcon = {
  Discover: 'travel-explore',
  Likes: 'auto-awesome',
  Matches: 'favorite',
  Profile: 'person'
} as const;

export function MainTabNavigator() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  // Sit the tab bar above the Android gesture/nav bar (and iPhone home bar).
  const bottomPad = Math.max(insets.bottom, 8);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          elevation: 0,
          height: 56 + bottomPad,
          paddingTop: 6,
          paddingBottom: bottomPad
        },
        tabBarLabelStyle: { fontWeight: '700', fontSize: 11 },
        tabBarIcon: ({ color, size }) => (
          <MaterialIcons name={tabIcon[route.name]} size={size} color={color} />
        )
      })}
    >
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Likes" component={LikesScreen} />
      <Tab.Screen name="Matches" component={MatchesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
