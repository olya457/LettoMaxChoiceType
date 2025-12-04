import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from '../screens/HomeScreen';
import QuizeScreen from '../screens/QuizeScreen';
import MaxActiveScreen from '../screens/MaxActiveScreen';
import WallpapersScreen from '../screens/WallpapersScreen';

export type TabsParamList = {
  home: undefined;
  quize: undefined;
  max_active: undefined;
  wallpapers: undefined;
};

const Tab = createBottomTabNavigator<TabsParamList>();

const iconSrc = (name: 'home'|'quiz'|'max'|'walls', focused: boolean) => {
  switch (name) {
    case 'home':
      return focused
        ? require('../assets/tab_home_active.png')
        : require('../assets/tab_home.png');
    case 'quiz':
      return focused
        ? require('../assets/tab_quiz_active.png')
        : require('../assets/tab_quiz.png');
    case 'max':
      return focused
        ? require('../assets/tab_max_active.png')
        : require('../assets/tab_max.png');
    case 'walls':
      return focused
        ? require('../assets/tab_walls_active.png')
        : require('../assets/tab_walls.png');
  }
};

const TabIcon = ({ name, focused }: { name:'home'|'quiz'|'max'|'walls'; focused:boolean }) => (
  <Image source={iconSrc(name, focused)} style={styles.icon} resizeMode="contain" />
);

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.bar,
      }}
    >
      <Tab.Screen
        name="home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="quize"
        component={QuizeScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="quiz" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="max_active"
        component={MaxActiveScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="max" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="wallpapers"
        component={WallpapersScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="walls" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    height: 62,
    backgroundColor: '#008608',
    borderRadius: 22,
    paddingHorizontal: 18,
    borderTopWidth: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  icon: { width: 26, height: 26, marginTop: 16 },
});
