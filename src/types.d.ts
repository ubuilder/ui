
type Slot = string | number | Tag

type Tag = {
    tag: string,
    props: Record<string, any>,
    slots: Slot[],
    script: string
}

export type Component<Props> = (props: Props, slots: Slot[]) => Tag

export type View<Props> = Component<Props & { tag: string, component: string, cssProps: Record<string, string | number | boolean> }>

export type Button = View<{ color: string, onClick: Function }>