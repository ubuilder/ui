
type Slot = string | number | Tag

type Tag = {
    tag: string,
    props: Record<string, any>,
    slots: Slot[],
    script: string
}

export type Component<Props, Components = {}> = Components & ((props: Props, slots: Slot[]) => Tag)

export type View<Props, Components = {}> = Component<Props & { 
    tag: string, 
    component: string, 
    cssProps: Record<string, string | number | boolean>, 
    onClick: Function, 
    onMount: Function, 
    onChange: Function, 
    onInput: Function, 
    [x: string]: any
}, Components>

/**
 * ButtonGroup Component
 */
export type ButtonGroup = View<{ color: string }>

/**
 * Button Component
 */
export type Button = View<{ color: string }, { Group: ButtonGroup }>


type CardHeader = View<{}>
type CardTitle = View<{}>
type CardFooter = View<{}>
type CardBody = View<{}>
type CardActions = View<{}>

export type Card = View<{ title: string }, { Body: CardBody, Header: CardHeader, Title: CardTitle, Footer: CardFooter, Actions: CardActions }>
