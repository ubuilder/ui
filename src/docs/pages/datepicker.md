# DatePicker


## default DatePicker

this simple DatePicker with default values

```js
DatePicker();
```
## default initial value 

this simple DatePicker with initial value set

```js
DatePicker({ value: "2002/02/02" });
```
## placehoder and lable

```js
DatePicker({ placeholder: "yyyy/MM/dd", label: "select Date of birth" });
```

## date Range

the minimum and mazximum years that you can select from in year dropdown. it should be a array of tow elements. e.g: [2000, 2010].

```js
DatePicker({ range: "[2000, 2010]", placeholder: 'you can select from year 2000 to 2010'});
```


## DatePicker value binding

you can bind the value of datePicker input to a valrialble by $model propery, just like rest of input elements.



```js
View({$data: {birth: ''}},[
  View({$text: 'birth'}),
  DatePicker({$model: 'birth'}),
  Button({onClick: "birth= ''" }, 'clear'),
  Button({onClick: "birth= '2023/5/1'" }, 'reset birth'),
]),
```


## DatePicker in form

just like other form element it can send the form data, under the hood it acts as Input tag of type 'date'.

```js
Form({ p: "sm" }, [
  View({ tag: "fieldset" }, [
    View({ tag: "legend" }, "Send your comment"),
    Input({ col: 12, label: "User Name" }),
    Input({ col: 12, label: "email" }),
    DatePicker({ col: 12, label: "Birth" }),

    Button({ type: "reset", color: "error" }, "reset"),
    Button({ type: "submit", color: "primary" }, "Submit"),
  ]),
]);
```

## texteditor in a form with name and $data binding

just like rest of form inputs texteditor value can be bound with form $data

```js
Form(
  {
    $data: {
      username: "",
      password: "",
      birth: "",
    },
    p: "sm",
  },
  [
    View({ tag: "fieldset" }, [
      View({ tag: "legend" }, "Send your Comment"),
      Input({ name: "username", label: "User Name" }),
      Input({ name: "password", label: "Password" }),
      DatePicker({ name: "birth", label: "Date of birth" }),
      Col({ border: true, p: "sm", style: "width:100%" }, [
        View([
          View(["Username: ", View({ tag: "span", $text: "username" })]),
          View(["password: ", View({ tag: "span", $text: "password" })]),
          View(["birth: ", View({ tag: "span", $text: "birth" })]),
        ]),
      ]),
      Button({ type: "reset", color: "error" }, "Reset"),
      Button({ type: "submit", color: "primary" }, "Submit"),
    ]),
  ]
);
```

## DatePicker Calander type

By defalut the DatePicker supports tow types of Calanders: Gregorian and Jalali that has tow other types: JalaliAF and JalaliIR,
the defalut type is Gregorian

- Gregorian the defalut value
- JalaliAF
- JalaliIR

## Gregorian type

this is the defalut tpye whick does not need to specify, to show, in here we explicitely set it.

```js
DatePicker({
  placeholder: "yyyy/MM/dd",
  label: "Gregorian type",
  type: "gregorian",
});
```

## JalaliAF type

we must explicitly specify the type

```js
DatePicker({
  placeholder: "yyyy/MM/dd",
  label: "JalaliAF type",
  type: "jalaliAF",
});
```

## JalaliIR type

we must explicitly specify the type

```js
DatePicker({
  placeholder: "yyyy/MM/dd",
  label: "JalaliIR type",
  type: "jalaliIR",
});
```

## Formats

the default date format is "yyyy/MM/dd",
but you can explicitly set any dateformate that is supported but momentjs.

```js
DatePicker({
  placeholder: "yyyy/MM/DD",
  label: "format 'yyyy/MM/DD'",
  format: "yyyy/MM/DD",
});
```

```js
DatePicker({
  placeholder: "yyyy/MM/dd",
  label: "format 'yyyy/MM/dd'",
  format: "yyyy/MM/dd",
});
```

```js
DatePicker({
  placeholder: "YYYY-MM-DD",
  label: "format 'YYYY-MM-DD'",
  format: "YYYY-MM-DD",
});
```

```js
DatePicker({
  placeholder: "MM-DD-YYYY",
  label: "format 'MM-DD-YYYY'",
  format: "MM-DD-YYYY",
});
```