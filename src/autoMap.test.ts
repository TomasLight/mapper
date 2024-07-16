import { describe, test, expect } from 'vitest';
import { autoMap } from './autoMap';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const expectType = <T>(valueOfType: T): void => undefined;

describe('use cases', () => {
  const userSource = () => ({
    name: 'Joe',
    age: 34,
    married: false,
    id: Symbol('unique id'),
    children: ['Paul', 'Eva'],
    education: {
      high: true,
      master: false,
    },
  });

  test('if only primitives are copied with empty config', () => {
    const user = userSource();
    const newUser = autoMap(user, {}, {});

    expectType<{
      name: string;
      age: number;
      married: boolean;
      id: symbol;
    }>(newUser);

    expect(newUser).toEqual({
      name: user.name,
      age: user.age,
      married: user.married,
      id: user.id,
    });
  });

  test('if we can ignore some properties with config', () => {
    const user = userSource();
    const newUser = autoMap(user, {}, { ignore: ['married', 'id'] });

    expectType<{
      name: string;
      age: number;
    }>(newUser);

    expect(newUser).toEqual({
      name: user.name,
      age: user.age,
    });
  });

  test('if we can choose, which of properties should be mapped with config', () => {
    const user = userSource();
    const newUser = autoMap(
      user,
      {},
      { select: ['id', 'education.high'], copyObjects: true }
    );

    expectType<{
      id: symbol;
      education: {
        high: boolean;
      };
    }>(newUser);

    expect(newUser).toEqual({
      id: user.id,
      education: {
        high: user.education.high,
      },
    });
  });

  test('if we can copy nested objects and array with config', () => {
    const user = userSource();
    const newUser = autoMap(
      user,
      {},
      {
        select: ['education', 'children'],
        copyObjects: true,
        copyArrays: true,
      }
    );

    expectType<{
      education: {
        high: boolean;
      };
      children: string[];
    }>(newUser);

    expect(newUser).toEqual({
      education: user.education,
      children: user.children,
    });
  });

  test('if we can copy nested objects with config (very deep)', () => {
    const deepObjects = {
      level1: {
        check: true,
        level22: {
          foo: '1',
        },
        level2: {
          bar: '2',
          level31: {
            bar3: false,
          },
          level3: {
            zax: 3,
            level4: {
              cosmo: null,
            },
          },
        },
      },
    };
    const newUser = autoMap(
      deepObjects,
      {},
      {
        select: [
          'level1.level2.bar',
          'level1.level2.level3.zax',
          'level1.level2.level3.level4',
        ],
        copyObjects: true,
        copyArrays: true,
      }
    );

    expectType<{
      level1: {
        level2: {
          bar: string;
          level3: {
            zax: number;
            level4: {
              cosmo: null;
            };
          };
        };
      };
    }>(newUser);

    expect(newUser).toEqual({
      level1: {
        level2: {
          bar: '2',
          level3: {
            zax: 3,
            level4: {
              cosmo: null,
            },
          },
        },
      },
    });
  });

  test('if ignore has more priority than select', () => {
    const zoo = {
      name: 'My Zoo',
      animals: {
        catsCount: 3,
        haveDogs: false,
        birds: ['sparrow', 'kiwi'],
      },
      employees: {
        cleaning: ['Joe'],
        sellers: {
          Suzie: {
            age: 23,
            position: 'manager',
            staffDiscount: {
              forChildren: true,
              forHusband: false,
            },
          },
        },
      },
    };

    const newZoo = autoMap(
      zoo,
      {},
      {
        select: ['employees.sellers.Suzie'],
        ignore: ['employees.sellers.Suzie.position'],
        copyObjects: true,
        copyArrays: true,
      }
    );

    expectType<{
      employees: {
        sellers: {
          Suzie: {
            age: number;
            staffDiscount: {
              forChildren: boolean;
              forHusband: boolean;
            };
          };
        };
      };
    }>(newZoo);

    expect(newZoo).toEqual({
      employees: {
        sellers: {
          Suzie: {
            age: 23,
            staffDiscount: {
              forChildren: true,
              forHusband: false,
            },
          },
        },
      },
    } satisfies typeof newZoo);
  });
});

