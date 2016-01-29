import assert from 'power-assert';


describe('power-assert', () => {

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
