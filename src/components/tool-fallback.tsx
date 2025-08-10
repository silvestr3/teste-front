import type { ToolCallContentPartProps } from "@assistant-ui/react";
import type { FC } from "react";

export const ToolFallback: FC<ToolCallContentPartProps> = (props) => {
    console.log(props)
  return (
    <div>
      <p>ToolFallback</p>
    </div>
  );
};