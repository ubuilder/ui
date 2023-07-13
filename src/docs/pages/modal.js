import {
    Avatar,
    Button,
    Modal,
    ModalBody,
    View
  } from "../../components/index.js";
  
  import { DocPage } from "../components/DocPage.js";
  
  const avatar = ({ title, description }) => {
      return View({d: 'flex', wrap: true, gap: 'xs'},[
        Button({'u-on:click': '$modal.open(1)'}, 'Open Modal 1'),
        Button({'u-on:click': "$modal.open('abc')"}, 'Open Modal 2'),
        Modal({name: '1'}, [
            ModalBody([
                View({p: 'md', bgColor: 'success'}, 'Modal 1')
            ])
        ]),
        Modal({name: 'abc', open: true}, [
            ModalBody([
                View({p: 'md', bgColor: 'info'}, 'Modal 2')
            ])
        ])
      ])
  };
  
  export default function () {
    return DocPage({ name: "avatar" }, [avatar("simple-avatar", "desc....")]);
  }
  