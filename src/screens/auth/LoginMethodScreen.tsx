import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MethodScreenBase } from './MethodScreenBase';
import type { AuthStackParamList } from '../../types';

type Props = NativeStackScreenProps<AuthStackParamList, 'LoginMethod'>;

export function LoginMethodScreen({ navigation }: Props) {
  return <MethodScreenBase navigation={navigation} mode="login" />;
}
