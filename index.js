/**
 * @typedef {import('css-selector-parser').RuleAttr} CssRuleAttr
 * @typedef {import('css-selector-parser').RulePseudo} CssRulePseudo
 * @typedef {import('css-selector-parser').Selectors} CssSelectors
 * @typedef {import('css-selector-parser').RuleSet} CssRuleSet
 * @typedef {import('css-selector-parser').Rule} CssRule
 *
 * @typedef {import('hast').Element} HastElement
 * @typedef {import('hast').Properties} HastProperties
 *
 * @typedef {'html'|'svg'} Space
 *
 * @typedef Options
 * @property {Space} [space]
 *
 * @typedef Context
 * @property {Space} space
 * @property {boolean} root
 */

import {h, s} from 'hastscript'
import {zwitch} from 'zwitch'
import {CssSelectorParser} from 'css-selector-parser'

var compile = zwitch('type', {handlers: {selectors, ruleSet, rule}})

var parser = new CssSelectorParser()

parser.registerNestingOperators('>', '+', '~')
// Register these so we can throw nicer errors.
parser.registerAttrEqualityMods('~', '|', '^', '$', '*')

/**
 * @param {string} [selector='']
 * @param {Space|Options} [space='html']
 * @returns {HastElement}
 */
export function fromSelector(selector, space) {
  /** @type {Context} */
  var config = {
    space:
      (space && typeof space === 'object' && space.space) ||
      (typeof space === 'string' && space) ||
      'html',
    root: true
  }

  return (
    // @ts-ignore Assume one element is returned.
    compile(parser.parse(selector || ''), config) || build(config.space)('')
  )
}

/**
 * @param {CssSelectors} _
 */
function selectors(_) {
  throw new Error('Cannot handle selector list')
}

/**
 * @param {CssRuleSet} query
 * @param {Context} config
 * @returns {HastElement|Array.<HastElement>}
 */
function ruleSet(query, config) {
  // @ts-ignore Assume one or more elements is returned.
  return compile(query.rule, config)
}

/**
 * @param {CssRule} query
 * @param {Context} config
 * @returns {HastElement|Array.<HastElement>}
 */
function rule(query, config) {
  var parentSpace = config.space
  var name = query.tagName === '*' ? '' : query.tagName || ''
  var space = parentSpace === 'html' && name === 'svg' ? 'svg' : parentSpace
  /** @type {boolean} */
  var sibling
  /** @type {HastElement} */
  var node

  if (query.rule) {
    sibling =
      query.rule.nestingOperator === '+' || query.rule.nestingOperator === '~'

    if (sibling && config.root) {
      throw new Error(
        'Cannot handle sibling combinator `' +
          query.rule.nestingOperator +
          '` at root'
      )
    }
  }

  // @ts-ignore Assume one or more elements is returned.
  node = build(space)(
    name,
    Object.assign(
      {id: query.id, className: query.classNames},
      pseudosToHast(query.pseudos || []),
      attrsToHast(query.attrs || [])
    ),
    !query.rule || sibling ? [] : compile(query.rule, {space})
  )

  // @ts-ignore Assume one or more elements is returned.
  return sibling ? [node, compile(query.rule, {space: parentSpace})] : node
}

/**
 * @param {Array.<CssRulePseudo>} pseudos
 * @returns {HastProperties}
 */
function pseudosToHast(pseudos) {
  var pseudo = pseudos[0]

  if (pseudo) {
    if (pseudo.name) {
      throw new Error('Cannot handle pseudo-selector `' + pseudo.name + '`')
    }

    throw new Error('Cannot handle pseudo-element or empty pseudo-class')
  }

  return {}
}

/**
 * @param {Array.<CssRuleAttr>} attrs
 * @returns {HastProperties}
 */
function attrsToHast(attrs) {
  var index = -1
  /** @type {HastProperties} */
  var props = {}
  /** @type {CssRuleAttr} */
  var attr

  while (++index < attrs.length) {
    attr = attrs[index]

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
 * @returns {typeof h}
 */
function build(space) {
  return space === 'html' ? h : s
}