test('if it is a new object', () => {
  const source = { some: 'qqq' };
  const destination = autoMap(source, {}, {});

  expectType<{
    some: string;
  }>(destination);

  expect(destination).not.toBe(source);
});

describe('if primitive properties are mapped', () => {
  const symbol = Symbol('any custom symbol');
  const source = {
    stringProperty: 'qqq',
    numberProperty: 123,
    booleanProperty: true,
    undefinedProperty: undefined,
    symbolProperty: symbol,
  };
  const destination = autoMap(source, {}, {});

  expectType<{
    stringProperty: string;
    numberProperty: number;
    booleanProperty: boolean;
    undefinedProperty: undefined;
    symbolProperty: symbol;
  }>(destination);

  test('string property is mapped', () => {
    expect(destination.stringProperty).toBe('qqq');
  });
  test('number property is mapped', () => {
    expect(destination.numberProperty).toBe(123);
  });
  test('boolean property is mapped', () => {
    expect(destination.booleanProperty).toBe(true);
  });
  test('undefined property is mapped', () => {
    expect('undefinedProperty' in destination).toBeTruthy();
    expect(destination.undefinedProperty).toBe(undefined);
  });
  test('symbol property is mapped', () => {
    expect(destination.symbolProperty).toBe(symbol);
  });
});

describe('if object properties are mapped', () => {
  const array = ['item 1', 'item 2', 'item 3'];
  const source = {
    nullProperty: null,
    arrayProperty: array,
  };
  const destination = autoMap(
    source,
    {},
    { copyObjects: true, copyArrays: true }
  );

  expectType<{
    nullProperty: null;
    arrayProperty: string[];
  }>(destination);

  test('null property is mapped', () => {
    expect(destination.nullProperty).toBe(null);
  });
  test('array property is mapped', () => {
    expect(destination.arrayProperty).toEqual(['item 1', 'item 2', 'item 3']);
  });
  test('array property is mapped to new array', () => {
    expect(destination.arrayProperty).not.toBe(array);
  });

  describe('nested objects', () => {
    const source = {
      some: {
        stringProperty: 'qqq',
      },
      another: {
        numberProperty: 444,
      },
    };

    const destination = autoMap(source, {}, { copyObjects: true });

    expectType<{
      some: {
        stringProperty: string;
      };
      another: {
        numberProperty: number;
      };
    }>(destination);

    test('nested objects has different refs', () => {
      expect(destination.some).not.toBe(source.some);
      expect(destination.another).not.toBe(source.another);
    });

    test('nested objects are fully copied', () => {
      expect(destination.some.stringProperty).toBe(source.some.stringProperty);
      expect(destination.another.numberProperty).toBe(
        source.another.numberProperty
      );
    });
  });
});

test('filled destination', () => {
  const obj1 = {
    prop1: 'qqq',
    prop2: 123,
  };
  const obj2 = {
    prop2: 444,
    prop3: '345',
  };

  const result = autoMap(obj1, obj2, {});
  expectType<{
    prop1: string;
    prop2: number;
  }>(result);
  expect(result).toBe(obj2);

  const obj1And2 = obj2 as typeof obj1 & typeof obj2;

  expect(obj1And2.prop1).toBe('qqq');
  expect(obj1And2.prop2).toBe(123);
  expect(obj1And2.prop3).toBe('345');
});

test('empty destination', () => {
  const source = {
    prop1: 'qqq',
  };

  const destination = autoMap(source, {}, {});

  expectType<{
    prop1: string;
  }>(destination);

  expect(destination).not.toBe(source);
  expect(destination.prop1).toBe('qqq');
});

test('autoMap just return source, if passed null as source', () => {
  const result = autoMap(null as unknown as object, {}, {});
  expect(result).toBeNull();
});

test('autoMap just return source, if passed not an object as source', () => {
  const result = autoMap('' as unknown as object, {}, {});
  expect(result).toBe('');
});

