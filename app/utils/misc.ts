// Code borrowed from Kent C. Dodds Rocket Rental App
export function typedBoolean<T>(
	value: T,
): value is Exclude<T, false | null | undefined | '' | 0> {
	return Boolean(value)
}