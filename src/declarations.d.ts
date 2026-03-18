declare module '@expo/vector-icons' {
  import type { ComponentType } from 'react';

  export const MaterialIcons: ComponentType<{
    name: string;
    size?: number;
    color?: string;
  }>;
}
