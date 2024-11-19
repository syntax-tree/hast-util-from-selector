/**
 * @import {AstRule} from 'css-selector-parser'
 * @import {Element, Properties} from 'hast'
 */

/**
 * @typedef Options
 *   Configuration.
 * @property {Space | null | undefined} [space]
 *   Which space first element in the selector is in (default: `'html'`).
 *
 *   When an `svg` element is created in HTML, the space is automatically
 *   switched to SVG.
 *
 * @typedef {'html' | 'svg'} Space
 *   Name of namespace.
 *
 * @typedef State
 *   Info on current context.
 * @property {Space} space
 *   Current space.
 */

import {createParser} from 'css-selector-parser'
import {ok as assert} from 'devlop'
import {h, s} from 'hastscript'

const cssSelectorParse = createParser({syntax: 'selectors-4'})

/** @type {Options} */
const emptyOptions = {}

/**
 * Create one or more `Element`s from a CSS selector.
 *
 * @param {string | null | undefined} [selector='']
 *   CSS selector (default: `''`).
 * @param {Options | null | undefined} [options]
 *   Configuration (optional).
 * @returns {Element}
 *   Built tree.
 */
export function fromSelector(selector, options) {
  const settings = options || emptyOptions

  const query = cssSelectorParse(selector || '*')

  if (query.rules.length > 1) {
    throw new Error('Cannot handle selector list')
  }

  const head = query.rules[0]
  assert(head, 'expected rule')

  if (
    head.nestedRule &&
    (head.nestedRule.combinator === '+' || head.nestedRule.combinator === '~')
  ) {
    throw new Error(
      'Cannot handle sibling combinator `' +
        head.nestedRule.combinator +
        '` at root'
    )
  }

  const result = rule(head, {space: settings.space || 'html'})

  return result[0]
}

/**
 * Turn a rule into one or more elements.
 *
 * @param {AstRule} query
 *   Selector.
 * @param {State} state
 *   Info on current context.
 * @returns {Array<Element>}
 *   One or more elements.
 */
function rule(query, state) {
  let space = state.space
  /** @type {Properties} */
  const properties = {}
  /** @type {Array<string> | undefined} */
  let className
  /** @type {Array<string>} */
  const ids = []
  /** @type {Array<string>} */
  const names = []

  for (const item of query.items) {
    if (item.type === 'Attribute') {
      if ('operator' in item) {
        if (item.operator === '=') {
          const value = item.value

          // eslint-disable-next-line max-depth
          if (value) {
            assert(value.type === 'String', 'substitution are not enabled')
            properties[item.name] = value.value
          }
        } else {
          throw new Error(
            'Cannot handle attribute equality modifier `' + item.operator + '`'
          )
        }
      } else {
        properties[item.name] = true
      }
    } else if (item.type === 'ClassName') {
      if (!className) className = []
      className.push(item.name)
    } else if (item.type === 'Id') {
      ids.push(item.name)
    } else if (item.type === 'PseudoClass') {
      throw new Error('Cannot handle pseudo class `' + item.name + '`')
    } else if (item.type === 'PseudoElement') {
      throw new Error('Cannot handle pseudo element `' + item.name + '`')
    } else if (item.type === 'TagName') {
      names.push(item.name)
    } else {
      assert(item.type === 'WildcardTag')
      // Ignore.
    }
  }

  const id = ids[ids.length - 1]
  const name = names[names.length - 1] || ''
  if (state.space === 'html' && name === 'svg') {
    space = 'svg'
  }

  const node = build(space)(name, {id, className, ...properties}, [])
  const results = [node]

  if (query.nestedRule) {
    // Sibling.
    if (
      query.nestedRule.combinator === '+' ||
      query.nestedRule.combinator === '~'
    ) {
      results.push(...rule(query.nestedRule, state))
    }
    // Descendant.
    else {
      node.children.push(...rule(query.nestedRule, {space}))
    }
  }

  return results
}

/**
 * @param {Space} space
 *   Space.
 * @returns {typeof h}
 *   `h`.
 */
function build(space) {
  return space === 'html' ? h : s
}
