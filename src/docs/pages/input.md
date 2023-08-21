# Input

## Default
```js
Input()
```

## Label
```js
Input({label : 'enter your name'})
```

## Placeholder
```js
Input({label : 'enter your name', placeholder: 'write name...'})
```
<!-- 
## Readonly
```js
Input({label : 'enter your name', placeholder: 'write name...', readOnly: true})
``` -->

## Disabled
```js
Input({label : 'enter your name', placeholder: 'write name...', disabled: true})
```

## value
```js
Input({label : 'enter your name', placeholder: 'write name...', value: 'my name'})
```

## modeling
```js
View({$data: {name: '', age: ''}}, [
  Input({label : 'name',name: 'name', placeholder: 'name...'}),
  Input({label : 'age',name: 'age', placeholder: 'age...'}),
  View({$text: 'name'}),
  View({$text: 'age'}),
]),
```

## modeling and defalut value
```js
View({$data: {name: 'defalut name'}},[
  Input({label : 'name',name: 'name', placeholder: 'name...'}),
  View({$text: 'name'}),
]),
```

## modeling and value prop
```js
View({$data: {name: ''}},[
  Input({label : 'name',name: 'name', placeholder: 'name...', value: 'value_prop value'}),
  View({$text: 'name'}),
]),
```

## modeling and value prop
```js
View({$data: {name: 'defalut name'}},[
  Input({label : 'name',name: 'name', placeholder: 'name...', value: 'value_prop name'}),
  View({$text: 'name'}),
]),
```
## modeling when data is not defiend
```js
View({$data: {age: ''}},[
  Input({label : 'name', name: 'name', placeholder: 'name...', value: 'value props given'}),
  View({$text: 'name'}),
]),
```
## modeling when data is not defiend
```js
View({$data: {age: ''}},[
  Input({label : 'name', name: 'name', placeholder: 'name...',}),
  View({$text: 'name'}),
]),
```

## size
```js
Input({size: 'sm', label: "size: sm"}),
Input({size: 'md', label: "size: md"}),
Input({size: 'lg', label: "size: lg"}),
Input({size: 'xl', label: "size: xl"}),
```



## Required (add star for label)

## Initial Value

## Bind Value

## Column Width

## With Form
