import {
  Badge,
  Button,
  ButtonGroup,
  Card,
  CardActions,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  Icon,
  Modal,
  ModalBody,
  Table,
  TableActions,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "../../components/index.js";
import { DocPage } from "../components/DocPage.js";
import { Section } from "../components/Section.js";

export default function () {
  const data = [
    {
      id: 1,
      name: "John Doe",
      username: "johndoe",
      email: "johndoe@example.com",
      status: "active",
    },
    {
      id: 2,
      name: "Jane Smith",
      username: "janesmith",
      email: "janesmith@example.com",
      status: "active",
    },
    {
      id: 3,
      name: "Michael Johnson",
      username: "michaeljohnson",
      email: "michaeljohnson@example.com",
      status: "disabled",
    },
    {
      id: 4,
      name: "Emily Wilson",
      username: "emilywilson",
      email: "emilywilson@example.com",
      status: "active",
    },
  ];
  const content = Card(
    {
      script: `
    function removeUser(id) {
        console.log('should remove user with id: ' + id)
    }
    function editUser(id) {
        console.log('should edit user with id: ' + id)
    }
    
    function addUser() {
        console.log('should add user')
    }
    `,
    },
    [
      CardHeader([
        CardTitle("List of Users"),
        Button({ onClick: "$modal.open('add-user')" }, [
          Icon("plus"),
          "Add User",
        ]),
      ]),
      CardBody([
        Table([
          TableHead([
            TableCell("Id"),
            TableCell("Name"),
            TableCell("Username"),
            TableCell("Email"),
            TableCell("Status"),
            TableCell("Actions"),
          ]),
          TableBody(
            data.map((row) =>
              TableRow([
                TableCell(row.id),
                TableCell(row.name),
                TableCell(row.username),
                TableCell(row.email),
                TableCell([
                  row.status === "active"
                    ? Badge({ color: "success" }, "Active")
                    : Badge({ color: "error" }, "Disabled"),
                ]),
                TableCell([
                  TableActions([
                    Button({ onClick: `editUser(${row.id})`, color: "info" }, [
                      Icon("pencil"),
                    ]),
                    Button(
                      { onClick: `removeUser(${row.id})`, color: "error" },
                      [Icon("trash")]
                    ),
                  ]),
                ]),
              ])
            )
          ),
        ]),
      ]),
    ]
  );

  const modal = Modal({ name: "add-user", open: false }, [
    ModalBody("Add user"),
    CardFooter([
      CardActions([
        ButtonGroup([
          Button({ onClick: "$modal.close()" }, "Cancel"),
          Button(
            { onClick: "addUser(); closeAddModal()", color: "primary" },
            "Next"
          ),
        ]),
      ]),
    ]),
  ]);

  return DocPage({ component: "Table" }, [
    Section({ name: "default" }, [content, modal]),
  ]);
}
