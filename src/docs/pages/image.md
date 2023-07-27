# Image

## Usage

```js
Image({
    w: '6xl',
  src: "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png",
  alt: "Google",
});
```

## Style
You can add some basic styles for image using [View](/ui/view) props. 

```js
Image({
    src: 'https://avatars.githubusercontent.com/u/80154025?s=32&v=4',
    alt: 'unjs logo',
    w: '3xl',
    h: '3xl',
    border: true,
    borderColor: 'error-300',
    borderSize: 'xs',
    p: 'xxs',
    borderRadius: 'xl'
})

```