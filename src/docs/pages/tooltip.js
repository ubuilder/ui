import { Button } from "../../components/Button.js";
import { DocPage } from "../components/DocPage.js";
import { Section } from "../components/Section.js";
import { Col, Row } from "../../components/GridSystem.js";
import { Tooltip } from "../../components/Tooltip.js";
import { View } from "../../components/View.js";

// export default function () {
//   return DocPage({ name: "Tooltip" }, [
//     Section({ title: "Tooltip", description: "simple Tooltip" }, [
//         Row({gap: 'md', m: 'lg', p: 'lg'},[
//             Tooltip({}, [
//                 TooltipSource({}, [
//                     Button('tooltip source 1')
//                 ]),
//                 TooltipContent({}, 'tooltip  1')
//             ])
//         ]),
//         Row({gap: 'md', m: 'lg', p: 'lg'},[
//             Tooltip({}, [
//                 TooltipSource({}, [
//                     Button('tooltip source 2 ')
//                 ]),
//                 TooltipContent({}, 'tooltip content 2')
//             ])
//         ]),
//         Row({gap: 'md'},[
//             Tooltip({}, [
//                 TooltipSource({}, [
//                     Button('tooltip source 2 ')
//                 ]),
//                 TooltipContent({}, 'tooltip content 2')
//             ])
//         ]),
//         Row({gap: 'md'},[
//             Tooltip({}, [
//                 TooltipSource({}, [
//                     Button('tooltip source 2 ')
//                 ]),
//                 TooltipContent({}, 'tooltip content 2')
//             ])
//         ]),
//         Row({gap: 'md'},[
//             Tooltip({}, [
//                 TooltipSource({}, [
//                     Button('tooltip source 2 ')
//                 ]),
//                 TooltipContent({}, 'tooltip content 2')
//             ])
//         ]),
//         Row({gap: 'md'},[
//             Tooltip({}, [
//                 TooltipSource({}, [
//                     Button('tooltip source 2 ')
//                 ]),
//                 TooltipContent({}, 'tooltip content 2')
//             ])
//         ]),
//         Row({gap: 'md'},[
//             Tooltip({}, [
//                 TooltipSource({}, [
//                     Button('tooltip source 2 ')
//                 ]),
//                 TooltipContent({}, 'tooltip content 2')
//             ])
//         ]),
//         Row({gap: 'md'},[
//             Tooltip({}, [
//                 TooltipSource({}, [
//                     Button('tooltip source 2 ')
//                 ]),
//                 TooltipContent({}, 'tooltip content 2')
//             ])
//         ]),
//         Row({gap: 'md'},[
//             Tooltip({}, [
//                 TooltipSource({}, [
//                     Button('tooltip source 2 ')
//                 ]),
//                 TooltipContent({}, 'tooltip content 2')
//             ])
//         ]),
//         Row({gap: 'md'},[
//             Tooltip({}, [
//                 TooltipSource({}, [
//                     Button('tooltip source 2 ')
//                 ]),
//                 TooltipContent({}, 'tooltip content 2')
//             ])
//         ]),
//         Row({gap: 'md'},[
//             Tooltip({}, [
//                 TooltipSource({}, [
//                     Button('tooltip source 2 ')
//                 ]),
//                 TooltipContent({}, 'tooltip content 2')
//             ])
//         ]),
//         Row({gap: 'md'},[
//             Tooltip({}, [
//                 TooltipSource({}, [
//                     Button('tooltip source 2 ')
//                 ]),
//                 TooltipContent({}, 'tooltip content 2')
//             ])
//         ]),
//         Row({gap: 'md'},[
//             Tooltip({}, [
//                 TooltipSource({}, [
//                     Button('tooltip source 2 ')
//                 ]),
//                 TooltipContent({}, 'tooltip content 2')
//             ])
//         ]),
//     ]),
//   ])
// }





export default function () {
  return DocPage({ name: "Tooltip" }, [
    Section({ title: "Tooltip", description: "simple Tooltip" }, [
      Row({ gap: "md", m: "lg", p: "lg" }, [
        View({style: 'border: 1px solid gray'},[
          View("first tooltip is this"),
          Tooltip("tooltip")
      ]),
      ]),
      Row({ gap: "md", m: "lg", p: "lg" }, [
        Button([
          View("second tooltip"),
          Tooltip({ placement:"left", arrow: true},"I am an other tooltip")
        ]),
      ]),
      Row({ gap: "md", m: "lg", p: "lg" }, [
        Button([
          View("second tooltip"),
          Tooltip({trigger: 'click', placement: 'right'},"I am an other tooltip")
        ]),
      ]),
      Row({ gap: "md", m: "lg", p: "lg" }, [
        Button([
          View("second tooltip"),
          Tooltip({arrow: false, trigger: 'click', persiste: true},"I am an other tooltip")
        ]),
      ]),
      Row({ gap: "md", m: "lg", p: "lg" }, [
        Button([
          View("second tooltip"),
          Tooltip({trigger: 'click', persiste: true, placement: 'left'},"I am an other tooltip")
        ]),
      ]),
    ]),
  ]);
}