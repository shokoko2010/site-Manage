import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

class DatabaseMigration {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async checkPostgreSQLConnection(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      console.log('✅ PostgreSQL connection successful');
      return true;
    } catch (error) {
      console.error('❌ PostgreSQL connection failed:', error);
      return false;
    }
  }

  async backupSQLiteData(): Promise<any> {
    console.log('📦 Backing up SQLite data...');
    
    const backup = {
      users: await this.prisma.user.findMany(),
      sessions: await this.prisma.session.findMany(),
      wordpressSites: await this.prisma.wordPressSite.findMany(),
      generatedContent: await this.prisma.generatedContent.findMany(),
      tags: await this.prisma.tag.findMany(),
      categories: await this.prisma.category.findMany(),
      contentTags: await this.prisma.contentTag.findMany(),
      contentCategories: await this.prisma.contentCategory.findMany(),
      userAnalytics: await this.prisma.userAnalytics.findMany(),
      siteAnalytics: await this.prisma.siteAnalytics.findMany(),
      contentAnalytics: await this.prisma.contentAnalytics.findMany(),
      activities: await this.prisma.activity.findMany(),
      subscriptions: await this.prisma.subscription.findMany(),
    };

    // Save backup to file
    const backupPath = join(process.cwd(), 'sqlite-backup.json');
    writeFileSync(backupPath, JSON.stringify(backup, null, 2));
    console.log(`✅ SQLite data backed up to: ${backupPath}`);
    
    return backup;
  }

  async migrateDataToPostgres(backup: any): Promise<void> {
    console.log('🔄 Migrating data to PostgreSQL...');

    try {
      // Migrate Users
      if (backup.users && backup.users.length > 0) {
        console.log(`  📝 Migrating ${backup.users.length} users...`);
        for (const user of backup.users) {
          await this.prisma.user.upsert({
            where: { id: user.id },
            update: {
              ...user,
              createdAt: new Date(user.createdAt),
              updatedAt: new Date(user.updatedAt),
            },
            create: {
              ...user,
              createdAt: new Date(user.createdAt),
              updatedAt: new Date(user.updatedAt),
            },
          });
        }
      }

      // Migrate Sessions
      if (backup.sessions && backup.sessions.length > 0) {
        console.log(`  🔐 Migrating ${backup.sessions.length} sessions...`);
        for (const session of backup.sessions) {
          await this.prisma.session.upsert({
            where: { id: session.id },
            update: {
              ...session,
              expiresAt: new Date(session.expiresAt),
              createdAt: new Date(session.createdAt),
            },
            create: {
              ...session,
              expiresAt: new Date(session.expiresAt),
              createdAt: new Date(session.createdAt),
            },
          });
        }
      }

      // Migrate Tags
      if (backup.tags && backup.tags.length > 0) {
        console.log(`  🏷️  Migrating ${backup.tags.length} tags...`);
        for (const tag of backup.tags) {
          await this.prisma.tag.upsert({
            where: { id: tag.id },
            update: tag,
            create: tag,
          });
        }
      }

      // Migrate Categories
      if (backup.categories && backup.categories.length > 0) {
        console.log(`  📁 Migrating ${backup.categories.length} categories...`);
        for (const category of backup.categories) {
          await this.prisma.category.upsert({
            where: { id: category.id },
            update: category,
            create: category,
          });
        }
      }

      // Migrate WordPress Sites
      if (backup.wordpressSites && backup.wordpressSites.length > 0) {
        console.log(`  🌐 Migrating ${backup.wordpressSites.length} WordPress sites...`);
        for (const site of backup.wordpressSites) {
          const siteData = {
            ...site,
            lastSyncedAt: site.lastSyncedAt ? new Date(site.lastSyncedAt) : null,
            createdAt: new Date(site.createdAt),
            updatedAt: new Date(site.updatedAt),
          };
          
          await this.prisma.wordPressSite.upsert({
            where: { id: site.id },
            update: siteData,
            create: siteData,
          });
        }
      }

      // Migrate Generated Content
      if (backup.generatedContent && backup.generatedContent.length > 0) {
        console.log(`  📄 Migrating ${backup.generatedContent.length} content items...`);
        for (const content of backup.generatedContent) {
          const contentData = {
            ...content,
            scheduledFor: content.scheduledFor ? new Date(content.scheduledFor) : null,
            createdAt: new Date(content.createdAt),
            updatedAt: new Date(content.updatedAt),
            publishedAt: content.publishedAt ? new Date(content.publishedAt) : null,
          };
          
          await this.prisma.generatedContent.upsert({
            where: { id: content.id },
            update: contentData,
            create: contentData,
          });
        }
      }

      // Migrate Content Tags relationships
      if (backup.contentTags && backup.contentTags.length > 0) {
        console.log(`  🔗 Migrating ${backup.contentTags.length} content-tag relationships...`);
        for (const contentTag of backup.contentTags) {
          await this.prisma.contentTag.upsert({
            where: { 
              contentId_tagId: {
                contentId: contentTag.contentId,
                tagId: contentTag.tagId,
              }
            },
            update: contentTag,
            create: contentTag,
          });
        }
      }

      // Migrate Content Categories relationships
      if (backup.contentCategories && backup.contentCategories.length > 0) {
        console.log(`  🔗 Migrating ${backup.contentCategories.length} content-category relationships...`);
        for (const contentCategory of backup.contentCategories) {
          await this.prisma.contentCategory.upsert({
            where: { 
              contentId_categoryId: {
                contentId: contentCategory.contentId,
                categoryId: contentCategory.categoryId,
              }
            },
            update: contentCategory,
            create: contentCategory,
          });
        }
      }

      // Migrate Analytics data
      if (backup.userAnalytics && backup.userAnalytics.length > 0) {
        console.log(`  📊 Migrating ${backup.userAnalytics.length} user analytics records...`);
        for (const analytics of backup.userAnalytics) {
          await this.prisma.userAnalytics.upsert({
            where: { 
              userId_date: {
                userId: analytics.userId,
                date: new Date(analytics.date),
              }
            },
            update: {
              ...analytics,
              date: new Date(analytics.date),
            },
            create: {
              ...analytics,
              date: new Date(analytics.date),
            },
          });
        }
      }

      if (backup.siteAnalytics && backup.siteAnalytics.length > 0) {
        console.log(`  📊 Migrating ${backup.siteAnalytics.length} site analytics records...`);
        for (const analytics of backup.siteAnalytics) {
          await this.prisma.siteAnalytics.upsert({
            where: { 
              siteId_date: {
                siteId: analytics.siteId,
                date: new Date(analytics.date),
              }
            },
            update: {
              ...analytics,
              date: new Date(analytics.date),
            },
            create: {
              ...analytics,
              date: new Date(analytics.date),
            },
          });
        }
      }

      if (backup.contentAnalytics && backup.contentAnalytics.length > 0) {
        console.log(`  📊 Migrating ${backup.contentAnalytics.length} content analytics records...`);
        for (const analytics of backup.contentAnalytics) {
          await this.prisma.contentAnalytics.upsert({
            where: { 
              contentId_date: {
                contentId: analytics.contentId,
                date: new Date(analytics.date),
              }
            },
            update: {
              ...analytics,
              date: new Date(analytics.date),
            },
            create: {
              ...analytics,
              date: new Date(analytics.date),
            },
          });
        }
      }

      // Migrate Activities
      if (backup.activities && backup.activities.length > 0) {
        console.log(`  📝 Migrating ${backup.activities.length} activities...`);
        for (const activity of backup.activities) {
          await this.prisma.activity.create({
            data: {
              ...activity,
              createdAt: new Date(activity.createdAt),
            },
          });
        }
      }

      // Migrate Subscriptions
      if (backup.subscriptions && backup.subscriptions.length > 0) {
        console.log(`  💳 Migrating ${backup.subscriptions.length} subscriptions...`);
        for (const subscription of backup.subscriptions) {
          await this.prisma.subscription.upsert({
            where: { id: subscription.id },
            update: {
              ...subscription,
              currentPeriodStart: new Date(subscription.currentPeriodStart),
              currentPeriodEnd: new Date(subscription.currentPeriodEnd),
              createdAt: new Date(subscription.createdAt),
              updatedAt: new Date(subscription.updatedAt),
            },
            create: {
              ...subscription,
              currentPeriodStart: new Date(subscription.currentPeriodStart),
              currentPeriodEnd: new Date(subscription.currentPeriodEnd),
              createdAt: new Date(subscription.createdAt),
              updatedAt: new Date(subscription.updatedAt),
            },
          });
        }
      }

      console.log('✅ Data migration completed successfully!');
    } catch (error) {
      console.error('❌ Error during data migration:', error);
      throw error;
    }
  }

  async generatePrismaClient(): Promise<void> {
    console.log('🔧 Generating Prisma client...');
    try {
      execSync('npx prisma generate', { stdio: 'inherit' });
      console.log('✅ Prisma client generated successfully');
    } catch (error) {
      console.error('❌ Failed to generate Prisma client:', error);
      throw error;
    }
  }

  async runMigrations(): Promise<void> {
    console.log('🔄 Running database migrations...');
    try {
      execSync('npx prisma migrate dev', { stdio: 'inherit' });
      console.log('✅ Database migrations completed');
    } catch (error) {
      console.error('❌ Failed to run migrations:', error);
      throw error;
    }
  }

  async verifyMigration(): Promise<void> {
    console.log('🔍 Verifying migration...');
    
    try {
      const userCount = await this.prisma.user.count();
      const contentCount = await this.prisma.generatedContent.count();
      const siteCount = await this.prisma.wordPressSite.count();

      console.log(`📊 Migration verification:`);
      console.log(`  👥 Users: ${userCount}`);
      console.log(`  📄 Content: ${contentCount}`);
      console.log(`  🌐 Sites: ${siteCount}`);

      if (userCount > 0 || contentCount > 0 || siteCount > 0) {
        console.log('✅ Migration verification successful');
      } else {
        console.log('⚠️  No data found in PostgreSQL (this might be expected for fresh installations)');
      }
    } catch (error) {
      console.error('❌ Migration verification failed:', error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    await this.prisma.$disconnect();
  }

  async run(): Promise<void> {
    try {
      console.log('🚀 Starting PostgreSQL migration...');
      
      // Check PostgreSQL connection
      const isConnected = await this.checkPostgreSQLConnection();
      if (!isConnected) {
        throw new Error('Cannot connect to PostgreSQL. Please check your DATABASE_URL.');
      }

      // Backup SQLite data
      const backup = await this.backupSQLiteData();

      // Generate Prisma client
      await this.generatePrismaClient();

      // Run migrations
      await this.runMigrations();

      // Migrate data
      await this.migrateDataToPostgres(backup);

      // Verify migration
      await this.verifyMigration();

      console.log('🎉 PostgreSQL migration completed successfully!');
      console.log('📝 Next steps:');
      console.log('  1. Update your .env file with the PostgreSQL DATABASE_URL');
      console.log('  2. Remove the old SQLite database file (dev.db)');
      console.log('  3. Test your application with the new PostgreSQL database');
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  const migration = new DatabaseMigration();
  migration.run().catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}

export default DatabaseMigration;