import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingProvider } from '../screens/onboarding/OnboardingContext';
import { NameScreen } from '../screens/onboarding/NameScreen';
import { DobScreen } from '../screens/onboarding/DobScreen';
import { ProfessionStepScreen } from '../screens/onboarding/ProfessionStepScreen';
import { PhotosStepScreen } from '../screens/onboarding/PhotosStepScreen';
import { GenderStepScreen } from '../screens/onboarding/GenderStepScreen';
import { AboutStepScreen } from '../screens/onboarding/AboutStepScreen';
import { FinishScreen } from '../screens/onboarding/FinishScreen';

const Stack = createNativeStackNavigator();

// The post-signup wizard: mandatory basics (Name → DOB → Profession → Photos)
// then optional details (Gender → Bio) with Skip, then Finish. Wrapped in the
// OnboardingProvider so steps share one draft and only enter the app at Finish.
export function OnboardingNavigator() {
  return (
    <OnboardingProvider>
      <Stack.Navigator screenOptions={{ headerShown: false, gestureEnabled: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="Name" component={NameScreen} />
        <Stack.Screen name="Dob" component={DobScreen} />
        <Stack.Screen name="ProfessionStep" component={ProfessionStepScreen} />
        <Stack.Screen name="Photos" component={PhotosStepScreen} />
        <Stack.Screen name="Gender" component={GenderStepScreen} />
        <Stack.Screen name="About" component={AboutStepScreen} />
        <Stack.Screen name="Finish" component={FinishScreen} />
      </Stack.Navigator>
    </OnboardingProvider>
  );
}