test('autoMap throws an error, if array passed as source', () => {
  expect(() => autoMap([] as unknown as object, {}, {})).toThrowError(
    'auto mapping is not available when the source object is an array'
  );
});

test('symbols in select config will be ignored', () => {
  const symbol = Symbol('some prop');
  const result = autoMap(
    {
      name: 'Joe',
      [symbol]: 123,
    },
    {},
    {
      select: ['name', symbol as unknown as 'name'],
    }
  );

  expectType<{
    name: string;
  }>(result);

  expect(result).toEqual({
    name: 'Joe',
  });
});

describe('if default value is applied to undefined values', () => {
  test('null as default value', () => {
    const source = {
      numberProperty: 123,
      nullProperty: null,
      undefinedProperty: undefined,
      booleanProperty: false,
      nested: {
        prop1: undefined,
        prop2: '',
      },
    };
    const destination = autoMap(
      source,
      {},
      { copyObjects: true, defaultValueIfUndefined: null }
    );

    expectType<{
      numberProperty: number;
      nullProperty: null;
      undefinedProperty: undefined | null;
      booleanProperty: boolean;
      nested: {
        prop1: undefined | null;
        prop2: string;
      };
    }>(destination);

    expect(destination).toEqual({
      numberProperty: 123,
      nullProperty: null,
      undefinedProperty: null,
      booleanProperty: false,
      nested: {
        prop1: null,
        prop2: '',
      },
    });
  });

  test('"default string" as default value', () => {
    const source = {
      numberProperty: 123,
      nullProperty: null,
      undefinedProperty: undefined,
      booleanProperty: false,
      nested: {
        prop1: undefined,
        prop2: '',
      },
    };
    const destination = autoMap(
      source,
      {},
      {
        copyObjects: true,
        defaultValueIfUndefined: 'default for undefined' as const,
      }
    );

    expectType<{
      numberProperty: number;
      nullProperty: null;
      undefinedProperty: undefined | 'default for undefined';
      booleanProperty: boolean;
      nested: {
        prop1: undefined | 'default for undefined';
        prop2: string;
      };
    }>(destination);

    expect(destination).toEqual({
      numberProperty: 123,
      nullProperty: null,
      undefinedProperty: 'default for undefined',
      booleanProperty: false,
      nested: {
        prop1: 'default for undefined',
        prop2: '',
      },
    });
  });

  test('null as default value for optional fields', () => {
    const source: {
      prop1: number;
      prop2?: string;
    } = {
      prop1: 123,
    };
    const destination = autoMap(
      source,
      {},
      { copyObjects: true, defaultValueIfUndefined: 123 as const }
    );

    expectType<{
      prop1: number;
      prop2: string | 123 | undefined;
    }>(destination);

    expect(destination).toEqual({
      prop1: 123,
    });
  });
});

describe('if default value is applied to null values', () => {
  test('undefined as default value', () => {
    const source = {
      numberProperty: 123,
      nullProperty: null,
      undefinedProperty: undefined,
      booleanProperty: false,
      nested: {
        prop1: undefined,
        prop2: '',
      },
    };
    const destination = autoMap(
      source,
      {},
      { copyObjects: true, defaultValueIfNull: undefined }
    );

    expectType<{
      numberProperty: number;
      nullProperty: null | undefined;
      undefinedProperty: undefined;
      booleanProperty: boolean;
      nested: {
        prop1: undefined;
        prop2: string;
      };
    }>(destination);

    expect(destination).toEqual({
      numberProperty: 123,
      nullProperty: undefined,
      undefinedProperty: undefined,
      booleanProperty: false,
      nested: {
        prop1: undefined,
        prop2: '',
      },
    });
  });

  test('"default string" as default value', () => {
    const source = {
      numberProperty: 123,
      nullProperty: null,
      undefinedProperty: undefined,
      booleanProperty: false,
      nested: {
        prop1: undefined,
        prop2: '',
      },
    };
    const destination = autoMap(
      source,
      {},
      { copyObjects: true, defaultValueIfNull: 'default for null' as const }
    );

    expectType<{
      numberProperty: number;
      nullProperty: null | 'default for null';
      undefinedProperty: undefined;
      booleanProperty: boolean;
      nested: {
        prop1: undefined;
        prop2: string;
      };
    }>(destination);

    expect(destination).toEqual({
      numberProperty: 123,
      nullProperty: 'default for null',
      undefinedProperty: undefined,
      booleanProperty: false,
      nested: {
        prop1: undefined,
        prop2: '',
      },
    });
  });

  test('optional fields are not affected', () => {
    const source: {
      prop1: number;
      prop2?: string;
    } = {
      prop1: 123,
    };
    const destination = autoMap(
      source,
      {},
      { copyObjects: true, defaultValueIfNull: 'default for null' as const }
    );

    expectType<{
      prop1: number;
      prop2: string | undefined;
    }>(destination);

    expect(destination).toEqual({
      prop1: 123,
    });
  });
});

