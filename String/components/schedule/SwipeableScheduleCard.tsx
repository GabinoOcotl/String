import { useRef } from "react";
import { StyleSheet, Text } from "react-native";
import { RectButton } from "react-native-gesture-handler";
import Swipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";

import {
  ClassScheduleCard,
  type ClassScheduleCardProps,
} from "@/components/schedule/ClassScheduleCard";

type SwipeableScheduleCardProps = ClassScheduleCardProps & {
  onRemove: () => void;
};

export function SwipeableScheduleCard({
  onRemove,
  ...cardProps
}: SwipeableScheduleCardProps) {
  const swipeableRef = useRef<SwipeableMethods>(null);

  const handleRemove = () => {
    swipeableRef.current?.close();
    onRemove();
  };

  return (
    <Swipeable
      ref={swipeableRef}
      friction={2}
      overshootRight={false}
      renderRightActions={(_progress, _translation, _methods) => (
        <RectButton style={styles.removeAction} onPress={handleRemove}>
          <Text style={styles.removeLabel}>Remove</Text>
        </RectButton>
      )}
    >
      <ClassScheduleCard {...cardProps} />
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  removeAction: {
    backgroundColor: "#dc2626",
    justifyContent: "center",
    alignItems: "center",
    width: 88,
    borderRadius: 12,
    marginLeft: 8,
  },
  removeLabel: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
});
