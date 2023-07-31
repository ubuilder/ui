import Pikaday from "pikaday";
import Jalaali from "jalaali-js";
import moment from "moment";

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
    const newDate = {
      year: date.getFullYear(),
      month: date.getMonth() + 1, 
      date: date.getDate()
    }
    return `${newDate.year}/${newDate.month}/${newDate.date}`;
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
    ],
  },
};

//bind picker to input element
export function Datepicker(Alpine) {
  Alpine.directive("datepicker", (el) => {
    const type = el.getAttribute("u-datepicker-type");
    const range = el.getAttribute("u-datepicker-range");
    const format = el.getAttribute("u-datepicker-format");
    const newOptions = el.getAttribute("u-datepicker-options");
    const inputName = el.getAttribute("name");
    const value = el.getAttribute("value");
    const model = el.getAttribute("u-datepicker-model");
    

    console.log("type:", type);
    console.log("range:", range);
    console.log("inputName:", inputName);
    console.log("value:", value);
    console.log("model:", model);
    console.log("format:", format);
    console.log("new options:", newOptions);
    let options = {
      field: el,
      defaultDate: value ? new Date(value.toString()) : new Date(),
      format: format ?? "YYYY/MM/DD",
      yearRange: JSON.parse(range),
      onSelect: function (date) {
        console.log('onselect set value: ', picker.toString())
        el.value = picker.toString()
        el.dispatchEvent(new Event('input'))
      },
      showDaysInNextAndPreviousMonths: true,
      theme: 'u-datepicker-theme'
    };

    if (type === "jalaliAF") {
      options = { ...options, ...i18nAF };
    }
    if (type === "jalaliIR") {
      options = { ...options, ...i18nIR };
    }

    if (newOptions) options = newOptions;

    let picker = new Pikaday(options);

    if (el.form) {
      el.form.addEventListener("reset", () => {
        el.value = "";
        el.dispatchEvent(new Event("input"));
      });
    }

    if(model || inputName){
      Alpine.bind(el, () => ({
        "u-model": model? model : inputName
      }));
    }

    Alpine.bind(el, () => ({
      "u-effect"() {
        // listening for $data changes
        if (inputName && (this[inputName] !== picker.toString())) {
          console.log('inpuname value set: ', el.value)
          picker.setDate(el.value ? el.value : "");
        }
        //listening for model changed
        if (model && (this[model] !== picker.toString())) {
          console.log('model value set: ', this[model])
          picker.setDate(this[model] ? this[model] : "");
        }
      },
      "u-on:input"() {
        if (el.value.toString() !== picker.toString()) {
          console.log('on input value set: ', el.value)
          picker.setDate(el.value);
        }
      },
    }));
  });
}
