# Breadcrumb

## Default

this is defualt breadcrumb component

```js
Breadcrumb([
      BreadcrumbItem("Home"),
      BreadcrumbItem("Blog"),
      BreadcrumbItem("Post 1"),
    ]),
```

## with links

```js
Breadcrumb([
    BreadcrumbItem({ href: "/"},"Home"),
    BreadcrumbItem({ href: "/blogs"},"Blog"),
    BreadcrumbItem({ href: "/post1"},"Post 1"),
])
```

## Active

```js
Breadcrumb([
    BreadcrumbItem({ href: "/", active: true},"Home"),
    BreadcrumbItem({ href: "/blogs", },"Blog"),
    BreadcrumbItem({ href: "/post1"},"Post 1"),
])
```

## Disabled

```js
Breadcrumb([
    BreadcrumbItem({ href: "/"},"Home"),
    BreadcrumbItem({ href: "/blogs", disabled: true},"Blog"),
    BreadcrumbItem({ href: "/post1"},"Post 1"),
])
```
