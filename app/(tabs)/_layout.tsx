import { Tabs, Stack } from 'expo-router';
import React, { useState } from 'react';
import { Pressable } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function TabLayout() {
  
  const [selectedTab, setSelectedTab] = useState(0);

  const handleTabPress = (index: number) => {
    setSelectedTab(index);
  };

  const onPress = () => {
    // Menu action handler
    console.log('Menu pressed');
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "blue",
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
          headerShown: true,
          headerRight: () => (
            <Pressable onPress={onPress} style={{ marginRight: 10, height: 44, width: 44, justifyContent: 'center', alignItems: 'center' }}>
              {({ pressed }) => (
                <IconSymbol name="ellipsis" color={"blue"} size={20} weight='semibold' />
              )}
            </Pressable>
          ),
          headerLeft: () => (
            <Pressable style={{ marginLeft: 10, height: 44, width: 44, justifyContent: 'center', alignItems: 'center' }}>
              {({ pressed }) => (
                <IconSymbol name="magnifyingglass" color="blue" size={20} weight='semibold' />
              )}
            </Pressable>
          ),
          headerTitle: 'Map View',
          headerStyle: { backgroundColor: 'gray' },
          headerShadowVisible: false
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: 'Camera',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="camera.fill" color={color} />,
          headerShown: true,
          headerTitle: 'Compass Camera',
          headerStyle: { backgroundColor: "gray" },
          headerShadowVisible: false
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
