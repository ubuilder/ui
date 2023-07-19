import { DocPage } from "../components/DocPage.js";
import { Section } from "../components/Section.js";
import { DatePicker } from "../../components/DatePicker.js";

export default function () {
  return DocPage({ name: "Date picker" }, [
    Section({ title: "date picker", description: "simple date picker" }, [   
      DatePicker({ name: "date", col: 6, ['u-on:change']: "console.log(date)"}),
    ]),
  ]);
}
