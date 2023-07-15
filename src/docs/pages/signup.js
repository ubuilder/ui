import {
  Button,
  ButtonGroup,
  Card,
  CardActions,
  CardBody,
  CardFooter,
  CardHeader,
  Checkbox,
  Col,
  Container,
  Form,
  Input,
  Row,
  View,
} from "../../components/index.js";
import { Base } from "../../utils.js";
import { DocPage } from "../components/DocPage.js";

export default function ({ url, params, pathname } = {}) {
  return DocPage({}, [
    Container({ size: "xs", mx: "auto", mt: "xl", pt: "xl" }, [
      View(
        { tag: "h2", style: "text-align: center", mb: "md" },
        "Test project"
      ),
      Form(
        { action: "login" },
        Card([
          CardHeader({ style: "justify-content: center" }, "Login"),
          CardBody([
            Row([
              Col({ col: 12 }, [
                Input({ name: "username", label: "Username", required: true }),
              ]),
              Col({ col: 12 }, [
                Input({
                  name: "password",
                  label: "Password",
                  type: "password",
                }),
              ]),
              Col({ col: true }, [
                Checkbox({ col:true, name: "remember", text: "Remember Me" }),
              ]),
              Col({ col: 0 }, [
                Button({ color: "primary", type: "submit" }, "Login"),
              ]),
              Col(
                { col: 12 },
                View(
                  { tag: "a", href: "/components/forgot-password" },
                  "Forgot your password?"
                )
              ),
            ]),
          ]),
        ])
      ),
    ]),
  ]);
}
