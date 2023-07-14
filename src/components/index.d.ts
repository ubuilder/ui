type Slot = string | number | Tag;

type Tag = {
  tag: string;
  props: Record<string, any>;
  slots: Slot[];
  script: string;
  toString: () => string;
  toHtml: () => string;
  toScript: () => string;
  toHead: () => string;
};



export type Colors =
  | "primary"
  | "secondary"
  | "success"
  | "error"
  | "info"
  | "warning"
  | "dark"
  | "light"
  | undefined;

export type Sizes = "xs" | "sm" | "md" | "lg" | undefined;

export type AllSizes =
  | "0"
  | 0
  | "xxs"
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "4xl"
  | "5xl"
  | "6xl"
  | undefined;

export type Component<Props, Components = {}, OwnProps = {}> = Components &
  ((props: Props & OwnProps, slots: Slot[]) => Tag);

export type WidthHeights =
  | "0"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "4xl"
  | "5xl"
  | "6xl"
  | "auto"
  | "50"
  | "100";
export type FlexDirections =
  | "row"
  | "row-reverse"
  | "column"
  | "column-reverse";
export type Jusitfies =
  | "start"
  | "center"
  | "end"
  | "between"
  | "evenly"
  | "around";
export type Aligns = "start" | "center" | "end" | "baseline" | "stretch";
export type Displays =
  | "flex"
  | "inline"
  | "block"
  | "grid"
  | "contents"
  | "inline-flex"
  | "inline-block"
  | "none";

export type View<Props, Components = {}> = Component<
  Props,
  Components,
  {
    tag: string;
    component: string;
    cssProps: Record<string, string | number | boolean>;
    bgColor: Colors;
    textColor: Colors;
    borderRadius: Sizes;
    borderColor: Colors;
    borderSize: Sizes;
    d: Displays;
    dXs: Displays;
    dSm: Displays;
    dMd: Displays;
    dLg: Displays;
    dXl: Displays;
    align: Aligns;
    alignSelf: Aligns;
    justify: Jusitfies;
    justifySelf: Jusitfies;
    p: AllSizes;
    px: AllSizes;
    py: AllSizes;
    pt: AllSizes;
    pb: AllSizes;
    ps: AllSizes;
    pe: AllSizes;
    m: AllSizes;
    mx: AllSizes;
    my: AllSizes;
    mt: AllSizes;
    mb: AllSizes;
    ms: AllSizes;
    me: AllSizes;
    onClick: Function;
    onMount: Function;
    onChange: Function;
    onInput: Function;
    flexDirection: FlexDirections;
    flexDirectionXs: FlexDirections;
    flexDirectionSm: FlexDirections;
    flexDirectionMd: FlexDirections;
    flexDirectionLg: FlexDirections;
    flexDirectionXl: FlexDirections;
    gap: Sizes;
    wrap: boolean;
    w: WidthHeights;
    h: WidthHeights;
    [x: string]: any;
  }
> & {extend: ((a: any, b: any) => string)}

/**
 * Accordions Component
 */
declare const Accordions: View<{persistent: boolean}>;

/**
 * Accordion Component
 */
declare const Accordion: View<{header: Slot, body: Slot}>

/**
 * AccordionHeader component
 */
declare const AccordionHeader: View<{title: string}>

/**
 * AccordionBody component
 */
declare const AccordionBody: View<{}>


/**
 * Avatar Component
 */
declare const Avatar: View<{
  size: Sizes,
  color: Colors,
  src: string,
  alt: string
}>

/**
 * Badge Component
 */
declare const Badge: View<{
  size: Sizes,
  color: Colors,
}>

/**
 * Breadcrumb Component
 */
declare const Breadcrumb: View<{}>

/**
 * BreadcrumbItem Component
 */
declare const BreadcrumbItem: View<{active: boolean, disabled: boolean, href: string}>


/**
 * ButtonGroup Component
 */
declare const ButtonGroup: View<{ compact: boolean }>;

/**
 * Button Component
 */
declare const Button: View<{ color: Colors; size: Sizes, link: boolean, href: string }>;

/**
 * CardHeader Component
 */
declare const CardHeader: View<{}>;

/**
 * CardTitle Component
 */
declare const CardTitle: View<{}>;

/**
 * CardFooter Component
 */
declare const CardFooter: View<{}>;

/**
 * CardBody Component
 */
declare const CardBody: View<{}>;

/**
 * CardActions Component
 */
declare const CardActions: View<{}>;

/**
 * Card Component
 */
declare const Card: View<{ title: string }>;

/**
 * Divider Component
 */
declare const Divider: View<{ color: Colors }>;

/**
 * Input Component
 */
declare const Input: View<{
  value: string;
  type: string;
  placeholder: string;
  readonly: boolean;
  disabled: boolean;
  label: string;
}>;

/**
 * Icon Component
 *
 * todo: add color
 */
declare const Icon: View<{ size: Sizes; name: string }>;

/**
 * Modal Component
 */
declare const Modal: View<{ open: boolean; persistent: boolean }>;

/**
 * ModalBody Component
 */
declare const ModalBody: View<{}>;
