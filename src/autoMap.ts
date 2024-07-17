import { AutoMapResult, Config, DottedKeys } from './types.js';

export const autoMap = <
  Source extends object,
  SourceConfig extends Config<Source>,
>(
  source: Source,
  destination: object,
  config: SourceConfig
): AutoMapResult<Source, SourceConfig> => {
  if (typeof source !== 'object' || source === null) {
    return source;
  }
  if (Array.isArray(source)) {
    throw new Error(
      'auto mapping is not available when the source object is an array'
    );
  }

  const sourceKeys = Object.keys(source) as (keyof typeof source)[];
  let filteredKeys = sourceKeys;
  if ('select' in config && config.select && config.select.length > 0) {
    const topLevelSelectedKeys = getFirstLevelOfDottedKeys(config.select);
    filteredKeys = filteredKeys.filter((selectedKey) =>
      topLevelSelectedKeys.includes(selectedKey as string)
    );
  }

  if ('ignore' in config && config.ignore) {
    const { ignore } = config; // unboxing to prevent appears of undefined or null in the ref
    filteredKeys = filteredKeys.filter(
      (selectedKey) => !ignore.includes(selectedKey as DottedKeys<Source>)
    );
  }

  for (const sourceKey of filteredKeys) {
    const value = source[sourceKey];
    if (Array.isArray(value)) {
      if (config.copyArrays) {
        (destination as Source)[sourceKey] = [
          ...value,
        ] as Source[typeof sourceKey];
      }
      continue;
    }

    if (value === null) {
      if ('defaultValueIfNull' in config) {
        (destination as Source)[sourceKey] =
          config.defaultValueIfNull as Source[typeof sourceKey];
        continue;
      }

      if ('defaultValueIfNullOrUndefined' in config) {
        (destination as Source)[sourceKey] =
          config.defaultValueIfNullOrUndefined as Source[typeof sourceKey];
        continue;
      }

      (destination as Source)[sourceKey] = value;
      continue;
    }

    if (value === undefined) {
      if ('defaultValueIfUndefined' in config) {
        (destination as Source)[sourceKey] =
          config.defaultValueIfUndefined as Source[typeof sourceKey];
        continue;
      }

      if ('defaultValueIfNullOrUndefined' in config) {
        (destination as Source)[sourceKey] =
          config.defaultValueIfNullOrUndefined as Source[typeof sourceKey];
        continue;
      }

      (destination as Source)[sourceKey] = value;
      continue;
    }

    if (typeof value !== 'object') {
      (destination as Source)[sourceKey] = value;
      continue;
    }

    if (!config.copyObjects) {
      continue;
    }

    const nextLevelConfig = {
      ...config,
    };

    if ('select' in nextLevelConfig && nextLevelConfig.select) {
      nextLevelConfig.select = getNextLevelOfDottedKeys(
        nextLevelConfig.select
      ) as unknown as typeof nextLevelConfig.select;
    }

    if ('ignore' in nextLevelConfig && nextLevelConfig.ignore) {
      nextLevelConfig.ignore = getNextLevelOfDottedKeys(
        nextLevelConfig.ignore
      ) as unknown as typeof nextLevelConfig.select;
    }

    const destinationKey = sourceKey as keyof typeof destination;
    destination[destinationKey] = autoMap(
      value,
      {},
      nextLevelConfig as Config<object>
    ) as unknown as (typeof destination)[typeof destinationKey];
  }

  return destination as AutoMapResult<Source, SourceConfig>;
};

export function getFirstLevelOfDottedKeys<T extends object>(
  dottedKeys: DottedKeys<T>[]
) {
  return dottedKeys.map((dottedKey) => {
    if (typeof dottedKey !== 'string') {
      return dottedKey;
    }
    const firstDotIndex = dottedKey.indexOf('.');
    if (firstDotIndex > -1) {
      return dottedKey.substring(0, firstDotIndex);
    }
    return dottedKey;
  });
}

export function getNextLevelOfDottedKeys<T extends object>(
  dottedKeys: DottedKeys<T>[]
) {
  const filteredKeys = dottedKeys.filter(
    (key) => typeof key === 'string' && key.includes('.')
  ) as string[];
  return filteredKeys.map((dottedKey) => {
    const firstDotIndex = dottedKey.indexOf('.');
    return dottedKey.substring(firstDotIndex + 1);
  });
}
