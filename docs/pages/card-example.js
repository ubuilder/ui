import { Badge } from "../../src/Badge.js";
import { Card, CardBody, CardTitle } from "../../src/Card.js";
import { View } from "../../src/View.js";
import { DocPage } from "../components/DocPage.js";

const RepoCard = ({
  title,
  description,
  language,
  stars,
  issueCount,
  date,
}) => {
  return Card(
    {},
    CardBody(
      {},
      CardTitle({ mb: "xs" }, title),
      description,
      View({ style: "display: flex; gap: 8px" }, [
        Badge({ color: "primary", me: "sm" }),
        language,
        View({}, stars + " Stars"),
        View({}, issueCount + " issue needs help"),
        View({}, "Updated " + date),
      ])
    )
  );
};

export default () => {
  return DocPage(
    { name: "Card Example" },
    RepoCard({
      title: "theOehrly/Fast-F1",
      description:
        "FastF1 is a python package for accessing and analyzing Formula 1 results, schedules, timing data and telemetry",
      language: "Python",
      stars: 303,
      issueCount: 1,
      date: "May 27",
    })
  );
};
