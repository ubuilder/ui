import { Avatar } from "../../components/index.js";
import { DocPage } from "../components/DocPage.js";
import { Preview } from "../components/Preview.js";
import { Section } from "../components/Section.js";

export default function () {
  return DocPage({ name: "Avatar" }, [
    Section({ title: "Default" }, [
      Preview(
        {
          d: "flex",
          align: "end",
          gap: "xs",
          code: `[
  Avatar('AV')
]`,
        },
        [Avatar("AV")]
      ),
    ]),
    Section({ title: "Image" }, [
      Preview(
        {
          d: "flex",
          align: "end",
          gap: "xs",
          code: `[
  Avatar({ src: 'https://avatars.githubusercontent.com/u/67925134?s=96&v=4' }, 'AV')
]`,
        },
        [Avatar({ src: 'https://avatars.githubusercontent.com/u/67925134?s=96&v=4' }, "AV")]
      ),
    ]),

    Section({ title: "Colors" }, [
      Preview(
        {
          d: "flex",
          align: "end",
          gap: "xs",
          code: `[
  Avatar({color: "primary"}, "PR"),
  Avatar({color: "secondary" }, "SE"),
  Avatar({color: "success" }, "SU"),
  Avatar({color: "warning"}, "WA"),
  Avatar({color: "info" }, "IN"),
  Avatar({color: "error" }, "ER"),
  Avatar({color: "light" }, "LI"),
  Avatar({color: "dark" }, "DA"),
]`,
        },
        [
          Avatar({color: "primary"}, 'PR'),
          Avatar({color: "secondary" }, "SE"),
          Avatar({color: "success" }, "SU"),
          Avatar({color: "warning"}, "WA"),
          Avatar({color: "info" }, "IN"),
          Avatar({color: "error" }, "ER"),
          Avatar({color: "light" }, "LI"),
          Avatar({color: "dark" }, "DA"),
        ],
      ),
    ]),

    
    Section({ title: "Sizes" }, [
      Preview(
        {
          d: "flex",
          align: "end",
          gap: "xs",
          code: `[
  Avatar({ color: "primary", size: "xs"}, "XS"),
  Avatar({ color: "primary", size: "sm"}, "SM"),
  Avatar({ color: "primary", size: "md"}, "MD"),
  Avatar({ color: "primary", size: "lg"}, "LG"),
  Avatar({ color: "primary", size: "xl"}, "XL"),
]`,
        },
        [
          Avatar({ color: "primary", size: "xs"}, "XS"),
          Avatar({ color: "primary", size: "sm"}, "SM"),
          Avatar({ color: "primary", size: "md"}, "MD"),
          Avatar({ color: "primary", size: "lg"}, "LG"),
          Avatar({ color: "primary", size: "xl"}, "XL"),        
        ]
      ),
    ]),
  ]);
}
