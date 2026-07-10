import { StyleSheet, Text, View } from 'react-native';

// The classic "blue tick" — shown next to the name of a profession-verified
// member. Granted only after admin evidence review (LinkedIn / document).
export function VerifiedTick({ size = 18 }: { size?: number }) {
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.check, { fontSize: size * 0.6 }]}>✓</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: '#2E7CF6', alignItems: 'center', justifyContent: 'center' },
  check: { color: '#fff', fontWeight: '900' }
});
