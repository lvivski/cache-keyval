const defaultCacheName = 'cache-kv'
const cacheMap = new WeakMap<Cache, string>();

export async function openStore(
	name: string,
): Promise<Cache> {
	const cache = await caches.open(name)
	cacheMap.set(cache, `https://${name}/`)
	return cache
}

let defaultStore: Cache | undefined
async function getDefaultStore(): Promise<Cache> {
	if (!defaultStore) {
		defaultStore = await openStore(defaultCacheName)
	}
	return defaultStore
}

export async function get<T = any>(
	key: string,
	cachePromise = getDefaultStore(),
): Promise<T | undefined> {
	const cache = await cachePromise
	const response = await cache.match(encodeURI(cacheMap.get(cache) + key))
	return response?.json()
}

export async function set(
	key: string,
	value: any,
	cachePromise = getDefaultStore(),
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
	cachePromise = getDefaultStore(),
): Promise<void> {
	const currentValue = await get<T>(key, cachePromise)
	return set(key, updater(currentValue), cachePromise)
}

export async function del(
	key: string,
	cachePromise = getDefaultStore(),
): Promise<boolean> {
	const cache = await cachePromise
	return cache.delete(encodeURI(cacheMap.get(cache) + key))
}

export async function keys(
	cachePromise = getDefaultStore(),
): Promise<string[] | undefined> {
	const cache = await cachePromise
	const keys = await cache.keys()
	return keys.map(key => decodeURI(key.url)
		.replace(cacheMap.get(cache) ?? '', ''))
}

export async function values<T = any>(
	cachePromise = getDefaultStore(),
): Promise<T[] | undefined> {
	const cache = await cachePromise
	const responses = await cache.matchAll()
	return Promise.all(
		responses.map(response => response?.json())
	)
}

export function clear(
	name: string = defaultCacheName,
): Promise<boolean> {
	if (name === defaultCacheName) {
		defaultStore = undefined
	}
	return caches.delete(name)
}
