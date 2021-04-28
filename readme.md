# hast-util-from-selector

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

[**hast**][hast] utility to create nodes from an advanced CSS selector.

## Install

This package is [ESM only](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c):
Node 12+ is needed to use it and it must be `import`ed instead of `require`d.

[npm][]:

```sh
npm install hast-util-from-selector
```

## Use

```js
import {fromSelector} from 'hast-util-from-selector'

console.log(fromSelector('p svg[viewbox=0 0 10 10] circle[cx=10][cy=10][r=10]'))
```

Yields:

```js
{
  type: 'element',
  tagName: 'p',
  properties: {},
  children: [
    {
      type: 'element',
      tagName: 'svg',
      properties: {viewBox: '0 0 10 10'},
      children: [
        {
          type: 'element',
          tagName: 'circle',
          properties: {cx: '10', cy: '10', r: '10'},
          children: []
        }
      ]
    }
  ]
}
```

## API

This package exports the following identifiers: `fromSelector`.
There is no default export.

### `fromSelector([selector][, options])`

Create one or more [*element*][element] [*node*][node]s from a CSS selector.

###### Parameters

*   `selector` (`string`, optional)
    — CSS selector
*   `space` (`string`, optional)
    — Treated as `options.space`
*   `options.space` (enum, `'svg'` or `'html'`, default: `'html'`)
    — Which space first element in the selector is in.
    When an `svg` is created in HTML, the space is switched automatically to SVG

###### Returns

[`Element`][element].

## Support

*   [x] `*` (universal selector, *creates a `div` in HTML, `g` in SVG*)
*   [x] `p` (type selector)
*   [x] `.class` (class selector)
*   [x] `#id` (id selector)
*   [x] `[attr]` (attribute existence, *creates a boolean*)
*   [x] `[attr=value]` (attribute equality)
*   [x] `article p` (descendant combinator)
*   [x] `article > p` (child combinator)
*   [x] `section h1 + p` (next-sibling combinator, *not at root*)
*   [x] `section h1 ~ p` (subsequent-sibling combinator, *not at root*)

## Security

Use of `from-selector` can open you up to a [cross-site scripting (XSS)][xss]
attack as values are injected into the syntax tree.

Either do not use user input in `from-selector` or use
[`hast-util-santize`][sanitize].

## Related

*   [`hast-util-parse-selector`](https://github.com/syntax-tree/hast-util-parse-selector)
    — create an element from a simple CSS selector

## Contribute

See [`contributing.md` in `syntax-tree/.github`][contributing] for ways to get
started.
See [`support.md`][support] for ways to get help.

This project has a [code of conduct][coc].
By interacting with this repository, organization, or community you agree to
abide by its terms.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[build-badge]: https://github.com/syntax-tree/hast-util-from-selector/workflows/main/badge.svg

[build]: https://github.com/syntax-tree/hast-util-from-selector/actions

[coverage-badge]: https://img.shields.io/codecov/c/github/syntax-tree/hast-util-from-selector.svg

[coverage]: https://codecov.io/github/syntax-tree/hast-util-from-selector

[downloads-badge]: https://img.shields.io/npm/dm/hast-util-from-selector.svg

[downloads]: https://www.npmjs.com/package/hast-util-from-selector

[size-badge]: https://img.shields.io/bundlephobia/minzip/hast-util-from-selector.svg

[size]: https://bundlephobia.com/result?p=hast-util-from-selector

[sponsors-badge]: https://opencollective.com/unified/sponsors/badge.svg

[backers-badge]: https://opencollective.com/unified/backers/badge.svg

[collective]: https://opencollective.com/unified

[chat-badge]: https://img.shields.io/badge/chat-discussions-success.svg

[chat]: https://github.com/syntax-tree/unist/discussions

[npm]: https://docs.npmjs.com/cli/install

[license]: license

[author]: https://wooorm.com

[contributing]: https://github.com/syntax-tree/.github/blob/HEAD/contributing.md

[support]: https://github.com/syntax-tree/.github/blob/HEAD/support.md

[coc]: https://github.com/syntax-tree/.github/blob/HEAD/code-of-conduct.md

[hast]: https://github.com/syntax-tree/hast

[node]: https://github.com/syntax-tree/hast#nodes

[element]: https://github.com/syntax-tree/hast#element

[xss]: https://en.wikipedia.org/wiki/Cross-site_scripting

[sanitize]: https://github.com/syntax-tree/hast-util-sanitize
