import { neon } from '@neondatabase/serverless';

let cachedSql: ReturnType<typeof neon> | null = null;

export function isDatabaseConfigured() {
	return Boolean(process.env.DATABASE_URL);
}

export function getSql() {
	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) {
		throw new Error('Database URL is not set');
	}

	if (!cachedSql) {
		cachedSql = neon(databaseUrl);
	}

	return cachedSql;
}
