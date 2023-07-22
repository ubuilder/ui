import {
  computePosition,
  autoUpdate,
  flip,
  shift,
  offset,
  arrow,
} from "@floating-ui/dom";

//tooltip using floating-ui
export function Tooltip(Alpine) {
  Alpine.directive("tooltip", (el) => {
    const target =
      document.querySelector(el.getAttribute("u-tooltip-target")) ?? el.parentNode;
    const floatingEl = el;

    target.setAttribute('u-tooltip-reference', '')
    
    const offsetValue = el.getAttribute("u-tooltip-offset") ?? 0;
    const placement = el.getAttribute("u-tooltip-placement") ?? "bottom";
    const margin = el.getAttribute("u-tooltip-margin") ?? 4;
    const arrowMargin = el.getAttribute("u-tooltip-arrow-margin") ?? 4;
    const trigger = el.getAttribute("u-tooltip-trigger") ?? "hover";

    const arrowEl = el.querySelector("[u-tooltip-arrow]");

    let timer;
    let cleanUp;

    function updatePosition() {
      computePosition(target, floatingEl, {
        placement,
        middleware: [
          offset(arrowEl ? 6 : offsetValue),
          flip(),
          shift({ padding: margin }),
          arrowEl ? arrow({ element: arrowEl, padding: arrowMargin }) : "",
        ],
      }).then(({ x, y, placement, middlewareData }) => {
        Object.assign(floatingEl.style, {
          left: `${x}px`,
          top: `${y}px`,
        });

        // Accessing the data
        if (!arrowEl) return;
        const { x: arrowX, y: arrowY } = middlewareData.arrow;

        const staticSide = {
          top: "bottom",
          right: "left",
          bottom: "top",
          left: "right",
        }[placement.split("-")[0]];

        Object.assign(arrowEl.style, {
          left: arrowX != null ? `${arrowX}px` : "",
          top: arrowY != null ? `${arrowY}px` : "",
          right: "",
          bottom: "",
          [staticSide]: "-4px",
        });
      });
    }

    Alpine.bind(target, () => ({
      "u-data"() {
        return {
          show() {
            clearTimeout(timer);

            Object.assign(el.style, {
              display: "block",
            });
            cleanUp = autoUpdate(target, floatingEl, () => {
              updatePosition();
            });
          },
          hide() {
            clearTimeout(timer);

            timer = setTimeout(() => {
              Object.assign(el.style, {
                display: "none",
              });
              if (cleanUp) {
                cleanUp();
              }
            }, 150);
          },
          toggle() {
            if (el.style.display === "block") {
              hide(this);
            } else {
              show(this);
            }
          },
        };
      },
    }));

    if (trigger == "click") {
      Alpine.bind(target, () => ({
        "u-on:focus"() {
          this.show();
        },
        "u-on:blur"() {
          this.hide();
        },
        "u-on:click"() {
          // this.toggle();
        },
      }));
    } else {
      Alpine.bind(target, () => ({
        "u-on:mouseenter"() {
          this.show();
        },
        "u-on:mouseleave"() {
          this.hide();
        },
      }));
    }
  });
}
