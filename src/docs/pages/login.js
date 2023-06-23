import {
  Button,
  ButtonGroup,
  Card,
  CardActions,
  CardBody,
  CardFooter,
  Checkbox,
  Container,
  Form,
  Input,
  View,
} from "../../components/index.js";
import { Base } from "../../utils.js";
import { DocPage } from "../components/DocPage.js";

export default function ({ url, params, pathname } = {}) {
  return DocPage({ title: "Login Example" }, [
    Container({ size: "xs", mx: "auto" }, [
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
                Button({ color: "primary", type: "submit" }, "Login"),
                // Button({ link: true, href: "/forgot" }, "Forgot Password"),
              ]),
            ]),
          ]),
          CardFooter([
            CardActions([
              ButtonGroup([
                Button({ link: true, href: "/forgot" }, "Forgot Password"),
              ]),
            ]),
          ]),
        ])
      ),
    ]),
  ]);
}
