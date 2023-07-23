import {
    computePosition,
    autoUpdate,
    flip,
    shift,
    offset,
    arrow,
  } from "@floating-ui/dom";
  
  //popover using floating-ui
  export function Popover(Alpine) {
    Alpine.directive("popover", (el) => {
      const edge = el.querySelector('[u-popover-edge]');
      
      const target =
        document.querySelector(el.getAttribute("u-popover-target")) ?? el.parentNode;
      const floatingEl = el;
  
      console.log('target',target)
      console.log('floatingel',target)
      console.log('innerWrapper',edge)
      
      target.setAttribute('u-popover-reference', '')
      
      const offsetValue = el.getAttribute("u-popover-offset") ?? 0;
      const placement = el.getAttribute("u-popover-placement") ?? "bottom";
      const shiftMargin = el.getAttribute("u-popover-margin") ?? 4;
      const arrowEl = el.querySelector("[u-popover-arrow]");
      const trigger = el.getAttribute("u-popover-trigger") ?? "click";
      const arrowMargin = el.getAttribute("u-popover-arrow-margin") ?? 4;
      const flipAble = el.hasAttribute('u-popover-flip') ?? true;
      const shiftAble = el.hasAttribute('u-popover-shift') ?? true;
  
      let cleanUp;
  
      function updatePosition() {
        computePosition(target, floatingEl, {
          placement,
          middleware: [
            offset(offsetValue? offsetValue : arrowEl? 6: 0),
            flipAble? flip(): "",
            shiftAble? shift({ padding: shiftMargin }): "",
            arrowEl ? arrow({ element: arrowEl, padding: arrowMargin }) : "",
          ],
        }).then(({ x, y, placement, middlewareData }) => {
          Object.assign(floatingEl.style, {
            left: `${x}px`,
            top: `${y}px`,
          });
  
          // setting the arrow position if arrow exists
          if (arrowEl) {
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
          }

          // for persisting floatingEl when hover over it
          if(edge) {
            const edgeSide = {
              bottom: "borderBottomWidth",
              left: "borderLeftWidth",
              top: "borderTopWidth",
              right: "borderRightWidth",
            }[placement.split("-")[0]];
  
            Object.assign(edge.style, {
              borderWidth: '0px',
              [edgeSide]: `${15 + offsetValue}px`,
            });
          }
        });
      }

      Alpine.bind(target, () => ({
        "u-data"() {
          return {
            show() {
              Object.assign(el.style, {
                display: "block",
              });
              cleanUp = autoUpdate(target, floatingEl, () => {
                updatePosition();
              });
            },
            hide() {
              Object.assign(el.style, {
                display: "none",
              });
              if (cleanUp) {
                cleanUp();
              }
            },
            toggle() {
              if (el.style.display === "block") {
                hide();
              } else {
                show();
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

      //if the persistant is false
      if(!edge){
        Alpine.bind(floatingEl, () => ({
          "u-on:mouseenter"() {
            this.hide();
          },
          "u-on:focus"() {
            this.hide();
          },
        }));
      }
    });
  }
  