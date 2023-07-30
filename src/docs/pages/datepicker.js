
import { DocPage } from "../components/DocPage.js";
import { Section } from "../components/Section.js";
import { Preview } from "../components/Preview.js";
import {
  View,
  Form,
  Button,
  DatePicker
} from "../../components/index.js";

export default function () {
  return DocPage({ name: "datepicker" }, [
    Section(
      {
        title: "default datepicker",
        description: "this simple datepicker with default values",
      },
      DatePicker(),
    ),
  ])
}
