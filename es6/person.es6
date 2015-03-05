export class Person {

  constructor(name) {
    this.name = name;
  }

  fullname() {
    return this.name;
  }

  static getStaticProp() {
    return 1;
  }
}