describe('if default value is applied to null and undefined values', () => {
  test('null as default value', () => {
    const source = {
      numberProperty: 123,
      nullProperty: null,
      undefinedProperty: undefined,
      booleanProperty: false,
      nested: {
        prop1: undefined,
        prop2: '',
      },
    };
    const destination = autoMap(
      source,
      {},
      { copyObjects: true, defaultValueIfNullOrUndefined: null }
    );

    expectType<{
      numberProperty: number;
      nullProperty: null | undefined;
      undefinedProperty: null | undefined;
      booleanProperty: boolean;
      nested: {
        prop1: null | undefined;
        prop2: string;
      };
    }>(destination);

    expect(destination).toEqual({
      numberProperty: 123,
      nullProperty: null,
      undefinedProperty: null,
      booleanProperty: false,
      nested: {
        prop1: null,
        prop2: '',
      },
    });
  });

  test('"default string" as default value', () => {
    const source = {
      numberProperty: 123,
      nullProperty: null,
      undefinedProperty: undefined,
      booleanProperty: false,
      nested: {
        prop1: undefined,
        prop2: '',
      },
    };
    const destination = autoMap(
      source,
      {},
      {
        copyObjects: true,
        defaultValueIfNullOrUndefined: 'default for null or undefined' as const,
      }
    );

    expectType<{
      numberProperty: number;
      nullProperty: null | 'default for null or undefined';
      undefinedProperty: undefined | 'default for null or undefined';
      booleanProperty: boolean;
      nested: {
        prop1: undefined | 'default for null or undefined';
        prop2: string;
      };
    }>(destination);

    expect(destination).toEqual({
      numberProperty: 123,
      nullProperty: 'default for null or undefined',
      undefinedProperty: 'default for null or undefined',
      booleanProperty: false,
      nested: {
        prop1: 'default for null or undefined',
        prop2: '',
      },
    });
  });

  test('optional fields are not affected', () => {
    const source: {
      prop1: number;
      prop2?: string;
    } = {
      prop1: 123,
    };
    const destination = autoMap(
      source,
      {},
      {
        copyObjects: true,
        defaultValueIfNullOrUndefined: 'default for null or undefined' as const,
      }
    );

    expectType<{
      prop1: number;
      prop2: string | undefined;
    }>(destination);

    expect(destination).toEqual({
      prop1: 123,
    });
  });
});

test('check if any and unknown types are inferred', () => {
  const a: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    foo?: any;
    age?: number;
    id?: number;
  } = {};

  const b = autoMap(
    a,
    {},
    {
      defaultValueIfUndefined: 123,
    }
  );

  expectType<unknown>(b.foo);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expectType<any>(b.foo);

  expectType<{
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    foo?: any;
    age?: number;
    id?: number;
  }>(b);

  expect(true).toBeTruthy();
});

test('auto map properties in class constructor', () => {
  class User {
    name?: string;
    age?: number;
    id?: number;

    constructor(user: User) {
      autoMap(user, this, {
        defaultValueIfUndefined: null,
      });
    }
  }

  const initialUser = new User({
    age: 2,
    name: 'Joe',
    id: 123,
  });

  const userCopy = new User(initialUser);

  expect(userCopy).toEqual({
    age: 2,
    name: 'Joe',
    id: 123,
  });
});
