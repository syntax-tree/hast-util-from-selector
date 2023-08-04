import assert from 'node:assert/strict'
import test from 'node:test'
import {h, s} from 'hastscript'
import {fromSelector} from './index.js'

test('fromSelector', async function (t) {
  await t.test('should expose the public api', async function () {
    assert.deepEqual(Object.keys(await import('./index.js')).sort(), [
      'fromSelector'
    ])
  })

  await t.test('should throw w/ invalid selector', async function () {
    assert.throws(function () {
      fromSelector('@supports (transform-origin: 5% 5%) {}')
    }, /Expected rule but "@" found/)
  })

  await t.test('should throw w/ multiple selector', async function () {
    assert.throws(function () {
      fromSelector('a, b')
    }, /Cannot handle selector list/)
  })

  await t.test(
    'should throw w/ next-sibling combinator at root',
    async function () {
      assert.throws(function () {
        fromSelector('a + b')
      }, /Cannot handle sibling combinator `\+` at root/)
    }
  )

  await t.test(
    'should throw w/ subsequent-sibling combinator at root',
    async function () {
      assert.throws(function () {
        fromSelector('a ~ b')
      }, /Cannot handle sibling combinator `~` at root/)
    }
  )

  await t.test('should throw w/ attribute modifiers', async function () {
    assert.throws(function () {
      fromSelector('[foo%=bar]')
    }, /Expected a valid attribute selector operator/)
  })

  await t.test('should throw w/ attribute modifiers', async function () {
    assert.throws(function () {
      fromSelector('[foo~=bar]')
    }, /Cannot handle attribute equality modifier `~=`/)
  })

  await t.test('should throw on pseudo classes', async function () {
    assert.throws(function () {
      fromSelector(':active')
    }, /Cannot handle pseudo class `active`/)
  })

  await t.test('should throw on pseudo class “functions”', async function () {
    assert.throws(function () {
      fromSelector(':nth-foo(2n+1)')
    }, /Unknown pseudo-class/)
  })

  await t.test('should throw on invalid pseudo elements', async function () {
    assert.throws(function () {
      fromSelector('::before')
    }, /Cannot handle pseudo element `before`/)
  })

  await t.test('should support no selector', async function () {
    assert.deepEqual(fromSelector(), h(''))
  })

  await t.test('should support the empty string', async function () {
    assert.deepEqual(fromSelector(''), h(''))
  })

  await t.test('should support the universal selector', async function () {
    assert.deepEqual(fromSelector('*'), h(''))
  })

  await t.test('should support the descendant combinator', async function () {
    assert.deepEqual(fromSelector('p i s'), h('p', h('i', h('s'))))
  })

  await t.test('should support the child combinator', async function () {
    assert.deepEqual(fromSelector('p > i > s'), h('p', h('i', h('s'))))
  })

  await t.test('should support the next-sibling combinator', async function () {
    assert.deepEqual(fromSelector('p i + s'), h('p', [h('i'), h('s')]))
  })

  await t.test(
    'should support the subsequent-sibling combinator',
    async function () {
      assert.deepEqual(fromSelector('p i ~ s'), h('p', [h('i'), h('s')]))
    }
  )

  await t.test('should support a tag name', async function () {
    assert.deepEqual(fromSelector('a'), h('a'))
  })

  await t.test('should support a class', async function () {
    assert.deepEqual(fromSelector('.a'), h('.a'))
  })

  await t.test('should support a tag and a class', async function () {
    assert.deepEqual(fromSelector('a.b'), h('a.b'))
  })

  await t.test('should support an id', async function () {
    assert.deepEqual(fromSelector('#b'), h('#b'))
  })

  await t.test('should support a tag and an id', async function () {
    assert.deepEqual(fromSelector('a#b'), h('a#b'))
  })

  await t.test('should support all together', async function () {
    assert.deepEqual(fromSelector('a#b.c.d'), h('a#b.c.d'))
  })

  await t.test('should use the last id', async function () {
    assert.deepEqual(fromSelector('a#b#c'), h('a#c'))
  })

  await t.test('should normalize casing', async function () {
    assert.equal(fromSelector('A').tagName, 'a')
  })

  await t.test('should support attributes (#1)', async function () {
    assert.deepEqual(fromSelector('[a]'), h('', {a: true}))
  })

  await t.test('should support attributes (#2)', async function () {
    assert.deepEqual(fromSelector('[a=b]'), h('', {a: 'b'}))
  })

  await t.test('should support class and class attributes', async function () {
    assert.deepEqual(fromSelector('.a.b[class=c]'), h('.a.b.c'))
  })

  await t.test('should support space (#1)', async function () {
    assert.equal(fromSelector('altGlyph').tagName, 'altglyph')
  })

  await t.test('should support space (#2)', async function () {
    assert.equal(fromSelector('altGlyph', {space: 'svg'}).tagName, 'altGlyph')
  })

  await t.test('should support space (#3)', async function () {
    const result = fromSelector('svg altGlyph')
    const child = result.children[0]
    assert(child.type === 'element')
    assert.equal(child.tagName, 'altGlyph')
  })

  await t.test('should support space (#4)', async function () {
    const result = fromSelector('div svg + altGlyph')
    const child = result.children[1]
    assert(child.type === 'element')
    assert.equal(child.tagName, 'altglyph')
  })

  await t.test('should support space (#5)', async function () {
    assert.deepEqual(
      fromSelector(
        'p svg[viewbox="0 0 10 10"] circle[cx=10][cy=10][r=10] altGlyph'
      ),
      h('p', [
        s('svg', {viewBox: '0 0 10 10'}, [
          s('circle', {cx: '10', cy: '10', r: '10'}, [s('altGlyph')])
        ])
      ])
    )
  })
})
