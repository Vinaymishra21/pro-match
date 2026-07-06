import React from 'react';
import Svg, { Defs, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';

// The Wovnn brand mark — two gradient strands woven into a heart, finished
// with a gold sheen at the cross-over point. Self-colored (brand gradient),
// so it reads on both light and dark backgrounds without theming.
//
// Gradient ids must be unique per mounted instance: react-native-svg resolves
// url(#id) references globally, so two marks on one screen would otherwise
// collide. A module counter keeps ids stable per instance across re-renders.
let instanceCounter = 0;

export function WovnnMark({ size = 72 }: { size?: number }) {
  const [uid] = React.useState(() => `wovnn-mark-${instanceCounter++}`);
  const grad1 = `${uid}-grad1`;
  const grad2 = `${uid}-grad2`;
  const goldSheen = `${uid}-gold`;

  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Defs>
        <LinearGradient id={grad1} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#E8415A" />
          <Stop offset="100%" stopColor="#C0305F" />
        </LinearGradient>
        <LinearGradient id={grad2} x1="100%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#C0305F" />
          <Stop offset="100%" stopColor="#E8415A" />
        </LinearGradient>
        <LinearGradient id={goldSheen} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FBBF24" stopOpacity={0} />
          <Stop offset="45%" stopColor="#FBBF24" stopOpacity={0.55} />
          <Stop offset="100%" stopColor="#FBBF24" stopOpacity={0} />
        </LinearGradient>
      </Defs>

      {/* Backdrop heart */}
      <Path
        d="M 38 82 C 22 68, 18 50, 28 38 C 36 28, 52 26, 60 38 C 68 26, 84 28, 92 38 C 102 50, 98 68, 82 82 L 60 96 Z"
        fill={`url(#${grad1})`}
        opacity={0.15}
      />

      {/* Left strand */}
      <Path
        d="M 60 88 C 48 78, 28 68, 26 52 C 24 38, 34 28, 46 28 C 53 28, 58 33, 60 38"
        stroke={`url(#${grad1})`}
        strokeWidth={8}
        strokeLinecap="round"
        fill="none"
      />

      {/* Left cross */}
      <Path
        d="M 60 52 C 63 62, 70 72, 80 80 C 86 84, 92 86, 94 86"
        stroke={`url(#${grad1})`}
        strokeWidth={8}
        strokeLinecap="round"
        fill="none"
        opacity={0.6}
      />

      {/* Right strand */}
      <Path
        d="M 60 88 C 72 78, 92 68, 94 52 C 96 38, 86 28, 74 28 C 67 28, 62 33, 60 38"
        stroke={`url(#${grad2})`}
        strokeWidth={8}
        strokeLinecap="round"
        fill="none"
      />

      {/* Right cross */}
      <Path
        d="M 60 52 C 57 62, 50 72, 40 80 C 34 84, 28 86, 26 86"
        stroke={`url(#${grad2})`}
        strokeWidth={8}
        strokeLinecap="round"
        fill="none"
        opacity={0.6}
      />

      {/* Center weave */}
      <Path
        d="M 57 42 C 58 46, 59 49, 60 52"
        stroke={`url(#${grad1})`}
        strokeWidth={8.5}
        strokeLinecap="round"
        fill="none"
      />

      {/* Bottom tail */}
      <Path
        d="M 60 88 L 60 96"
        stroke={`url(#${grad1})`}
        strokeWidth={5}
        strokeLinecap="round"
        fill="none"
      />

      {/* Gold sheen at the weave */}
      <Ellipse
        cx={60}
        cy={46}
        rx={7}
        ry={5}
        fill={`url(#${goldSheen})`}
        rotation={-20}
        origin="60, 46"
      />
    </Svg>
  );
}
