#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { Pool } = require('pg');

// Database configuration
const getDbConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'sharepoint_ai_dashboard',
    user: process.env.DB_USER || 'sharepointai',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: parseInt(process.env.DB_POOL_MAX || '10'),
    idleTimeoutMillis: parseInt(process.env.DB_TIMEOUT || '30000'),
    connectionTimeoutMillis: parseInt(process.env.DB_TIMEOUT || '30000'),
  };
};

class MigrationRunner {
  constructor() {
    this.pool = null;
    this.migrationsDir = path.join(__dirname, '..', 'migrations');
  }

  async connect() {
    try {
      this.pool = new Pool(getDbConfig());
      
      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      console.log('✓ Connected to database');
    } catch (error) {
      console.error('✗ Failed to connect to database:', error.message);
      process.exit(1);
    }
  }

  async disconnect() {
    if (this.pool) {
      await this.pool.end();
      console.log('✓ Disconnected from database');
    }
  }

  async createMigrationsTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await this.pool.query(query);
    console.log('✓ Migrations table ready');
  }

  async getAppliedMigrations() {
    const result = await this.pool.query(
      'SELECT version FROM schema_migrations ORDER BY version'
    );
    return result.rows.map(row => row.version);
  }

  async getMigrationFiles() {
    try {
      const files = await fs.readdir(this.migrationsDir);
      return files
        .filter(file => file.endsWith('.sql'))
        .sort()
        .map(file => ({
          version: path.basename(file, '.sql'),
          filename: file,
          path: path.join(this.migrationsDir, file)
        }));
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('No migrations directory found');
        return [];
      }
      throw error;
    }
  }

  async runMigration(migration) {
    console.log(`Running migration: ${migration.version}`);
    
    try {
      const sql = await fs.readFile(migration.path, 'utf8');
      
      // Execute migration in a transaction
      const client = await this.pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Split SQL by semicolons and execute each statement
        const statements = sql
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        for (const statement of statements) {
          if (statement.trim()) {
            await client.query(statement);
          }
        }
        
        // Record migration
        await client.query(
          'INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT (version) DO NOTHING',
          [migration.version]
        );
        
        await client.query('COMMIT');
        console.log(`✓ Migration ${migration.version} completed`);
        
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
      
    } catch (error) {
      console.error(`✗ Migration ${migration.version} failed:`, error.message);
      throw error;
    }
  }

  async migrate() {
    console.log('Starting database migration...\n');
    
    await this.connect();
    await this.createMigrationsTable();
    
    const appliedMigrations = await this.getAppliedMigrations();
    const migrationFiles = await this.getMigrationFiles();
    
    console.log(`Found ${migrationFiles.length} migration files`);
    console.log(`${appliedMigrations.length} migrations already applied\n`);
    
    const pendingMigrations = migrationFiles.filter(
      migration => !appliedMigrations.includes(migration.version)
    );
    
    if (pendingMigrations.length === 0) {
      console.log('✓ No pending migrations');
      return;
    }
    
    console.log(`Running ${pendingMigrations.length} pending migrations:\n`);
    
    for (const migration of pendingMigrations) {
      await this.runMigration(migration);
    }
    
    console.log(`\n✓ All migrations completed successfully!`);
  }

  async rollback(target) {
    console.log(`Rolling back to migration: ${target}\n`);
    
    await this.connect();
    await this.createMigrationsTable();
    
    const appliedMigrations = await this.getAppliedMigrations();
    const migrationFiles = await this.getMigrationFiles();
    
    // Find target migration
    const targetIndex = migrationFiles.findIndex(m => m.version === target);
    if (targetIndex === -1) {
      console.error(`✗ Migration ${target} not found`);
      process.exit(1);
    }
    
    // Find migrations to rollback (applied migrations after target)
    const migrationsToRollback = appliedMigrations
      .filter(version => version > target)
      .reverse(); // Rollback in reverse order
    
    if (migrationsToRollback.length === 0) {
      console.log('✓ No migrations to rollback');
      return;
    }
    
    console.log(`Rolling back ${migrationsToRollback.length} migrations:\n`);
    
    for (const version of migrationsToRollback) {
      console.log(`Rolling back: ${version}`);
      
      // Check if rollback file exists
      const rollbackFile = path.join(this.migrationsDir, `${version}_rollback.sql`);
      
      try {
        const sql = await fs.readFile(rollbackFile, 'utf8');
        
        const client = await this.pool.connect();
        
        try {
          await client.query('BEGIN');
          await client.query(sql);
          
          // Remove migration record
          await client.query(
            'DELETE FROM schema_migrations WHERE version = $1',
            [version]
          );
          
          await client.query('COMMIT');
          console.log(`✓ Rollback ${version} completed`);
          
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
        
      } catch (error) {
        if (error.code === 'ENOENT') {
          console.error(`✗ Rollback file not found: ${rollbackFile}`);
        } else {
          console.error(`✗ Rollback ${version} failed:`, error.message);
        }
        throw error;
      }
    }
    
    console.log(`\n✓ Rollback completed successfully!`);
  }

  async status() {
    await this.connect();
    await this.createMigrationsTable();
    
    const appliedMigrations = await this.getAppliedMigrations();
    const migrationFiles = await this.getMigrationFiles();
    
    console.log('Migration Status:\n');
    console.log('Applied Migrations:');
    if (appliedMigrations.length === 0) {
      console.log('  None');
    } else {
      appliedMigrations.forEach(version => {
        console.log(`  ✓ ${version}`);
      });
    }
    
    console.log('\nPending Migrations:');
    const pendingMigrations = migrationFiles.filter(
      migration => !appliedMigrations.includes(migration.version)
    );
    
    if (pendingMigrations.length === 0) {
      console.log('  None');
    } else {
      pendingMigrations.forEach(migration => {
        console.log(`  ○ ${migration.version}`);
      });
    }
    
    console.log(`\nTotal: ${appliedMigrations.length} applied, ${pendingMigrations.length} pending`);
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const runner = new MigrationRunner();
  
  try {
    switch (command) {
      case 'up':
      case 'migrate':
        await runner.migrate();
        break;
        
      case 'down':
      case 'rollback':
        const target = args[1];
        if (!target) {
          console.error('Usage: migrate rollback <target_migration>');
          process.exit(1);
        }
        await runner.rollback(target);
        break;
        
      case 'status':
        await runner.status();
        break;
        
      default:
        console.log('SharePoint AI Dashboard - Database Migration Tool');
        console.log('');
        console.log('Usage:');
        console.log('  migrate up           Run pending migrations');
        console.log('  migrate down <ver>   Rollback to specific migration');
        console.log('  migrate status       Show migration status');
        console.log('');
        console.log('Environment Variables:');
        console.log('  DB_HOST              Database host (default: localhost)');
        console.log('  DB_PORT              Database port (default: 5432)');
        console.log('  DB_NAME              Database name');
        console.log('  DB_USER              Database user');
        console.log('  DB_PASSWORD          Database password');
        console.log('  DB_SSL               Enable SSL (true/false)');
        break;
    }
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await runner.disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { MigrationRunner };