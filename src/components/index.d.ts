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
>;

/**
 * Accordions Component
 */
export type Accordions = View<{persistent: boolean}>;

/**
 * Accordion Component
 */
export type Accordion = View<{header: Slot, body: Slot}>

/**
 * AccordionHeader component
 */
export type AccordionHeader = View<{title: string}>

/**
 * AccordionBody component
 */
export type AccordionBody = View<{}>


/**
 * Avatar Component
 */
export type Avatar = View<{
  size: Sizes,
  color: Colors,
  src: string,
  alt: string
}>

/**
 * Badge Component
 */
export type Badge = View<{
  size: Sizes,
  color: Colors,
}>

/**
 * Breadcrumb Component
 */
export type Breadcrumb = View<{}>

/**
 * BreadcrumbItem Component
 */
export type BreadcrumbItem = View<{active: boolean, disabled: boolean, href: string}>


/**
 * ButtonGroup Component
 */
export type ButtonGroup = View<{ compact: boolean }>;

/**
 * Button Component
 */
export type Button = View<{ color: Colors; size: Sizes, link: boolean, href: string }>;

/**
 * CardHeader Component
 */
export type CardHeader = View<{}>;

/**
 * CardTitle Component
 */
export type CardTitle = View<{}>;

/**
 * CardFooter Component
 */
export type CardFooter = View<{}>;

/**
 * CardBody Component
 */
export type CardBody = View<{}>;

/**
 * CardActions Component
 */
export type CardActions = View<{}>;

/**
 * Card Component
 */
export type Card = View<{ title: string }>;

/**
 * Divider Component
 */
export type Divider = View<{ color: Colors }>;

/**
 * Input Component
 */
export type Input = View<{
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
export type Icon = View<{ size: Sizes; name: string }>;

/**
 * Modal Component
 */
export type Modal = View<{ open: boolean; persistent: boolean }>;

/**
 * ModalBody Component
 */
export type ModalBody = View<{}>;
