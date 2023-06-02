import {
  Button,
  ButtonGroup,
  Card,
  CardActions,
  CardBody,
  CardFooter,
  Input,
  View,
} from "../../components/index.js";
import { Base } from "../../utils.js";
import { DocPage } from "../components/DocPage.js";

const Checkbox = Base(($props, $slots) => {
  const { label, disabled, readonly } = $props;
  delete $props["label"];
  delete $props["disabled"];
  delete $props["readonly"];

  $props.component = "checkbox-wrapper";
  $props.type = "checkbox";

  return View($props, [
    label && View({ component: "checkbox-label", tag: "label" }, label),
    View({ tag: "input", type: "checkbox", disabled, readonly }),
  ]);
});

const Form = Base(($props, $slots) => {
  $props.method = "POST";
  return View({ ...$props, tag: "form", component: "form" }, $slots);
});

export default function ({ url, params, pathname } = {}) {
  return DocPage({ title: "Login Example" }, [
    Form(
      { action: "login" },
      Card({ title: "Login" }, [
        CardBody([
          Input({ name: "username", label: "Username", required: true }),
          Input({ name: "password", label: "Password", type: "password" }),
          Checkbox({ name: "remember", label: "Remember Me" }),
        ]),
        CardFooter([
          CardActions([
            ButtonGroup([
              Button({ link: true, href: "/forgot" }, "Forgot Password"),
              Button({ color: "primary", type: "submit" }, "Login"),
            ]),
          ]),
        ]),
      ])
    ),
  ]);
}
