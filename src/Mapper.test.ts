import { describe, test, expect, beforeEach } from 'vitest';
import { autoMap } from './autoMap';
import { MapFunction, Mapper } from './Mapper';

class Class1 {
  myProp: string;

  constructor(myProp: string) {
    this.myProp = myProp;
  }
}

class Class2 {
  yourProp: string;

  constructor(yourProp: string) {
    this.yourProp = yourProp;
  }
}

const mapFn1 = new MapFunction(
  Class1,
  Class2,
  (class1) => new Class2(class1.myProp)
);
const mapFn2 = new MapFunction(
  Class2,
  Class1,
  (class2) => new Class1(class2.yourProp)
);

describe('[class] Mapper', () => {
  const mapper = new Mapper();

  beforeEach(() => {
    mapper.clear();
  });

  test('if we can use symbols as map function keys', () => {
    const symbol1 = Symbol('test dto');
    const symbol2 = Symbol('mapped object');

    const dto = {
      date: '2023-02-15T13:20:48.794Z',
    };

    type MyObj = {
      date: Date;
    };

    mapper.addMapFunctions(
      new MapFunction<typeof dto, MyObj>(symbol1, symbol2, (dto) => ({
        date: new Date(dto.date),
      }))
    );

    const mappedObj = mapper.map<typeof dto, MyObj>(symbol1, symbol2, dto);
    expect(mappedObj.date instanceof Date).toBeTruthy();
    expect(mappedObj.date.toISOString()).toBe(dto.date);
  });

  test('[method] deleteMapFunctionFor deletes map function', () => {
    mapper.addMapFunctions(mapFn1);

    expect(mapper.mapFunctions.get(Class1)?.get(Class2)).toBeDefined();

    mapper.deleteMapFunctionFor(Class1, Class2);

    expect(mapper.mapFunctions.get(Class1)?.get(Class2)).toBeUndefined();
  });

  describe('[method] addProfile', () => {
    test('add 1 profile', () => {
      mapper.addMapFunctions(mapFn1);

      expect(mapper['mapFunctions'].size).toBe(1);
      expect(mapper['mapFunctions'].get(Class1)!.get(Class2)).toBe(mapFn1);
    });

    test('add 2 profiles', () => {
      mapper.addMapFunctions(mapFn1);
      mapper.addMapFunctions(mapFn2);

      expect(mapper['mapFunctions'].size).toBe(2);
      expect(mapper['mapFunctions'].get(Class1)!.get(Class2)).toBe(mapFn1);
      expect(mapper['mapFunctions'].get(Class2)!.get(Class1)).toBe(mapFn2);
    });

    test('if tries to register mapper for already registered token, it should to throw an exception', () => {
      expect(() => {
        mapper.addMapFunctions(mapFn1, mapFn1);
      }).toThrow();
    });
  });

  describe('[method] map', () => {
    test('class 1 -> class 2', () => {
      mapper.addMapFunctions(mapFn1);

      const obj1 = new Class1('qwe');
      const result = mapper.map(Class1, Class2, obj1);

      expect(result instanceof Class2).toBe(true);
      expect(result.yourProp).toBe('qwe');
    });

    test('class 2 -> class 1', () => {
      mapper.addMapFunctions(mapFn2);

      const obj2 = new Class2('qqq');
      const result = mapper.map(Class2, Class1, obj2);

      expect(result instanceof Class1).toBe(true);
      expect(result.myProp).toBe('qqq');
    });

    test('if tries to map model without registered profile, it should to throw an exception', () => {
      mapper.addMapFunctions(mapFn1, mapFn2);

      class Class3 {}

      expect(() => {
        mapper.map(Class3, Class1, {
          any: 123,
        });
      }).toThrow();
    });

    test('abstract class -> regular class', () => {
      abstract class Dto {
        abstract value: number;
      }

      class Model {
        value = 2;
      }

      const mapFunction = new MapFunction(Dto, Model, (dto) => {
        const model = new Model();
        model.value = dto.value;
        return model;
      });

      mapper.addMapFunctions(mapFunction);

      const dto: Dto = {
        value: 14,
      };
      const result = mapper.map(Dto, Model, dto);

      expect(result instanceof Model).toBe(true);
      expect(result.value).toBe(14);
    });

    test('abstract class -> abstract class', () => {
      abstract class Dto {
        abstract name: string;
      }

      abstract class Model {
        abstract name: string;
      }

      const mapFunction = new MapFunction(Dto, Model, (dto) => {
        return {
          name: dto.name,
        };
      });

      mapper.addMapFunctions(mapFunction);

      const dto: Dto = {
        name: 'my name',
      };
      const result = mapper.map(Dto, Model, dto);

      expect(result.name).toBe('my name');
    });
  });

  describe('using auto mapping', () => {
    test('if primitives are auto mapped correctly with default config', () => {
      abstract class UserDto {
        abstract name: string;
        abstract age: number;
        abstract married: boolean;
        abstract id: symbol;
        abstract children: { name: string }[];
      }

      abstract class User {
        abstract name: string;
        abstract age: number;
        abstract married: boolean;
        abstract id: symbol;
      }

      const mapFunction = new MapFunction<UserDto, User>(UserDto, User, (dto) =>
        autoMap(dto, {}, {})
      );

      mapper.addMapFunctions(mapFunction);

      const dto: UserDto = {
        age: 23,
        name: 'Joe',
        married: false,
        id: Symbol(),
        children: [{ name: 'Alex' }],
      };
      const user = mapper.map(UserDto, User, dto);

      expect(user).toEqual({
        age: 23,
        name: 'Joe',
        married: false,
        id: dto.id,
      } satisfies typeof user);
    });

    test('extra properties should be mapped separately', () => {
      abstract class UserDto {
        abstract name: string;
        abstract age: number;
        abstract children?: { name: string }[];
      }

      abstract class User {
        abstract name: string;
        abstract age: number;
        abstract deleted: boolean;
      }

      const mapFunction = new MapFunction<UserDto, User>(
        UserDto,
        User,
        (dto) => {
          const user = autoMap(dto, {}, {});
          return {
            deleted: true,
            ...user,
          };
        }
      );

      mapper.addMapFunctions(mapFunction);

      const dto: UserDto = {
        age: 23,
        name: 'Joe',
        children: [{ name: 'Alex' }],
      };
      const user = mapper.map(UserDto, User, dto);

      expect(user).toEqual({
        age: 23,
        name: 'Joe',
        deleted: true,
      } satisfies typeof user);
    });

    test('if array will be copied when it specified in config', () => {
      abstract class UserDto {
        abstract name: string;
        abstract age: number;
        abstract children: { name: string }[];
      }

      abstract class User {
        abstract name: string;
        abstract age: number;
        abstract deleted: boolean;
        abstract children: { name: string }[];
      }

      const mapFunction = new MapFunction<UserDto, User>(
        UserDto,
        User,
        (dto) => {
          const user = autoMap(
            dto,
            {},
            {
              copyArrays: true,
            }
          );
          return {
            deleted: true,
            ...user,
          };
        }
      );

      mapper.addMapFunctions(mapFunction);

      const dto: UserDto = {
        age: 23,
        name: 'Joe',
        children: [{ name: 'Alex' }],
      };
      const user = mapper.map(UserDto, User, dto);

      expect(user).toEqual({
        age: 23,
        name: 'Joe',
        deleted: true,
        children: [{ name: 'Alex' }],
      } satisfies typeof user);
    });

    test('if will be mapped only selected properties', () => {
      abstract class UserDto {
        abstract name: string;
        abstract age: number;
        abstract id: number;
        abstract sex: 'male' | 'female';
        abstract children: { name: string }[];
      }

      abstract class User {
        abstract age: number;
      }

      const mapFunction = new MapFunction<UserDto, User>(UserDto, User, (dto) =>
        autoMap(
          dto,
          {},
          {
            select: ['age'],
          }
        )
      );

      mapper.addMapFunctions(mapFunction);

      const dto: UserDto = {
        age: 23,
        name: 'Joe',
        sex: 'male',
        id: 33445,
        children: [{ name: 'Alex' }],
      };
      const user = mapper.map(UserDto, User, dto);

      expect(user).toEqual({
        age: 23,
      } satisfies typeof user);
    });

    test('if ignored properties will not be mapped', () => {
      abstract class UserDto {
        abstract name: string;
        abstract age: number;
        abstract id: number;
        abstract sex: 'male' | 'female';
        abstract children: { name: string }[];
      }

      abstract class User {
        abstract name: string;
        abstract age: number;
      }

      const mapFunction = new MapFunction<UserDto, User>(UserDto, User, (dto) =>
        autoMap(
          dto,
          {},
          {
            ignore: ['id', 'sex'],
          }
        )
      );

      mapper.addMapFunctions(mapFunction);

      const dto: UserDto = {
        age: 23,
        name: 'Joe',
        sex: 'male',
        id: 33445,
        children: [{ name: 'Alex' }],
      };
      const user = mapper.map(UserDto, User, dto);

      expect(user).toEqual({
        name: 'Joe',
        age: 23,
      } satisfies typeof user);
    });
  });
});

