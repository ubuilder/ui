import Quill from "quill";

//textEditor  using Quill library
//bind textarea to editor
// export function TextEditor(Alpine) {
//     Alpine.directive("texteditor",  (el) => {
//       const target = el.hasAttribute('u-texteditor-target')?el.querySelector(el.getAttribute('u-texteditor-target')): el.querySelector('[u-texteditor-target]');
//       const textarea = el.querySelector('[u-texteditor-textarea]')
//       const textareaName = textarea.getAttribute('name')

//       const placeholder = el.getAttribute('u-texteditor-placeholder');
//       const value = el.getAttribute('u-texteditor-value')
//       const toolbar = el.getAttribute('u-texteditor-toolbare')
//       const type = el.getAttribute('u-texteditor-type')
//       const model = el.getAttribute('u-texteditor-model')

//       const types = {
//         basic: undefined,
//         simple: [
//           [{ header: [1, 2, 3, 4, 5, 6, false] }],
//           ["bold", "italic", "underline", "strike"],
//           ["blockquote", "code-block"],
//         ],
//         standard: [
//           [{ header: [1, 2, 3, 4, 5, 6, false] }],
//           ["bold", "italic", "underline", "strike"],
//           ["blockquote", "code-block"],
//           [{ list: "ordered" }, { list: "bullet" }],
//           [{ direction: "rtl" }],
//           [{ size: ["small", false, "large", "huge"] }],
//           [{ color: [] }, { background: [] }],
//           [{ font: [] }],
//           [{ align: [] }],
//           ["clean"],
//         ],
//         advanced: [
//           [{ header: [1, 2, 3, 4, 5, 6, false] }],
//           ["bold", "italic", "underline", "strike"],
//           ["blockquote", "code-block"],
//           [{ list: "ordered" }, { list: "bullet" }],
//           [{ script: "sub" }, { script: "super" }],
//           [{ indent: "-1" }, { indent: "+1" }],
//           [{ direction: "rtl" }],
//           [{ size: ["small", false, "large", "huge"] }],
//           [{ header: [1, 2, 3, 4, 5, 6, false] }],
//           [{ color: [] }, { background: [] }],
//           [{ font: [] }],
//           [{ align: [] }],
//           ["clean"],
//         ],
//       };

//       let quill = new Quill(target, {
//         modules: {
//           toolbar: toolbar? toolbar: types[type],
//         },
//         theme: "snow",
//         placeholder,
//       });

//       Alpine.bind(el, () => ({
//         "u-init"() {
//           console.log('model',model)
//           console.log('model value',this[model])
//           console.log('value',value)
//           console.log('textarea name',textareaName)
//           console.log('$data name',this[textareaName])

//           quill.on("text-change", (delta, old, source) => {
//             console.log('text-change fired')
//             const innerHtml = quill.root.innerHTML
//             textarea.value = innerHtml;
//             //setting form $data
//             if(this[textareaName]){
//               console.log('old $data', this[textareaName])
//               this[textareaName] = innerHtml ;
//               console.log('new $data', this[textareaName])

//             }
//             //setting $model
//             if(model){
//               console.log('old model', this[model])
//               this[model] = innerHtml;
//               console.log('new model', this[model])
//             }
//           });
//           // set initial text
//           if(value){
//             console.log('value set', value)
//             quill.setText( value + '\n', 'api')
//           }

//         },
//         "u-effect"(){
//           //listening for $data changes
//           if(this[textareaName] && (this[textareaName] !== quill.root.innerHTML)){
//             console.log('$data property changed', this[textareaName])
//             quill.root.innerHTML = this[textareaName]
//             // quill.setText(this[textareaName]?? '')
//           }
//           //listening for $model changed
//           if(model && (this[model] !== quill.root.innerHTML)){
//             console.log('model changed', this[model], quill.root.innerHTML)
//             quill.root.innerHTML = this[model]
//             // quill.setText(this[model]?? '')
//           }
//         }
//       }));
//   });
// }

//bine editor to textarea
export function TextEditor(Alpine) {
  Alpine.directive("texteditor", (el) => {
    const target = el.hasAttribute("u-texteditor-target")
      ? el.querySelector(el.getAttribute("u-texteditor-target"))
      : el.querySelector("[u-texteditor-target]");
    const textarea = el.querySelector("[u-texteditor-textarea]");
    const textareaName = textarea.getAttribute("name");

    const placeholder = textarea.getAttribute("placeholder");
    const readOnly = el.hasAttribute("u-textarea-readonly");
    const disabled = textarea.hasAttribute("disabled");
    const value = textarea.getAttribute("value");
    const toolbar = el.getAttribute("u-texteditor-toolbare");
    const type = el.getAttribute("u-texteditor-type");
    const model = el.getAttribute("u-texteditor-model");

    const types = {
      basic: undefined,
      simple: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        ["bold", "italic", "underline", "strike"],
        ["blockquote", "code-block"],
      ],
      standard: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        ["bold", "italic", "underline", "strike"],
        ["blockquote", "code-block"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ direction: "rtl" }],
        [{ size: ["small", false, "large", "huge"] }],
        [{ color: [] }, { background: [] }],
        [{ font: [] }],
        [{ align: [] }],
        ["clean"],
      ],
      advanced: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        ["bold", "italic", "underline", "strike"],
        ["blockquote", "code-block"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ script: "sub" }, { script: "super" }],
        [{ indent: "-1" }, { indent: "+1" }],
        [{ direction: "rtl" }],
        [{ size: ["small", false, "large", "huge"] }],
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        [{ color: [] }, { background: [] }],
        [{ font: [] }],
        [{ align: [] }],
        ["clean"],
      ],
    };

    let quill = new Quill(target, {
      modules: {
        toolbar: toolbar ? toolbar : types[type],
      },
      theme: "snow",
      placeholder,
      readOnly: readOnly ?? disabled,
    });

    

    quill.on("text-change", (delta, old, source) => {
      console.log("text-change fired");
      const innerHtml = quill.root.innerHTML;
      innerHtml === "<p><br></p>"
        ? (textarea.value = "")
        : (textarea.value = innerHtml);
      textarea.dispatchEvent(new Event("input"));
    });
    
    if (value) quill.root.innerHTML = value;

    if (textarea.form) {
      textarea.form.addEventListener("reset", () => {
        textarea.value = "";
        textarea.dispatchEvent(new Event("input"));
      });
    }

    Alpine.bind(textarea, () => ({
      "u-model": model ? model : textareaName,
      "u-on:input"() {
        if (textarea.value !== quill.root.innerHTML || textarea.value === "") {
          quill.root.innerHTML = textarea.value;
        }
      },
    }));

    Alpine.bind(el, () => ({
      "u-effect"() {
        // listening for $data changes
        if (textareaName && this[textareaName] !== quill.root.innerHTML) {
          quill.root.innerHTML = textarea.value ? textarea.value : "";
        }
        //listening for $model changed
        if (model && this[model] !== quill.root.innerHTML) {
          quill.root.innerHTML = this[model] ? this[model] : "";
        }
      },
    }));
  });
}
