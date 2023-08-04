import assert from 'node:assert/strict'
import test from 'node:test'
import {h, s} from 'hastscript'
import {fromSelector} from './index.js'
import * as mod from './index.js'

test('fromSelector()', () => {
  assert.deepEqual(
    Object.keys(mod).sort(),
    ['fromSelector'],
    'should expose the public api'
  )

  assert.throws(
    () => {
      fromSelector('@supports (transform-origin: 5% 5%) {}')
    },
    /Expected rule but "@" found/,
    'should throw w/ invalid selector'
  )

  assert.throws(
    () => {
      fromSelector('a, b')
    },
    /Cannot handle selector list/,
    'should throw w/ multiple selector'
  )

  assert.throws(
    () => {
      fromSelector('a + b')
    },
    /Cannot handle sibling combinator `\+` at root/,
    'should throw w/ next-sibling combinator at root'
  )

  assert.throws(
    () => {
      fromSelector('a ~ b')
    },
    /Cannot handle sibling combinator `~` at root/,
    'should throw w/ subsequent-sibling combinator at root'
  )

  assert.throws(
    () => {
      fromSelector('[foo%=bar]')
    },
    /Expected a valid attribute selector operator/,
    'should throw w/ attribute modifiers'
  )

  assert.throws(
    () => {
      fromSelector('[foo~=bar]')
    },
    /Cannot handle attribute equality modifier `~=`/,
    'should throw w/ attribute modifiers'
  )

  assert.throws(
    () => {
      fromSelector(':active')
    },
    /Cannot handle pseudo class `active`/,
    'should throw on pseudo classes'
  )

  assert.throws(
    () => {
      fromSelector(':nth-foo(2n+1)')
    },
    /Unknown pseudo-class/,
    'should throw on pseudo class “functions”'
  )

  assert.throws(
    () => {
      fromSelector('::before')
    },
    /Cannot handle pseudo element `before`/,
    'should throw on invalid pseudo elements'
  )

  assert.deepEqual(fromSelector(), h(''), 'should support no selector')
  assert.deepEqual(fromSelector(''), h(''), 'should support the empty string')

  assert.deepEqual(
    fromSelector('*'),
    h(''),
    'should support the universal selector'
  )

  assert.deepEqual(
    fromSelector('p i s'),
    h('p', h('i', h('s'))),
    'should support the descendant combinator'
  )

  assert.deepEqual(
    fromSelector('p > i > s'),
    h('p', h('i', h('s'))),
    'should support the child combinator'
  )

  assert.deepEqual(
    fromSelector('p i + s'),
    h('p', [h('i'), h('s')]),
    'should support the next-sibling combinator'
  )

  assert.deepEqual(
    fromSelector('p i ~ s'),
    h('p', [h('i'), h('s')]),
    'should support the subsequent-sibling combinator'
  )

  assert.deepEqual(fromSelector('a'), h('a'), 'should support a tag name')
  assert.deepEqual(fromSelector('.a'), h('.a'), 'should support a class')
  assert.deepEqual(
    fromSelector('a.b'),
    h('a.b'),
    'should support a tag and a class'
  )
  assert.deepEqual(fromSelector('#b'), h('#b'), 'should support an id')
  assert.deepEqual(
    fromSelector('a#b'),
    h('a#b'),
    'should support a tag and an id'
  )
  assert.deepEqual(
    fromSelector('a#b.c.d'),
    h('a#b.c.d'),
    'should support all together'
  )
  assert.deepEqual(fromSelector('a#b#c'), h('a#c'), 'should use the last id')
  assert.deepEqual(fromSelector('A').tagName, 'a', 'should normalize casing')

  assert.deepEqual(
    fromSelector('[a]'),
    h('', {a: true}),
    'should support attributes (#1)'
  )
  assert.deepEqual(
    fromSelector('[a=b]'),
    h('', {a: 'b'}),
    'should support attributes (#2)'
  )

  assert.deepEqual(
    fromSelector('.a.b[class=c]'),
    h('.a.b.c'),
    'should support class and class attributes'
  )

  assert.deepEqual(fromSelector('altGlyph').tagName, 'altglyph', 'space (#1)')

  assert.deepEqual(
    fromSelector('altGlyph', 'svg').tagName,
    'altGlyph',
    'space (#2)'
  )

  assert.deepEqual(
    fromSelector('altGlyph', {space: 'svg'}).tagName,
    'altGlyph',
    'space (#3)'
  )

  assert.deepEqual(
    // @ts-expect-error: fine.
    fromSelector('svg altGlyph').children[0].tagName,
    'altGlyph',
    'space (#4)'
  )

  assert.deepEqual(
    // @ts-expect-error: fine.
    fromSelector('div svg + altGlyph').children[1].tagName,
    'altglyph',
    'space (#5)'
  )

  assert.deepEqual(
    fromSelector(
      'p svg[viewbox="0 0 10 10"] circle[cx=10][cy=10][r=10] altGlyph'
    ),
    h('p', [
      s('svg', {viewBox: '0 0 10 10'}, [
        s('circle', {cx: '10', cy: '10', r: '10'}, [s('altGlyph')])
      ])
    ]),
    'space (#6)'
  )
})
