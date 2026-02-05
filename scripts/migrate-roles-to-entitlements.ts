import { createClerkClient } from "@clerk/backend";

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

async function migrateUsers() {
    console.log("Starting migration...");

    let offset = 0;
    const limit = 100;
    let hasMore = true;
    let totalMigrated = 0;
    let totalSkipped = 0;

    while (hasMore) {
        const users = await clerkClient.users.getUserList({ limit, offset });

        for (const user of users.data) {
            const metadata = user.publicMetadata || {};

            // Skip if already migrated
            if (metadata.base_tier) {
                console.log(`Skipping ${user.id} - already migrated`);
                totalSkipped++;
                continue;
            }

            // Migrate role → base_tier
            const role = (metadata.role as string) || "free";

            await clerkClient.users.updateUser(user.id, {
                publicMetadata: {
                    ...metadata,
                    base_tier: role,
                    entitlements: metadata.entitlements || [],
                    // Keep role for backward compatibility
                    role,
                }
            });

            console.log(`Migrated ${user.id}: role=${role} → base_tier=${role}`);
            totalMigrated++;
        }

        hasMore = users.data.length === limit;
        offset += limit;
    }

    console.log("\n=== Migration Complete ===");
    console.log(`Total migrated: ${totalMigrated}`);
    console.log(`Total skipped: ${totalSkipped}`);
}

migrateUsers().catch(console.error);
