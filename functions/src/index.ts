// functions/src/index.ts
import {onDocumentCreated} from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

admin.initializeApp();

/**
 * A Cloud Function that triggers when a new user document is created in Firestore.
 * This function automatically creates a new team for the user,
 * making them the owner and admin.
 */
export const createTeamForNewUser = onDocumentCreated("users/{userId}", (event) => {
  // Get the snapshot of the new document
  const snap = event.data;
  if (!snap) {
    logger.error("No data associated with the event.");
    return;
  }

  const newUser = snap.data();
  const userId = event.params.userId;

  // Use displayName if available, otherwise provide a generic name.
  const teamName = newUser.displayName ? `${newUser.displayName}'s Team` : "My Team";

  const teamData = {
    name: teamName,
    owner: userId,
    members: [userId],
    roles: {
      [userId]: "Admin",
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  logger.info(`Creating team for new user: ${userId}`);

  // Add the new team to the "teams" collection
  return admin.firestore().collection("teams").add(teamData)
      .then(() => {
        logger.info(`Successfully created team for user: ${userId}`);
      })
      .catch((error) => {
        logger.error(`Error creating team for user ${userId}:`, error);
      });
});
