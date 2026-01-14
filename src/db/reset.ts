import { sql } from 'drizzle-orm'
import { client, db } from './index'

async function reset() {
  console.log('🗑️ Resetting database...')

  try {
    await db.execute(sql`
      DO $$ DECLARE
          r RECORD;
      BEGIN
          FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT LIKE '_drizzle%') LOOP
              EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' RESTART IDENTITY CASCADE';
          END LOOP;
      END $$;
    `)

    console.log('✅ Database reset successfully')
  } catch (error) {
    console.error('❌ Database reset failed:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

reset()
