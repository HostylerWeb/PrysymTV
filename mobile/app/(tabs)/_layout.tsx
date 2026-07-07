import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PrysymTabBar } from '@/components/layout/PrysymTabBar';
import { useTheme } from '@/theme/ThemeProvider';

type TabIcon = keyof typeof Ionicons.glyphMap;

export default function TabsLayout() {
  const { colors } = useTheme();

  function tabIcon(name: TabIcon, focused: boolean) {
    return (
      <Ionicons
        name={name}
        size={focused ? 26 : 24}
        color={focused ? colors.primary : colors.mutedForeground}
      />
    );
  }

  return (
    <Tabs
      tabBar={(props) => <PrysymTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
      }}
    >
      {/* Home exists as a route but is hidden from the tab bar (web: logo → home). */}
      <Tabs.Screen name="home" options={{ href: null }} />
      <Tabs.Screen
        name="videos"
        options={{
          title: 'Videos',
          tabBarIcon: ({ focused }) => tabIcon(focused ? 'videocam' : 'videocam-outline', focused),
        }}
      />
      <Tabs.Screen
        name="movies"
        options={{
          title: 'Movies',
          tabBarIcon: ({ focused }) => tabIcon(focused ? 'film' : 'film-outline', focused),
        }}
      />
      <Tabs.Screen
        name="shorts"
        options={{
          title: 'Shorts',
          tabBarIcon: ({ focused }) => tabIcon(focused ? 'play' : 'play-outline', focused),
        }}
      />
      <Tabs.Screen
        name="verticals"
        options={{
          title: 'Verticals',
          tabBarIcon: ({ focused }) => tabIcon(focused ? 'grid' : 'grid-outline', focused),
        }}
      />
      <Tabs.Screen
        name="podcasts"
        options={{
          title: 'Podcasts',
          tabBarIcon: ({ focused }) => tabIcon(focused ? 'headset' : 'headset-outline', focused),
        }}
      />
    </Tabs>
  );
}
