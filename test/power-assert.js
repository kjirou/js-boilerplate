import assert from 'power-assert';

import PowerAssertTester from '../src/lib/PowerAssertTester';


describe('power-assert', () => {

  //it('is not working?', () => {
  //  // OK
  //  //assert.strictEqual([1, 2].length, 3);

  //  // OK
  //  //const ary = [1, 2];
  //  //assert.strictEqual(ary.length, 3);

  //  // OK
  //  //class Foo {
  //  //  constructor() {
  //  //    this.ary = [1, 2];
  //  //  }
  //  //}
  //  //const foo = new Foo();
  //  //assert.strictEqual(foo.ary.length, 3);

  //  // OK
  //  //const tester = new PowerAssertTester();
  //  //tester._ary = [1, 2];
  //  //assert.strictEqual(tester._ary.length, 3);
  //})

  it('is enabled', () => {
    const actual = {
      foo: 1,
      bar: [2, 3],
    };
    const expected = {
      foo: 1,
      bar: [22, 3],
    };
    assert.deepEqual(actual, expected);
  });
});