describe('static instance access', () => {
  abstract class Dto {
    abstract name: string;
  }
  abstract class User {
    abstract name: string;
  }

  beforeEach(() => {
    Mapper.clear();
  });

  test('have map function Dto => User', () => {
    const mapFunction = new MapFunction<Dto, User>(Dto, User, (dto) =>
      autoMap(dto, {}, {})
    );
    Mapper.addMapFunctions(mapFunction);

    const dto: Dto = {
      name: 'Joe',
    };
    const user = Mapper.map(Dto, User, dto);

    expect(user).toEqual({
      name: 'Joe',
    } satisfies typeof user);
  });

  describe('create new Mapper', () => {
    test('does not have previously registered map functions', () => {
      expect(() =>
        Mapper.map(Dto, User, {
          name: 'Joe',
        })
      ).toThrowError(
        `A mapping for types not registered (sourceType: ${Dto.toString()}, destinationType: ${User.toString()})`
      );
    });

    test('map functions registered in new Mapper', () => {
      const mapFunction = new MapFunction<User, Dto>(User, Dto, (dto) =>
        autoMap(dto, {}, {})
      );
      Mapper.addMapFunctions(mapFunction);

      const user: User = {
        name: 'Joe',
      };
      const dto = Mapper.map(User, Dto, user);

      expect(dto).toEqual({
        name: 'Joe',
      } satisfies typeof dto);
    });
  });
});
