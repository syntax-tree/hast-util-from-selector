'use strict'

module.exports = fromSelector

var h = require('hastscript')
var s = require('hastscript/svg')
var zwitch = require('zwitch')
var Parser = require('css-selector-parser').CssSelectorParser

var compile = zwitch('type', {
  handlers: {
    selectors: selectors,
    ruleSet: ruleSet,
    rule: rule
  }
})

var parser = new Parser()

parser.registerNestingOperators('>', '+', '~')
// Register these so we can throw nicer errors.
parser.registerAttrEqualityMods('~', '|', '^', '$', '*')

function fromSelector(selector, space) {
  var config = {space: (space && space.space) || space || 'html', root: true}

  return compile(parser.parse(selector || ''), config) || build(config.space)()
}

function selectors() {
  throw new Error('Cannot handle selector list')
}

function ruleSet(query, config) {
  return compile(query.rule, config)
}

function rule(query, config) {
  var parentSpace = config.space
  var name = query.tagName === '*' ? '' : query.tagName
  var space = parentSpace === 'html' && name === 'svg' ? 'svg' : parentSpace
  var sibling
  var operator
  var node

  if (query.rule) {
    operator = query.rule.nestingOperator
    sibling = operator === '+' || operator === '~'

    if (sibling && config.root) {
      throw new Error(
        'Cannot handle sibling combinator `' + operator + '` at root'
      )
    }
  }

  node = build(space)(
    name,
    Object.assign(
      {id: query.id, className: query.classNames},
      pseudosToHast(query.pseudos || []),
      attrsToHast(query.attrs || [])
    ),
    !query.rule || sibling ? [] : compile(query.rule, {space: space})
  )

  return sibling ? [node, compile(query.rule, {space: parentSpace})] : node
}

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

function attrsToHast(attrs) {
  var props = {}
  var index = -1
  var attr

  while (++index < attrs.length) {
    attr = attrs[index]

    if (attr.operator) {
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

function build(space) {
  return space === 'html' ? h : s
}
