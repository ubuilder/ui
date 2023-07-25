
// TODO support props that starts with $ (typescript will have something useful..) 


import type {Placement} from '@floating-ui/core'

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

export type ColorNames =   | "primary"
| "secondary"
| "success"
| "error"
| "info"
| "warning"
| "light"
| "dark"
| "base"

export type ColorValues = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 'content';

export type Colors = ColorNames | `${ColorNames}-${ColorValues}` | undefined;

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

export type ColSizes =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | true
  | undefined;

export type Col<Props = {}> = View<
  Props & {
    col: ColSizes;
    colXs: ColSizes;
    colSm: ColSizes;
    colMd: ColSizes;
    colLg: ColSizes;
    colXl: ColSizes;
    offset: ColSizes;
    offsetXs: ColSizes;
    offsetSm: ColSizes;
    offsetMd: ColSizes;
    offsetLg: ColSizes;
    offsetXl: ColSizes;
  }
>;

export type FormField<Props = {}> = Col<
  Props & {
    name: string;
    label: string;
  }
>;

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
> & { extend: (a: any, b: any) => string };


declare const tag: (tagName: string | { tag: string, props: Record<string, any>, slots: Slot[] } | Tag, props: Record<string,any>, ...slots: Slot[]) => Tag

/**
 * Accordions Component
 */
declare const Accordions: View<{ persistent: boolean }>;

/**
 * Accordion Component
 */
declare const Accordion: View<{ header: Slot; body: Slot }>;

/**
 * AccordionHeader component
 */
declare const AccordionHeader: View<{ title: string }>;

/**
 * AccordionBody component
 */
declare const AccordionBody: View<{}>;

/**
 * Avatar Component
 */
declare const Avatar: View<{
  size: Sizes;
  color: Colors;
  src: string;
  alt: string;
}>;

/**
 * Badge Component
 */
declare const Badge: View<{
  size: Sizes;
  color: Colors;
}>;

/**
 * Breadcrumb Component
 */
declare const Breadcrumb: View<{}>;

/**
 * BreadcrumbItem Component
 */
declare const BreadcrumbItem: View<{
  active: boolean;
  disabled: boolean;
  href: string;
}>;

/**
 * ButtonGroup Component
 */
declare const ButtonGroup: View<{ compact: boolean }>;

/**
 * Button Component
 */
declare const Button: View<{
  color: Colors;
  size: Sizes;
  link: boolean;
  href: string;
}>;

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
 * Col component
 */
declare const Col: Col;

/**
 * FormField component
 */
declare const FormField: FormField;

/**
 * Checkbox Component
 */
declare const Checkbox: FormField<{
  text: string;
  inline: boolean;
  checked: boolean;
}>;

/**
 * CheckboxGroup Component
 */
declare const CheckboxGroup: FormField<{
  items: (string | object)[];
  value: string[];
  text: string | ((item: any) => string);
  key: string | ((item: any) => string);
  inline: boolean;
}>;

/**
 * Switch Component
 */
declare const Switch: FormField<{
  text: string;
  inline: boolean;
  checked: boolean;
}>;

/**
 * RadioGroup Component
 */
declare const RadioGroup: FormField<{
  items: (string | object)[];
  value: string;
  text: string | ((item: any) => string);
  key: string | ((item: any) => string);
  inline: boolean;
}>;

/**
 * Select Component
 */
declare const Select: FormField<{
  items: (string | object)[];
  placeholder: string;
  multiple: boolean;
  value: string | string[];
  text: string | ((item: any) => string);
  key: string | ((item: any) => string);
}>;

/**
 * Form Component
 */
declare const Form: View<{
  method: "GET" | "POST";
  action: string;
  gutter: Sizes;
}>;

/**
 * Row Component
 */
declare const Row: View<{ gutter: Sizes }>;

/**
 * Container Component
 */
declare const Container: View<{ size: Sizes }>;

/**
 * Divider Component
 */
declare const Divider: View<{ color: Colors }>;

/**
 * Image Component
 */
declare const Image: View<{ src: string; alt: string }>;

/**
 * Input Component
 */
declare const Input: FormField<{
  value: string;
  type: string;
  placeholder: string;
  readonly: boolean;
  disabled: boolean;
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

/**
 * Progress Component
 */
declare const Progress: View<{ color: Colors; value: number }>;

/**
 * Spinner Component
 */
declare const Spinner: View<{ color: Colors; size: Sizes }>;

/**
 * Table Component
 */
declare const Table: View<{}>;

/**
 * TableBody Component
 */
declare const TableBody: View<{}>;
/**
 * TableRow Component
 */
declare const TableRow: View<{}>;

/**
 * TableHead Component
 */
declare const TableHead: View<{}>;

/**
 * TableFoot Component
 */
declare const TableFoot: View<{}>;

/**
 * TableActions Component
 * This is a wrapper element and acts like button grup
 */
declare const TableActions: View<{}>;

/**
 * TableCell Component
 */
declare const TableCell: View<{ head: boolean }>;

/**
 * Tabs component
 */
declare const Tabs: View<{}>
// declare const Tabs: View<{size: Sizes}>

/**
 * TabsPanel component
 */
declare const TabsPanel: View<{}>
// declare const TabsPanel: View<{size: Sizes}>

/**
 * TabsContent component
 */
declare const TabsContent: View<{}>
// declare const TabsContent: View<{size: Sizes}>

/**
 * TabsItem component
 */
declare const TabsItem: View<{active: boolean}>
// declare const TabsItem: View<{active: boolean,size: Sizes, label: string}>

/**
 * TabsList component
 */
declare const TabsList: View<{}>
// declare const TabsList: View<{horizontal: boolean, size: Sizes}>

/**
 * Textarea Component
 */
declare const Textarea: FormField<{placeholder: string, value: string, rows: number}>

/**
 * Tooltip Component
 */
declare const Tooltip: View<{trigger: 'click' | 'hover', placement: Placement}>

/**
 * View Component
 */
declare const View: View<{}>;

declare const Autocomplete: FormField<{
  value: string[],
  items: any[],
  key: string | ((item: any) => string)
  text: string | ((item: any) => string)
  placeholder: string
  create: boolean
  readonly: boolean
  multiple: boolean
}>

/**
 * FileUpload Component
 */
declare const FileUpload: View<{todo: true}>

/**
 * Editor Component
 */
declare const Editor: View<{todo: true}>

/**
 * Datepicker Component
 */
declare const Datepicker: View<{todo: true}>

/**
 * Slider Component
 */
declare const Slider: View<{todo: true}>
