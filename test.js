'use strict'

var test = require('tape')
var h = require('hastscript')
var s = require('hastscript/svg')
var from = require('.')

test('fromSelector()', function(t) {
  t.equal(typeof from, 'function', 'should expose a function')

  t.throws(
    function() {
      from('@supports (transform-origin: 5% 5%) {}')
    },
    /Error: Rule expected but "@" found/,
    'should throw w/ invalid selector'
  )

  t.throws(
    function() {
      from('a, b')
    },
    /Error: Cannot handle selector list/,
    'should throw w/ multiple selector'
  )

  t.throws(
    function() {
      from('a + b')
    },
    /Error: Cannot handle sibling combinator `\+` at root/,
    'should throw w/ next-sibling combinator at root'
  )

  t.throws(
    function() {
      from('a ~ b')
    },
    /Error: Cannot handle sibling combinator `~` at root/,
    'should throw w/ subsequent-sibling combinator at root'
  )

  t.throws(
    function() {
      from('[foo%=bar]')
    },
    /Error: Expected "=" but "%" found./,
    'should throw w/ attribute modifiers'
  )

  t.throws(
    function() {
      from('[foo~=bar]')
    },
    /Error: Cannot handle attribute equality modifier `~=`/,
    'should throw w/ attribute modifiers'
  )

  t.throws(
    function() {
      from(':active')
    },
    /Error: Cannot handle pseudo-selector `active`/,
    'should throw on pseudo classes'
  )

  t.throws(
    function() {
      from(':nth-foo(2n+1)')
    },
    /Error: Cannot handle pseudo-selector `nth-foo`/,
    'should throw on pseudo class “functions”'
  )

  t.throws(
    function() {
      from('::before')
    },
    /Error: Cannot handle pseudo-element or empty pseudo-class/,
    'should throw on invalid pseudo elements'
  )

  t.deepEqual(from(), h(), 'should support no selector')
  t.deepEqual(from(''), h(), 'should support the empty string')
  t.deepEqual(from(' '), h(), 'should support whitespace only')
  t.deepEqual(from('*'), h(), 'should support the universal selector')

  t.deepEqual(
    from('p i s'),
    h('p', h('i', h('s'))),
    'should support the descendant combinator'
  )

  t.deepEqual(
    from('p > i > s'),
    h('p', h('i', h('s'))),
    'should support the child combinator'
  )

  t.deepEqual(
    from('p i + s'),
    h('p', [h('i'), h('s')]),
    'should support the next-sibling combinator'
  )

  t.deepEqual(
    from('p i ~ s'),
    h('p', [h('i'), h('s')]),
    'should support the subsequent-sibling combinator'
  )

  t.deepEqual(from('a'), h('a'), 'should support a tag name')
  t.deepEqual(from('.a'), h('.a'), 'should support a class')
  t.deepEqual(from('a.b'), h('a.b'), 'should support a tag and a class')
  t.deepEqual(from('#b'), h('#b'), 'should support an id')
  t.deepEqual(from('a#b'), h('a#b'), 'should support a tag and an id')
  t.deepEqual(from('a#b.c.d'), h('a#b.c.d'), 'should support all together')
  t.deepEqual(from('a#b#c'), h('a#c'), 'should use the last id')
  t.deepEqual(from('A').tagName, 'a', 'should normalize casing')

  t.deepEqual(from('[a]'), h('', {a: true}), 'should support attributes (#1)')
  t.deepEqual(from('[a=b]'), h('', {a: 'b'}), 'should support attributes (#2)')

  t.deepEqual(
    from('.a.b[class=c]'),
    h('.a.b.c'),
    'should support class and class attributes'
  )

  t.deepEqual(from('altGlyph').tagName, 'altglyph', 'space (#1)')

  t.deepEqual(from('altGlyph', 'svg').tagName, 'altGlyph', 'space (#2)')

  t.deepEqual(
    from('svg altGlyph').children[0].tagName,
    'altGlyph',
    'space (#3)'
  )

  t.deepEqual(
    from('div svg + altGlyph').children[1].tagName,
    'altglyph',
    'space (#4)'
  )

  t.deepEqual(
    from('p svg[viewbox=0 0 10 10] circle[cx=10][cy=10][r=10] altGlyph'),
    h('p', [
      s('svg', {viewBox: '0 0 10 10'}, [
        s('circle', {cx: '10', cy: '10', r: '10'}, [s('altGlyph')])
      ])
    ]),
    'space (#5)'
  )

  t.end()
})
