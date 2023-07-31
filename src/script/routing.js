
import morphdom from "morphdom";

export function ClientSideRouting(Alpine) {

  // Disable routing... (It has some bugs )
  return true;
  
    function findAnchorTag(element) {
      if (element.tagName === "HTML") return null;
      if (element.tagName === "A") return element;
      else return findAnchorTag(element.parentElement);
    }
  
    async function updateRoute(pathname) {
      try {
        const html = await fetch(pathname).then((res) => res.text());
  
        // resolve promise after morphdom completed
        morphdom(document.getElementsByTagName("html")[0], html, {
          onBeforeElUpdated(fromEl, toEl) {
              if (fromEl.isEqualNode(toEl)) {
                return false
            }
            // Do not update icon if name is same
            if(fromEl.hasAttribute('u-icon') && fromEl.getAttribute('name') === toEl.getAttribute('name')) {
              return false
            }
            if (fromEl.nodeName === "SCRIPT" && toEl.nodeName === "SCRIPT" && fromEl.getAttribute('type') === 'module') {
              var script = document.createElement('script');
              //copy over the attributes
              [...toEl.attributes].forEach( attr => { script.setAttribute(attr.nodeName ,attr.nodeValue) })

              script.innerHTML = toEl.innerHTML;
              fromEl.replaceWith(script)
              return false;
          } 
          return true;
          },
          onNodeAdded: function (node) {
            if (node.nodeName === 'SCRIPT') {
                var script = document.createElement('script');
                //copy over the attributes
                [...node.attributes].forEach( attr => { script.setAttribute(attr.nodeName ,attr.nodeValue) })

                script.innerHTML = node.innerHTML;
                node.replaceWith(script)
            }
          }
        });

        return true
      } catch (err) {
        console.log(err)
        console.log('path not found')
        location.reload()
        //
      }
    }
  
      window.addEventListener("click", async (event) => {
        
        const link = findAnchorTag(event.target);
  
        if (!link) return;
        if (link.target) return;
        if (link.hasAttribute("u-routing-skip")) return;
        event.preventDefault();
  
        const targetLocation = link.href;
        const targetPathname = new URL(targetLocation).pathname;
  
        history.pushState({}, undefined, targetPathname);
        await updateRoute(targetPathname);
  
      });
  
      window.addEventListener("popstate", async function () {
        await updateRoute(window.location.pathname);
      });
  
  
    Alpine.magic("routing", (el) => {
      return {
        back() {
          history.back()
        },
        goto(pathname) {
          history.pushState({}, undefined, pathname);
          return updateRoute(pathname)
        },
      };
    });
  }
