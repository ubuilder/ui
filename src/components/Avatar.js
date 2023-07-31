import { Base, extract } from "../utils.js";
import { View } from "./View.js";
import { Image } from "./Image.js";

export const Avatar = Base({
  render($props, $slots) {
    const { props, cssProps, restProps } = extract($props, {
      props: {
        tag: "span",
        component: "avatar",
        size: "md",
        color: "light",
        src: undefined,
        alt: undefined,
      },
      cssProps: {
        size: "md",
        color: undefined,
      },
    });

    const content = props.src
      ? View(
          { ...props, cssProps, ...restProps },
          Image({
            src: props.src,
            alt: props.alt,
            component: props.component + "-image",
          })
        )
      : View({ ...props, cssProps, ...restProps }, $slots);

    return content;
  },
});
