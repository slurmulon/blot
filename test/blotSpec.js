import 'blanket'

import * as blot from '../src/blot'
import _ from 'lodash'
import fs from 'fs'

import chai from 'chai'
import chaiThings from 'chai-things'
import chaiAsPromised from 'chai-as-promised'

chai.should()
chai.use(chaiThings)
chai.use(chaiAsPromised)

const loadFixture = (filepath) => fs.readFileSync(__dirname + '/fixtures/' + filepath, 'utf-8')

describe('Blueprint', () => {
  let blueprintStubs = {
    basic : null,
    json  : null
  }

  beforeEach(() => {
    blueprintStubs.basic = new blot.apib.Blueprint('# Basic Stub')
    blueprintStubs.json  = new blot.apib.Blueprint(`
      # Retrieve User Id [GET]
      ## Request {"name": "|~person.name|"}
      ## Response {"id": "|~misc.guid|"}')`
    )
  })

  describe('constructor', () => {
    it('should be a function', () => {
      blot.apib.Blueprint.constructor.should.be.a('function')
    })

    it('should bind the following own methods', () => {
      ['parse', 'transclude', 'compile', 'fixtures'].forEach(method => {
        blueprintStubs.basic.should.have.ownProperty(method)
      })
    })
  })

  describe('parse', () => {
    it('should be a function', () => {
      blueprintStubs.basic.parse.should.be.a('function')
    })

    it('should return a Promise', () => {
      blueprintStubs.basic.parse().should.be.a('promise')
    })

    it('should resolve with a parsed API blueprint if valid', () => {
      const fixture = loadFixture('apiblueprint/simple.md')
      const result  = blueprintStubs.basic.parse(fixture)

      // FIXME - these don't even assert properly (always true), wut?
      result.should.eventually.be.an('object')
      result.should.eventually.have.ownProperty('element')
      result.should.eventually.have.ownProperty('content')
    })
  })

  describe('transclude', () => {
    it('should be a function', () => {
      blueprintStubs.basic.parse.should.be.a('function')
    })

    it('should return a Promise', () => {
      blueprintStubs.basic.transclude().should.be.a('promise')
    })

    it('should be rejected when a Markdown string is not provided', () => {
      blot.apib.Blueprint.transclude().should.eventually.be.rejected
    })

    xit('should passively parse the provided API blueprint and transclude as appropriate', () => {
      // TODO
    })
  })

  describe('compile', () => {
    it('should be a function', () => {
      blueprintStubs.basic.compile.should.be.a('function')
    })

    it('should return a Promise', () => {
      blueprintStubs.basic.compile().should.be.a('promise')
    })

    it('should sequentially call: transclude -> parse -> fixtures', () => {
      // TODO
      // blueprintStubs.basic.compile().should.eventually.deep.equal({fixtures: })
    })
  })

  describe('fixtures', () => {
    it('should be a function', () => {
      blueprintStubs.json.fixtures.should.be.a('function')
    })

    it('should return a Promise', () => {
      blueprintStubs.json.fixtures().should.be.a('promise')
    })

    it('should process and resolve with all Hazy fixtures present in the Markdown', () => {
      blueprintStubs.json.fixtures().should.eventually.be.an('array')
      blueprintStubs.json.fixtures().should.eventually.have.length(1)
      blueprintStubs.json.fixtures().should.eventually.contain.an('object')
    })

    it('should reject when provided malformed JSON', () => {
      blot.apib.Blueprint.fixtures('{"invalid":').should.eventually.be.rejected
    })
  })
})

describe('io', () => {
  describe('src', () => {
    it('should be a function', () => {
      blot.io.src.should.be.a('function')
    })

    it('should return a Promise', () => {
      blot.io.src().should.be.a('promise')
    })

    it('should compile the API Blueprint file found at the filepath', () => {
      blot.io.src('../test/fixtures/apiblueprint/simple.md').should.be.resolved
    })

    it('should reject if no API Blueprint can be found', () => {
      blot.io.src().should.be.rejected
    })
  })

  xdescribe('dist', () => {

  })

  describe('glob', () => {
    let globStub

    beforeEach(() => {
      globStub = '## Response {"id": "|~misc:guid|"}'
    })

    it('should be a function', () => {
      blot.io.glob.should.be.a('function')
    })

    it('should return a Promise', () => {
      blot.io.glob('#').should.be.a('promise')
    })

    it('should compile each API Blueprint when provided an Array', () => {
      blot.io.glob([globStub]).should.be.resolved
    })

    it('should compile the API Blueprint when provided a String', () => {
      blot.io.glob(globStub).should.be.resolved
    })

    it('should reject if provided anything other than an Array or String', () => {
      blot.io.glob(false).should.be.rejected
    })
  })

  xdescribe('read', () => {

  })
})
