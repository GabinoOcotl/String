import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ComponentProps } from "react";
import type { SFSymbol } from "expo-symbols";
import { SymbolView } from "expo-symbols";
import { Platform } from "react-native";

type MaterialIconName = ComponentProps<typeof MaterialIcons>["name"];

export type AuthTabIconProps = {
  sfSymbol: SFSymbol;
  materialName: MaterialIconName;
  color: string;
  size: number;
};

export function AuthTabIcon({
  sfSymbol,
  materialName,
  color,
  size,
}: AuthTabIconProps) {
  if (Platform.OS === "ios") {
    return (
      <SymbolView
        name={sfSymbol}
        size={size}
        tintColor={color}
        type="monochrome"
        fallback={
          <MaterialIcons name={materialName} size={size} color={color} />
        }
      />
    );
  }

  return <MaterialIcons name={materialName} size={size} color={color} />;
}
