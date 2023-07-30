import Pikaday from "pikaday";
import Jalaali from 'jalaali-js';

const i18nIR = {
  format: "YYYY/MM/DD",
  defaultDate: new Date(
    Jalaali.toJalaali(new Date()).jy,
    Jalaali.toJalaali(new Date()).jm,
    Jalaali.toJalaali(new Date()).jd
  ),
  yearRange: [1300, 1420],
  isRTL: true,
  firstDay: 6,
  i18n: {
    previousMonth: "ماه قبل",
    nextMonth: "ماه بعد",
    months: [
      "فروردین",
      "اردیبهشت",
      "خرداد",
      "تیر",
      "مرداد",
      "شهریور",
      "مهر",
      "آبان",
      "آذر",
      "دی",
      "بهمن",
      "اسفند",
    ],
    weekdays: [
      "یک‌شنبه",
      "دوشنبه",
      "سه‌شنبه",
      "چهارشنبه",
      "پنج‌شنبه",
      "جمعه",
      "شنبه",
    ],
    weekdaysShort: ["ی", "د", "س", "چ", "پ", "ج", "ش"],
  },
  toString(date, format) {
    console.log("date: ", date.getFullYear());
    const jdate = Jalaali.toJalaali(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate()
    );
    return `${jdate.jy}/${jdate.jm}/${jdate.jd}`;
  },
  parse(dateString, format) {
    const parts = dateString.split("/");
    const jdate = Jalaali.toGregorian(
      parseInt(parts[0]),
      parseInt(parts[1]),
      parseInt(parts[2])
    );
    return new Date(jdate.gy, jdate.gm - 1, jdate.gd);
  },
};

const i18nAF = {
  ...i18nIR,
  i18n: {
    ...i18nIR.i18n,
    months: [
      "حمل",
      "ثور",
      "جوزا",
      "سرطان",
      "اسد",
      "سنبله",
      "میزان",
      "عقرب",
      "قوس",
      "خدی",
      "دلو",
      "حوت",
    ]
  }
};


//bine editor to textarea
export function Datepicker(Alpine) {
  Alpine.directive("datepicker", (el) => {
    const type  = el.getAttribute('u-datepicker-type')
    let options = {
      field: el,
      format: "YYYY/MM/DD",
      onSelect: function (date) {
        console.log("Selected date: " + date);
      },
    }
    if(type === 'jalaliFA'){
      options = {...options, ...i18nAF}
    }
    if(type === 'jalaliIR'){
      options = {...options, ...i18nIR}
    }

    var picker = new Pikaday(options);
    console.log("datepicker", picker);

    // const model = el.getAttribute("u-texteditor-model");

    // if (textarea.form) {
    //   textarea.form.addEventListener("reset", () => {
    //     textarea.value = "";
    //     textarea.dispatchEvent(new Event("input"));
    //   });
    // }

    // Alpine.bind(textarea, () => ({
    //   "u-model": model ? model : textareaName,
    //   "u-on:input"() {
    //     if (textarea.value !== quill.root.innerHTML || textarea.value === "") {
    //       quill.root.innerHTML = textarea.value;
    //     }
    //   },
    // }));

    // Alpine.bind(el, () => ({
    //   "u-effect"() {
    //     // listening for $data changes
    //     if (textareaName && this[textareaName] !== quill.root.innerHTML) {
    //       quill.root.innerHTML = textarea.value ? textarea.value : "";
    //     }
    //     //listening for $model changed
    //     if (model && this[model] !== quill.root.innerHTML) {
    //       quill.root.innerHTML = this[model] ? this[model] : "";
    //     }
    //   },
    // }));
  });
}
