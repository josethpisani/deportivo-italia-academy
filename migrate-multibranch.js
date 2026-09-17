import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  console.log("🚀 Starting multi-branch migration...");

  try {
    // 1. Create sedes table
    console.log("📋 Creating sedes table...");
    await sql`
      CREATE TABLE IF NOT EXISTS sedes (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        codigo TEXT NOT NULL UNIQUE,
        estado TEXT NOT NULL DEFAULT 'activa',
        direccion TEXT,
        telefono TEXT,
        email TEXT,
        logo TEXT,
        imagen_principal TEXT,
        descripcion TEXT,
        fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    // 2. Check if sedes already exist
    const existingSedes = await sql`SELECT * FROM sedes`;
    console.log(`Found ${existingSedes.length} existing sedes`);

    let panamaViejoId = "sed_panama_viejo";
    let brisasId = "sed_brisas";

    if (existingSedes.length === 0) {
      // 3. Create Panamá Viejo branch
      console.log("🏟️ Creating Panamá Viejo branch...");
      await sql`
        INSERT INTO sedes (id, nombre, codigo, estado, direccion, telefono, email, descripcion)
        VALUES (
          ${panamaViejoId},
          'Panamá Viejo',
          'PV',
          'activa',
          'Panamá Viejo, Ciudad de Panamá',
          '+507 000-0000',
          'panamaviejo@deportivoitalia.com',
          'Sede principal de Deportivo Italia Academy en Panamá Viejo'
        )
      `;

      // 4. Create Brisas branch
      console.log("🌊 Creating Brisas branch...");
      await sql`
        INSERT INTO sedes (id, nombre, codigo, estado, direccion, telefono, email, descripcion)
        VALUES (
          ${brisasId},
          'Brisas',
          'BR',
          'activa',
          'Brisas del Golf, Ciudad de Panamá',
          '+507 000-0000',
          'brisas@deportivoitalia.com',
          'Nueva sede de Deportivo Italia Academy en Brisas del Golf'
        )
      `;
      console.log("✅ Both branches created");
    } else {
      // Find existing branch IDs
      const pv = existingSedes.find(s => s.codigo === 'PV' || s.nombre.includes('Panamá'));
      const br = existingSedes.find(s => s.codigo === 'BR' || s.nombre.includes('Brisas'));
      
      if (pv) panamaViejoId = pv.id;
      if (br) brisasId = br.id;
      
      console.log(`Using existing Panamá Viejo ID: ${panamaViejoId}`);
      console.log(`Using existing Brisas ID: ${brisasId}`);
    }

    // 5. Check current app_data structure
    console.log("📊 Checking current app_data...");
    const currentData = await sql`SELECT key, value FROM app_data`;
    
    const athletesData = currentData.find(r => r.key === 'athletes')?.value || [];
    const torneosData = currentData.find(r => r.key === 'torneos')?.value || [];
    const configData = currentData.find(r => r.key === 'config')?.value || {};

    console.log(`Current athletes: ${athletesData.length}`);
    console.log(`Current torneos: ${torneosData.length}`);

    // 6. Migrate athletes to include sede_id
    if (athletesData.length > 0 && !athletesData[0]?.sede_id) {
      console.log("🔄 Migrating athletes to include sede_id...");
      const migratedAthletes = athletesData.map(a => ({
        ...a,
        sede_id: panamaViejoId
      }));
      
      await sql`
        INSERT INTO app_data (key, value, updated_at)
        VALUES ('athletes', ${JSON.stringify(migratedAthletes)}, NOW())
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
      `;
      console.log(`✅ Migrated ${migratedAthletes.length} athletes to Panamá Viejo`);
    } else {
      console.log("ℹ️ Athletes already have sede_id or no athletes to migrate");
    }

    // 7. Migrate torneos to include sede_id
    if (torneosData.length > 0 && !torneosData[0]?.sede_id) {
      console.log("🔄 Migrating torneos to include sede_id...");
      const migratedTorneos = torneosData.map(t => ({
        ...t,
        sede_id: panamaViejoId
      }));
      
      await sql`
        INSERT INTO app_data (key, value, updated_at)
        VALUES ('torneos', ${JSON.stringify(migratedTorneos)}, NOW())
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
      `;
      console.log(`✅ Migrated ${migratedTorneos.length} torneos to Panamá Viejo`);
    } else {
      console.log("ℹ️ Torneos already have sede_id or no torneos to migrate");
    }

    // 8. Config doesn't need sede_id as it's global (costs per category)
    // But we could make it per-branch in the future

    // 9. Create empty data structure for Brisas if needed
    // The API will handle empty data for new branches

    console.log("🎉 Migration completed successfully!");
    console.log(`📍 Panamá Viejo ID: ${panamaViejoId}`);
    console.log(`📍 Brisas ID: ${brisasId}`);

  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

migrate()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));