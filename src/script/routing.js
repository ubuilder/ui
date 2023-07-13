
import morphdom from "morphdom";

export function ClientSideRouting(Alpine) {
    function findAnchorTag(element) {
      if (element.tagName === "HTML") return null;
      if (element.tagName === "A") return element;
      else return findAnchorTag(element.parentElement);
    }
  
    async function updateRoute(pathname) {
      try {
        const html = await fetch(pathname).then((res) => res.text());
  
        morphdom(document.getElementsByTagName("html")[0], html);
  
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
        console.log("popstate", window.location.pathname);
        await updateRoute(window.location.pathname);
      });
  
  
    Alpine.magic("routing", (el) => {
      return {
        back() {
          history.back()
        },
        goto(pathname) {
          history.pushState({}, undefined, pathname);
          updateRoute(pathname)
        },
      };
    });
  }