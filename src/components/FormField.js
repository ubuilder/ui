import { Base, extract } from "../utils.js";
import { View } from "./View.js";
import { Col } from "./GridSystem.js";

export const FormField = Base({
  render($props, $slots) {
    const {labelProps, colProps, descriptionProps, props, restProps} = extract($props, {
      labelProps: {},
      descriptionProps: {},
      colProps: {
        col: 12
      },
      props: {
        label: undefined,
        name: undefined,
        description: undefined,  
      },
    })

    labelProps.tag = 'label'
    labelProps.component = 'form-field-label'
    labelProps.for = props.name
    
    descriptionProps.tag = 'span'
    descriptionProps.component = 'form-field-description'

    colProps['u-form-field'] = ''

    return Col({...restProps, ...colProps, component: 'col'}, [
      props.label && View(labelProps, props.label),
      props.description && View(descriptionProps, props.description),
      $slots,
    ]);
  },
});
