import { getAttr, queryAttr, register, removeAttr, setAttr } from "./helpers";

export function Modal($el) {
  // close on backdrop click

  queryAttr($el, "u-modal-backdrop", (el) => {
    console.log("add event listener");
    el.onclick = () => {
      Modal.close($el);
    };
  });
  queryAttr($el, "u-modal-content", (el) => {
    console.log("add event listener2");

    // el.onclick = (event) => {
    //   event.stop_propagation();
    // };
  });
}

Modal.close = (el) => {
  const persistent = getAttr(el, "persistent");
  if (persistent) return;

  removeAttr(el, "u-modal-open");
};

Modal.open = (el) => {
  setAttr(el, "u-modal-open");
};

register("u-modal", Modal);
