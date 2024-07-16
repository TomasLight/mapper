import { describe, test, expect } from 'vitest';
import { autoMap } from './autoMap';

describe('if auto mapping works well', () => {
  type Zoo = {
    name: string;
    areas: ('north' | 'west')[];
    animals: {
      catsCount: number;
      haveDogs: boolean;
      birds: ('sparrow' | 'kiwi')[];
    };
    employees: {
      cleaning: string[];
      sellers: {
        Suzie: {
          age: number;
          position: 'manager' | 'rookie';
          staffDiscount: {
            forChildren: boolean;
            forHusband: boolean;
          };
        };
      };
    };
  };

  const zoo: Zoo = {
    name: 'My Zoo',
    areas: ['north', 'west'],
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

  test('if default config maps only primitives from top level', () => {
    const newZoo = autoMap(zoo, {}, {});
    expect(newZoo).toEqual({
      name: 'My Zoo',
    } satisfies typeof newZoo);
  });

  test('if ignore primitives', () => {
    const newZoo = autoMap(
      zoo,
      {},
      {
        ignore: ['name'],
      }
    );
    expect(newZoo).toEqual({
      // empty object
    } satisfies typeof newZoo);
  });

  test('if we can copy nested objects', () => {
    const newZoo = autoMap(
      zoo,
      {},
      {
        copyObjects: true,
      }
    );

    expect(newZoo).toEqual({
      name: 'My Zoo',
      animals: {
        catsCount: 3,
        haveDogs: false,
      },
      employees: {
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
    } satisfies typeof newZoo);
  });

  test('if we can copy arrays', () => {
    const newZoo = autoMap(
      zoo,
      {},
      {
        copyArrays: true,
      }
    );

    expect(newZoo).toEqual({
      name: 'My Zoo',
      areas: ['north', 'west'],
    } satisfies typeof newZoo);
  });

  test('if we can entire object', () => {
    const newZoo = autoMap(
      zoo,
      {},
      {
        copyObjects: true,
        copyArrays: true,
      }
    );

    expect(newZoo).toEqual({
      name: 'My Zoo',
      areas: ['north', 'west'],
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
    } satisfies typeof newZoo);
  });

  test('if we can copy nested objects with selection', () => {
    const newZoo = autoMap(
      zoo,
      {},
      {
        copyObjects: true,
        select: ['employees.sellers.Suzie'],
      }
    );

    expect(newZoo).toEqual({
      employees: {
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
    } satisfies typeof newZoo);
  });

  test('if we can copy specific data', () => {
    const newZoo = autoMap(
      zoo,
      {},
      {
        copyObjects: true,
        copyArrays: true,
        select: ['employees.sellers.Suzie'],
        ignore: ['employees.sellers.Suzie.staffDiscount'],
      }
    );

    expect(newZoo).toEqual({
      employees: {
        sellers: {
          Suzie: {
            age: 23,
            position: 'manager',
          },
        },
      },
    } satisfies typeof newZoo);
  });

  test('', () => {
    const newZoo = autoMap(
      zoo,
      {},
      {
        select: [
          //
          'employees',
          'employees.cleaning',
          'employees.sellers',
          'employees.sellers.Suzie',
        ],
        copyObjects: true,
        copyArrays: true,
      }
    );

    expect(newZoo).toEqual({
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
    } satisfies typeof newZoo);
  });
});
