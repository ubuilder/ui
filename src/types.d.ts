type Slot = string | number | Tag;

type Tag = {
  tag: string;
  props: Record<string, any>;
  slots: Slot[];
  script: string;
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

export type View<Props, Components = {}> = Component<
  Props,
  Components,
  {
    tag: string;
    component: string;
    cssProps: Record<string, string | number | boolean>;
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
    [x: string]: any;
  }
>;

/**
 * ButtonGroup Component
 */
export type ButtonGroup = View<{ color: Colors }>;

/**
 * Button Component
 */
export type Button = View<{ color: Colors; size: Sizes }>;

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
 * Badge Component
 */
export type Badge = View<{ size: Sizes; color: Colors }>;

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
