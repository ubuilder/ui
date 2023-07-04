import { Button, View } from "../../components/index.js";
import { DocPage } from "../components/DocPage.js";
import { Section } from "../components/Section.js";

export default function () {
  return DocPage({ name: "View" }, [
    Section({ title: "View", description: "This is View component" }, [
      Button({ onClick: 'alert("clicked")' }, "Click"),
    ]),
    Section({title: 'width', description: 'You can change width of all elements using w property'}, [




      View({border: true, m: 'xs', borderColor: 'primary', w: 0}, 'Width = 0'),
      View({border: true, m: 'xs', borderColor: 'secondary', w: 50}, 'Width = 50'),
      View({border: true, m: 'xs', borderColor: 'success', w: 100}, 'Width = 100'),
      View({border: true, m: 'xs', borderColor: 'error', w: 'auto'}, 'Width = auto'),
      View({border: true, m: 'xs', borderColor: 'warning', w: 'xxs'}, 'Width = xxs'),
      View({border: true, m: 'xs', borderColor: 'info', w: 'xs'}, 'Width = xs'),
      View({border: true, m: 'xs', borderColor: 'dark', w: 'sm'}, 'Width = sm'),
      View({border: true, m: 'xs', borderColor: 'light', w: 'md'}, 'Width = md'),
      View({border: true, m: 'xs', textColor: 'secondary', w: 'lg'}, 'Width = lg'),
      View({border: true, m: 'xs', textColor: 'success', w: 'xl'}, 'Width = xl'),
      View({border: true, m: 'xs', textColor: 'error', w: '2xl'}, 'Width = 2xl'),
      View({border: true, m: 'xs', textColor: 'warning', w: '3xl'}, 'Width = 3xl'),
      View({border: true, m: 'xs', textColor: 'info', w: '4xl'}, 'Width = 4xl'),
      View({border: true, m: 'xs', textColor: 'dark', w: '5xl'}, 'Width = 5xl'),
      View({border: true, m: 'xs', textColor: 'light', w: '6xl'}, 'Width = 6xl'),

    ]),
    Section({title: 'height', description: 'You can change height of all elements using h property'}, [


      View({border: true, m: 'xs', borderColor: 'primary', h: 0}, 'Height = 0'),
      View({border: true, m: 'xs', borderColor: 'secondary', h: 50}, 'Height = 50'),
      View({border: true, m: 'xs', borderColor: 'success', h: 100}, 'Height = 100'),
      View({border: true, m: 'xs', borderColor: 'error', h: 'auto'}, 'Height = auto'),
      View({border: true, m: 'xs', borderColor: 'warning', h: 'xxs'}, 'Height = xxs'),
      View({border: true, m: 'xs', borderColor: 'info', h: 'xs'}, 'Height = xs'),
      View({border: true, m: 'xs', borderColor: 'dark', h: 'sm'}, 'Height = sm'),
      View({border: true, m: 'xs', borderColor: 'light', h: 'md'}, 'Height = md'),
      View({border: true, m: 'xs', bgColor: 'primary', h: 'lg'}, 'Height = lg'),
      View({border: true, m: 'xs', bgColor: 'secondary', h: 'xl'}, 'Height = xl'),
      View({border: true, m: 'xs', bgColor: 'success', h: '2xl'}, 'Height = 2xl'),
      View({border: true, m: 'xs', borderRadius: 'xs', bgColor: 'error', h: '3xl'}, 'Height = 3xl'),
      View({border: true, m: 'xs', borderRadius: 'sm', bgColor: 'warning', h: '4xl'}, 'Height = 4xl'),
      View({border: true, m: 'xs', borderRadius: 'md', bgColor: 'info', h: '5xl'}, 'Height = 5xl'),
      View({border: true, m: 'xs', borderRadius: 'lg', bgColor: 'dark', h: '6xl'}, 'Height = 6xl'),
      View({border: true, m: 'xs', borderRadius: 'xl', bgColor: 'light', h: '6xl'}, 'Height = 6xl'),

    ]),
    Section({title: 'Flex'}, [
      View({p: 'sm', d: 'flex', wrap: true, flexDirection: 'row', flexDirectionLg: 'column', border: true, align: 'center', justify: 'between', gap: 'sm'}, [
        View({w: '3xl', h: '3xl', textColor: 'light', bgColor: 'primary'}, 'Primary'),        
        View({w: '3xl', h: '3xl', textColor: 'light', bgColor: 'secondary'}, 'Secondary'),
        View({w: '3xl', h: '3xl', textColor: 'light', bgColor: 'success'}, 'Success'),
        View({w: '3xl', h: '3xl', textColor: 'light', bgColor: 'success'}, 'Success'),
        View({w: '3xl', h: '3xl', textColor: 'light', bgColor: 'success'}, 'Success'),
        View({w: '3xl', h: '3xl', textColor: 'light', bgColor: 'success'}, 'Success'),

        View({w: '3xl', h: '3xl', textColor: 'light', bgColor: 'success'}, 'Success'),
        View({w: '3xl', h: '3xl', textColor: 'light', bgColor: 'success'}, 'Success'),
      ])
    ])
  ]);
}
