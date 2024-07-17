import { MapFunctionKey } from './types.js';

export class MapFunction<Source extends object, Destination extends object> {
  constructor(
    public sourceKey: MapFunctionKey<Source>,
    public destinationKey: MapFunctionKey<Destination>,
    public map: (source: Source) => Destination
  ) {}
}

/**
 * The place to define mapping logic for your models
 * @example
 * abstract class Foo {
 *   abstract name: string
 * }
 * abstract class Bar {
 *   abstract title: string
 * }
 *
 * Mapper.addMapFunctions(
 *   new MapFunction(Foo, Bar, (foo) => ({
 *     title: foo.name
 *   }))
 * )
 *
 * const bar = Mapper.map(Foo, Bar, { name: 'foo name' })
 * */
export class Mapper {
  constructor() {
    Mapper.lastCreatedInstance = this;
    this.mapFunctions = new Map();
  }

  // we can have several isolated mapper instances (for example in tests or in different React Contexts)
  private static lastCreatedInstance: Mapper;

  private static getOrCreateInstance() {
    if (Mapper.lastCreatedInstance) {
      return Mapper.lastCreatedInstance;
    }

    return new Mapper();
  }

  readonly mapFunctions: Map<
    MapFunctionKey,
    Map<MapFunctionKey, MapFunction<object, object>>
  >;

  /** It calls 'map' method in last created Mapper */
  static map: Mapper['map'] = (...args) => {
    const mapper = Mapper.getOrCreateInstance();
    return mapper.map(...args);
  };

  /**
   * It calls a map function registered for specified Source and Destination
   * @example
   * abstract class Foo {
   *   abstract name: string
   * }
   * abstract class Bar {
   *   abstract title: string
   * }
   *
   * Mapper.addMapFunctions(
   *   new MapFunction(Foo, Bar, (foo) => ({
   *     title: foo.name
   *   }))
   * )
   *
   * const bar = Mapper.map(Foo, Bar, { name: 'foo name' })
   * */
  map<Source extends object, Destination extends object>(
    sourceType: MapFunctionKey<Source>,
    destinationType: MapFunctionKey<Destination>,
    sourceModel: Source
  ): Destination {
    const mapFunction = this.findMapFunction(sourceType, destinationType) as
      | MapFunction<Source, Destination>
      | undefined;

    if (!mapFunction) {
      throw Error(
        `A mapping for types not registered (sourceType: ${sourceType.toString()}, destinationType: ${destinationType.toString()})`
      );
    }

    return mapFunction.map(sourceModel);
  }

  /** It calls 'addMapFunctions' method in last created Mapper */
  static addMapFunctions: Mapper['addMapFunctions'] = (...args) => {
    const mapper = Mapper.getOrCreateInstance();
    return mapper.addMapFunctions(...args);
  };

  /**
   * It registers map functions for specified models.
   * It will throw an error in case, when you try to a add map function for models, that already have one
   * @example
   * abstract class Foo {
   *   abstract name: string
   * }
   * abstract class Bar {
   *   abstract title: string
   * }
   *
   * Mapper.addMapFunctions(
   *   new MapFunction(Foo, Bar, (foo) => ({
   *     title: foo.name
   *   }))
   * )
   *
   * const bar = Mapper.map(Foo, Bar, { name: 'foo name' })
   * */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addMapFunctions(...mapFunctions: MapFunction<any, any>[]) {
    mapFunctions.forEach((mapFunction) => {
      const addedMapFunction = this.findMapFunction(
        mapFunction.sourceKey,
        mapFunction.destinationKey
      );
      if (addedMapFunction) {
        throw Error(
          `Adding mapping failed: the mapping key already added (sourceType: ${mapFunction.sourceKey.toString()}, destinationType: ${mapFunction.destinationKey.toString()})`
        );
      }

      let sourceMap = this.mapFunctions.get(mapFunction.sourceKey);
      if (!sourceMap) {
        sourceMap = new Map();
        this.mapFunctions.set(mapFunction.sourceKey, sourceMap);
      }

      sourceMap.set(mapFunction.destinationKey, mapFunction);
    });
  }

  /** It calls 'deleteMapFunctionFor' method in last created Mapper */
  static deleteMapFunctionFor: Mapper['deleteMapFunctionFor'] = (...args) => {
    const mapper = Mapper.getOrCreateInstance();
    return mapper.deleteMapFunctionFor(...args);
  };

  /** delete map function for specified models if it exists */
  deleteMapFunctionFor<Source extends object, Destination extends object>(
    sourceKey: MapFunctionKey<Source>,
    destinationKey: MapFunctionKey<Destination>
  ) {
    this.mapFunctions.get(sourceKey)?.delete(destinationKey);
  }

  /** It calls 'clear' method in last created Mapper */
  static clear: Mapper['clear'] = (...args) => {
    const mapper = Mapper.getOrCreateInstance();
    return mapper.clear(...args);
  };

  /** clears all registered map functions */
  clear() {
    this.mapFunctions.clear();
  }

  private findMapFunction(
    sourceKey: MapFunctionKey,
    destinationKey: MapFunctionKey
  ) {
    const sourceMap = this.mapFunctions.get(sourceKey);
    if (!sourceMap || !sourceMap.has(destinationKey)) {
      return undefined;
    }

    return sourceMap.get(destinationKey);
  }
}
