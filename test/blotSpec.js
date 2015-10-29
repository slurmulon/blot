import 'blanket'

import * as blot from '../src/blot'
import _ from 'lodash'
import fs from 'fs'

import chai from 'chai'
// import chaiThings from 'chai-things'
import chaiAsPromised from 'chai-as-promised'

chai.should()
// chai.use(chaiThings)
chai.use(chaiAsPromised)

const blueprintFixture = (filepath: String): String => fs.readFileSync(__dirname + '/fixtures/apiblueprint/' + filepath)

describe('Blueprint', () => {
  let blueprintStub

  beforeEach(() => {
    blueprintStub = new blot.Blueprint('# Stubbin')
  })

  describe('constructor', () => {
    it('should be a function', () => {
      blot.Blueprint.constructor.should.be.a('function')  
    })

    it('should bind the following own methods', () => {
      ['parse', 'transclude', 'compile', 'fixtures'].forEach(method => {
        blueprintStub.should.have.ownProperty(method)
      })
    })
  })

  describe('parse', () => {
    it('should be a function', () => {
      blueprintStub.parse.should.be.a('function')  
    })

    it('should return a Promise', () => {
      blueprintStub.parse('#').should.eventually.be.fulfilled
    })

    it('should resolve with a parsed API blueprint if valid', () => {
      const fixture = blueprintFixture('simple.md')
      const result  = blueprintStub.parse(fixture)

      // FIXME - these don't even assert properly, wut?
      result.should.eventually.be.an('object')
      result.should.eventually.have.ownProperty('element')
      result.should.eventually.have.ownProperty('content')
    })
  })

  describe('transclude', () => {
    it('should be a function', () => {
      blueprintStub.parse.should.be.a('function')  
    })

    it('should return a Promise', () => {
      blueprintStub.transclude().should.eventually.be.fulfilled
    })

    it('should be rejected when a Markdown string is not provided', () => {
      blot.Blueprint.transclude().should.eventually.be.rejected
    })

    xit('should passively parse the provided API blueprint and transclude as appropriate', () => {
      // TODO
    })
  })

  describe('fixtures', () => {
    beforeEach(() => {
      blueprintStub = new blot.Blueprint('# Foo {"name": "|~misc:name|"}')
    })

    it('should be a function', () => {
      blueprintStub.fixtures.should.be.a('function')  
    })

    it('should return a Promise', () => {
      blueprintStub.fixtures().should.eventually.be.fulfilled
    })

    it('should process all Hazy fixtures present in the Markdown', () => {
      blueprintStub.fixtures().should.eventually.contain.an('object')
    })
  })
  
})
