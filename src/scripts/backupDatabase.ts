import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

interface BackupConfig {
  backupDir: string;
  retentionDays: number;
  includeAnalytics: boolean;
}

class DatabaseBackup {
  private config: BackupConfig;

  constructor(config: BackupConfig) {
    this.config = config;
  }

  async createBackup(): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `zex-content-backup-${timestamp}.sql`;
      const backupPath = path.join(this.config.backupDir, backupFileName);

      // Ensure backup directory exists
      if (!fs.existsSync(this.config.backupDir)) {
        fs.mkdirSync(this.config.backupDir, { recursive: true });
      }

      // Get database URL from environment
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error('DATABASE_URL environment variable is not set');
      }

      // Parse database URL
      const url = new URL(databaseUrl);
      const dbName = url.pathname.slice(1); // Remove leading slash
      const dbUser = url.username;
      const dbHost = url.hostname;
      const dbPort = url.port || '5432';

      console.log(`🔄 Creating backup: ${backupFileName}`);

      // Create backup using pg_dump
      const dumpCommand = `PGPASSWORD="${url.password}" pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -F c -f "${backupPath}"`;
      
      await execAsync(dumpCommand);

      // Compress the backup
      const compressedPath = `${backupPath}.gz`;
      await execAsync(`gzip "${backupPath}"`);

      console.log(`✅ Backup created successfully: ${compressedPath}`);

      // Clean old backups
      await this.cleanOldBackups();

      return compressedPath;
    } catch (error) {
      console.error('❌ Backup creation failed:', error);
      throw error;
    }
  }

  async cleanOldBackups(): Promise<void> {
    try {
      if (!fs.existsSync(this.config.backupDir)) {
        return;
      }

      const files = fs.readdirSync(this.config.backupDir);
      const now = Date.now();
      const retentionMs = this.config.retentionDays * 24 * 60 * 60 * 1000;

      for (const file of files) {
        if (file.endsWith('.sql.gz') || file.endsWith('.sql')) {
          const filePath = path.join(this.config.backupDir, file);
          const stats = fs.statSync(filePath);
          const fileAge = now - stats.mtime.getTime();

          if (fileAge > retentionMs) {
            fs.unlinkSync(filePath);
            console.log(`🗑️  Deleted old backup: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error cleaning old backups:', error);
    }
  }

  async listBackups(): Promise<Array<{ name: string; size: string; date: Date }>> {
    try {
      if (!fs.existsSync(this.config.backupDir)) {
        return [];
      }

      const files = fs.readdirSync(this.config.backupDir);
      const backups: Array<{ name: string; size: string; date: Date }> = [];

      for (const file of files) {
        if (file.endsWith('.sql.gz') || file.endsWith('.sql')) {
          const filePath = path.join(this.config.backupDir, file);
          const stats = fs.statSync(filePath);
          
          backups.push({
            name: file,
            size: this.formatBytes(stats.size),
            date: stats.mtime,
          });
        }
      }

      return backups.sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
      console.error('❌ Error listing backups:', error);
      return [];
    }
  }

  async restoreBackup(backupFileName: string): Promise<void> {
    try {
      const backupPath = path.join(this.config.backupDir, backupFileName);
      
      if (!fs.existsSync(backupPath)) {
        throw new Error(`Backup file not found: ${backupFileName}`);
      }

      console.log(`🔄 Restoring backup: ${backupFileName}`);

      // Get database URL from environment
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error('DATABASE_URL environment variable is not set');
      }

      // Parse database URL
      const url = new URL(databaseUrl);
      const dbName = url.pathname.slice(1);
      const dbUser = url.username;
      const dbHost = url.hostname;
      const dbPort = url.port || '5432';

      // Drop and recreate database
      await execAsync(`PGPASSWORD="${url.password}" dropdb -h ${dbHost} -p ${dbPort} -U ${dbUser} ${dbName}`);
      await execAsync(`PGPASSWORD="${url.password}" createdb -h ${dbHost} -p ${dbPort} -U ${dbUser} ${dbName}`);

      // Restore backup
      if (backupFileName.endsWith('.gz')) {
        await execAsync(`gunzip -c "${backupPath}" | PGPASSWORD="${url.password}" pg_restore -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName}`);
      } else {
        await execAsync(`PGPASSWORD="${url.password}" pg_restore -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} "${backupPath}"`);
      }

      console.log('✅ Backup restored successfully');
    } catch (error) {
      console.error('❌ Backup restoration failed:', error);
      throw error;
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Main backup function
async function main() {
  const backupConfig: BackupConfig = {
    backupDir: process.env.BACKUP_DIR || './backups',
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
    includeAnalytics: process.env.INCLUDE_ANALYTICS === 'true',
  };

  const backup = new DatabaseBackup(backupConfig);

  try {
    const action = process.argv[2];

    switch (action) {
      case 'create':
        await backup.createBackup();
        break;
      
      case 'list':
        const backups = await backup.listBackups();
        console.log('📋 Available backups:');
        backups.forEach((backup, index) => {
          console.log(`${index + 1}. ${backup.name} (${backup.size}) - ${backup.date.toLocaleString()}`);
        });
        break;
      
      case 'restore':
        const backupName = process.argv[3];
        if (!backupName) {
          console.error('❌ Please provide backup name to restore');
          process.exit(1);
        }
        await backup.restoreBackup(backupName);
        break;
      
      default:
        console.log('Usage:');
        console.log('  npm run backup:create');
        console.log('  npm run backup:list');
        console.log('  npm run backup:restore <backup-name>');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Backup operation failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export default DatabaseBackup;