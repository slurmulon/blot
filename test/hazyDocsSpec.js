import 'blanket'

import * as hazyDocs from '../src/hazyDocs'
import _ from 'lodash'

import chai from 'chai'
import chaiThings from 'chai-things'

chai.should()
chai.use(chaiThings)

describe('Doc', () => {
  let hazyDocStub

  beforeEach(() => {
    hazyDocStub = _.cloneDeep(hazyDocs)
  })

  describe('')
  
})