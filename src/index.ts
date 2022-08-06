const defaultCacheName = 'cache-kv'
const cacheMap = new WeakMap<Cache, string>();

export async function openCache(
	name: string,
): Promise<Cache> {
	const cache = await caches.open(name)
	cacheMap.set(cache, `https://${name}/`)
	return cache
}

let defaultCache: Cache | undefined
async function getDefaultCache(): Promise<Cache> {
	if (!defaultCache) {
		defaultCache = await openCache(defaultCacheName)
	}
	return defaultCache
}

export async function get<T = any>(
	key: string,
	cachePromise = getDefaultCache(),
): Promise<T | undefined> {
	const cache = await cachePromise
	const response = await cache.match(encodeURI(cacheMap.get(cache) + key))
	return response?.json()
}

export async function set(
	key: string,
	value: any,
	cachePromise = getDefaultCache(),
): Promise<void> {
	const cache = await cachePromise
	return cache.put(
		new Request(encodeURI(cacheMap.get(cache) + key)),
		new Response(JSON.stringify(value))
	)
}

export async function update<T = any>(
	key: string,
	updater: (currentValue: T | undefined) => T,
	cachePromise = getDefaultCache(),
): Promise<void> {
	const currentValue = await get<T>(key, cachePromise)
	return set(key, updater(currentValue), cachePromise)
}

export async function del(
	key: string,
	cachePromise = getDefaultCache(),
): Promise<boolean> {
	const cache = await cachePromise
	return cache.delete(encodeURI(cacheMap.get(cache) + key))
}

export async function keys(
	cachePromise = getDefaultCache(),
): Promise<string[] | undefined> {
	const cache = await cachePromise
	const keys = await cache.keys()
	return keys.map(key => decodeURI(key.url)
		.replace(cacheMap.get(cache) ?? '', ''))
}

export async function values<T = any>(
	cachePromise = getDefaultCache(),
): Promise<T[] | undefined> {
	const cache = await cachePromise
	const responses = await cache.matchAll()
	return Promise.all(
		responses.map(response => response?.json())
	)
}

export async function entries<T = any>(
	cachePromise = getDefaultCache(),
): Promise<[string, T][] | undefined> {
	const cache = await cachePromise
	const responses = await cache.matchAll()
	const values = await Promise.all(
		responses.map(response => response?.json())
	)

	return values.map((value, index) => [
		decodeURI(responses[index].url)
			.replace(cacheMap.get(cache) ?? '', ''),
		value
	])
}

export function clear(
	name: string = defaultCacheName,
): Promise<boolean> {
	if (name === defaultCacheName) {
		defaultCache = undefined
	}
	return caches.delete(name)
}
