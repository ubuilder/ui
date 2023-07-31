# Form


## Default
```js
Form({$data: {username: '', password: ''}}, [
  Input({ name: "username", label: 'Username' }),
  Input({ name: "password", label: 'Password' }),

  Col({ col: 12, mb: "sm" }, [
    View({ border: true, borderColor: 'base-400', p: "sm"}, [
      View(["Username: ", View({ $text: "username" })]),
      View(["password: ", View({ $text: "password" })]),
    ]),
  ]),
  Col({ justify: 'end'}, [
    Button({ type: "submit", color: 'primary' }, "Submit"),
  ])
])
```

## Method & Action
action should be a url and method should be one of `GET` or `POST`

```js
Form({$data: {username: '', password: ''}, method: 'GET', action: '/somewhere'}, [
  Input({ name: "username", label: 'Username' }),
  Input({ name: "password", label: 'Password' }),

  Col({ col: 12, mb: "sm" }, [
    View({ border: true, borderColor: 'base-400', p: "sm"}, [
      View(["Username: ", View({ $text: "username" })]),
      View(["password: ", View({ $text: "password" })]),
    ]),
  ]),
  Col({ justify: 'end'}, [
    Button({ type: "submit", color: 'primary' }, "Submit"),
  ])
])

```

## Submit Event
```js
Form({$data: {username: '', password: '', remember: false}, onSubmit: "event => {event.preventDefault(); alert('Form submitted (username:'+username+') (password: '+password+') (remember: '+remember+')')}"}, [
  Input({ name: "username", label: 'Username' }),
  Input({ name: "password", label: 'Password' }),
  Checkbox({name: 'remember', text: 'Remember Me'}),

  Col({col: 12, mb: "sm" }, [
    View({ border: true, borderColor: 'base-400', p: "sm"}, [
      View(["Username: ", View({ $text: "username" })]),
      View(["password: ", View({ $text: "password" })]),
      View(["Remember: ", View({ $text: "remember" })]),

    ]),
  ]),
  Col({ justify: 'end'}, [
    Button({ type: "submit", color: 'primary' }, "Submit"),
  ])
])
```

## $get & $post
`$get` and `$post` are two Alpinejs Magics which you can use to do fetch requests.
```js
Form({$data: {username: '', password: '', remember: false}, onSubmit: "$event.preventDefault(); $post('/url', {username, password}).then(res => console.log(res))"}, [
  Input({ name: "username", label: 'Username' }),
  Input({ name: "password", label: 'Password' }),

  Col({ justify: 'end'}, [
    Button({ type: "submit", color: 'primary' }, "Submit"),
  ])
])
```

```js
Form({$data: {query: ''}, onSubmit: "$event.preventDefault(); $get('/search?q=' + query).then(res => console.log(res))"}, [
  Input({ name: "query", label: 'Search...' }),

  Col({ justify: 'end'}, [
    Button({ type: "submit", color: 'primary' }, "Search"),
  ])
])
```