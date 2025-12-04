import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import MainTabs from './MainTabs';


export type RootStackParamList = {
Splash: undefined;
Onboarding: undefined;
MainTabs: undefined;
};


const Stack = createNativeStackNavigator<RootStackParamList>();


export default function AppNavigator() {
return (
<Stack.Navigator
initialRouteName="Splash"
screenOptions={{ headerShown: false }}
>
<Stack.Screen name="Splash" component={SplashScreen} />
<Stack.Screen name="Onboarding" component={OnboardingScreen} />
<Stack.Screen name="MainTabs" component={MainTabs} />
</Stack.Navigator>
);
}