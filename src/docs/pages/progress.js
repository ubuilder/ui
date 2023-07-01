import { Progress, View } from "../../components/index.js";

import { DocPage } from "../components/DocPage.js";

const progress = ({ title, description }) => {
  return View({ style: "display: flex; flex-direction: column; gap: 12px" }, [
    Progress({ color: "error", value: 10 }, "edriss"),
    Progress({ color: "secondary", value: 25 }, "edriss"),
    Progress({ color: "success", value: 50 }, "edriss"),
    Progress({ color: "primary", value: 75 }, "edriss"),
    Progress({ color: "warning", value: 100 }, "edriss"),
    Progress({ color: "dark", value: 90 }, "edriss"),
    Progress({ color: "light", value: 95 }, "edriss"),
  ]);
};

export default function () {
  return DocPage({ name: "progress" }, [
    progress("simple-progress", "desc...."),
  ]);
}
