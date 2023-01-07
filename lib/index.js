/**
 * @typedef {import('css-selector-parser').RuleAttr} RuleAttr
 * @typedef {import('css-selector-parser').RulePseudo} RulePseudo
 * @typedef {import('css-selector-parser').Rule} Rule
 *
 * @typedef {import('hast').Element} HastElement
 * @typedef {import('hast').Properties} HastProperties
 *
 * @typedef {'html' | 'svg'} Space
 *   Name of namespace.
 *
 * @typedef Options
 *   Configuration.
 * @property {Space} [space]
 *   Which space first element in the selector is in.
 *
 *   When an `svg` element is created in HTML, the space is automatically
 *   switched to SVG.
 *
 * @typedef State
 *   Info on current context.
 * @property {Space} space
 *   Current space.
 */

import {h, s} from 'hastscript'
import {CssSelectorParser} from 'css-selector-parser'

const parser = new CssSelectorParser()

parser.registerNestingOperators('>', '+', '~')
// Register these so we can throw nicer errors.
parser.registerAttrEqualityMods('~', '|', '^', '$', '*')

/**
 * Create one or more `Element`s from a CSS selector.
 *
 * @param {string | null | undefined} [selector='']
 *   CSS selector.
 * @param {Space | Options | null | undefined} [space='html']
 *   Space or configuration.
 * @returns {HastElement}
 *   Built tree.
 */
export function fromSelector(selector, space) {
  /** @type {State} */
  const state = {
    space:
      (space && typeof space === 'object' && space.space) ||
      (typeof space === 'string' && space) ||
      'html'
  }

  const query = parser.parse(selector || '')

  if (query && query.type === 'selectors') {
    throw new Error('Cannot handle selector list')
  }

  const result = query ? rule(query.rule, state) : []

  if (
    query &&
    query.rule.rule &&
    (query.rule.rule.nestingOperator === '+' ||
      query.rule.rule.nestingOperator === '~')
  ) {
    throw new Error(
      'Cannot handle sibling combinator `' +
        query.rule.rule.nestingOperator +
        '` at root'
    )
  }

  return result[0] || build(state.space)('')
}

/**
 * Turn a rule into one or more elements.
 *
 * @param {Rule} query
 *   Selector.
 * @param {State} state
 *   Info on current context.
 * @returns {Array<HastElement>}
 *   One or more elements.
 */
function rule(query, state) {
  const space =
    state.space === 'html' && query.tagName === 'svg' ? 'svg' : state.space

  checkPseudos(query.pseudos || [])

  const node = build(space)(query.tagName === '*' ? '' : query.tagName || '', {
    id: query.id,
    className: query.classNames,
    ...attrsToHast(query.attrs || [])
  })
  const results = [node]

  if (query.rule) {
    // Sibling.
    if (
      query.rule.nestingOperator === '+' ||
      query.rule.nestingOperator === '~'
    ) {
      results.push(...rule(query.rule, state))
    }
    // Descendant.
    else {
      node.children.push(...rule(query.rule, {space}))
    }
  }

  return results
}

/**
 * Check pseudo selectors.
 *
 * @param {Array<RulePseudo>} pseudos
 *   Pseudo selectors.
 * @returns {void}
 *   Nothing.
 * @throws {Error}
 *   When a pseudo is defined.
 */
function checkPseudos(pseudos) {
  const pseudo = pseudos[0]

  if (pseudo) {
    if (pseudo.name) {
      throw new Error('Cannot handle pseudo-selector `' + pseudo.name + '`')
    }

    throw new Error('Cannot handle pseudo-element or empty pseudo-class')
  }
}

/**
 * Turn attribute selectors into properties.
 *
 * @param {Array<RuleAttr>} attrs
 *   Attribute selectors.
 * @returns {HastProperties}
 *   Properties.
 */
function attrsToHast(attrs) {
  /** @type {HastProperties} */
  const props = {}
  let index = -1

  while (++index < attrs.length) {
    const attr = attrs[index]

    if ('operator' in attr) {
      if (attr.operator === '=') {
        props[attr.name] = attr.value
      } else {
        throw new Error(
          'Cannot handle attribute equality modifier `' + attr.operator + '`'
        )
      }
    } else {
      props[attr.name] = true
    }
  }

  return props
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
