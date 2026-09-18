import { getFirestore, isFirebaseReady } from "../config/firebase.js";
import { db, rowToJSON } from "../config/db.js";

/**
 * Firestore Service Layer.
 * Provides unified, asynchronous access to Firebase Cloud Firestore collections,
 * with bidirectional synchronization for local and cloud data.
 */

// ── 1. Events ──
export async function getEventsFromFirestore(scope = "all") {
  const fs = getFirestore();
  if (isFirebaseReady() && fs) {
    try {
      const snap = await fs.collection("events").orderBy("date", "asc").get();
      const events = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const now = new Date().toISOString();
      if (scope === "upcoming") {
        return events.filter(e => (e.endDate || e.date) >= now);
      }
      if (scope === "past") {
        return events.filter(e => (e.endDate || e.date) < now);
      }
      return events;
    } catch (err) {
      console.warn("[Firestore] Error reading events, falling back:", err.message);
    }
  }

  // Local fallback
  const now = new Date().toISOString();
  let rows;
  if (scope === "upcoming") {
    rows = db.prepare("SELECT * FROM events WHERE (end_date IS NOT NULL AND end_date >= ?) OR (end_date IS NULL AND date >= ?) ORDER BY date ASC").all(now, now);
  } else if (scope === "past") {
    rows = db.prepare("SELECT * FROM events WHERE (end_date IS NOT NULL AND end_date < ?) OR (end_date IS NULL AND date < ?) ORDER BY date DESC").all(now, now);
  } else {
    rows = db.prepare("SELECT * FROM events ORDER BY date ASC").all();
  }
  return rows.map(rowToJSON);
}

export async function saveEventToFirestore(eventData, existingId = null) {
  const fs = getFirestore();
  const id = existingId ? String(existingId) : String(Date.now());
  const payload = {
    ...eventData,
    updatedAt: new Date().toISOString(),
  };

  if (isFirebaseReady() && fs) {
    try {
      await fs.collection("events").doc(id).set(payload, { merge: true });
      console.log(`[Firestore] Saved event ${id} (${payload.title}) to Cloud Firestore 🔥`);
    } catch (err) {
      console.warn("[Firestore] Failed to save event to Firestore:", err.message);
    }
  }
  return { id, ...payload };
}

export async function deleteEventFromFirestore(eventId) {
  const fs = getFirestore();
  const id = String(eventId);
  if (isFirebaseReady() && fs) {
    try {
      await fs.collection("events").doc(id).delete();
      console.log(`[Firestore] Deleted event ${id} from Cloud Firestore 🔥`);
    } catch (err) {
      console.warn("[Firestore] Failed to delete event from Firestore:", err.message);
    }
  }
}

// ── 2. Event Registrations ──
export async function saveRegistrationToFirestore(registrationData) {
  const fs = getFirestore();
  const id = String(registrationData.id || Date.now());
  const payload = {
    ...registrationData,
    createdAt: new Date().toISOString(),
  };

  if (isFirebaseReady() && fs) {
    try {
      await fs.collection("event_registrations").doc(id).set(payload);
      console.log(`[Firestore] Recorded registration ${id} for team ${payload.teamName} in Cloud Firestore 🔥`);
    } catch (err) {
      console.warn("[Firestore] Failed to write registration to Firestore:", err.message);
    }
  }
  return { id, ...payload };
}

export async function getRegistrationsFromFirestore(eventId) {
  const fs = getFirestore();
  if (isFirebaseReady() && fs) {
    try {
      const snap = await fs.collection("event_registrations")
        .where("eventId", "==", Number(eventId))
        .get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.warn("[Firestore] Error reading registrations:", err.message);
    }
  }

  const rows = db.prepare("SELECT * FROM event_registrations WHERE event_id = ? ORDER BY id ASC").all(eventId);
  return rows.map(rowToJSON);
}

// ── 3. Team Coordinators ──
export async function getTeamFromFirestore() {
  const fs = getFirestore();
  if (isFirebaseReady() && fs) {
    try {
      const snap = await fs.collection("team").orderBy("order", "asc").get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.warn("[Firestore] Error reading team from Firestore:", err.message);
    }
  }
  const rows = db.prepare('SELECT * FROM team_members WHERE active = 1 ORDER BY "order" ASC, id ASC').all();
  return rows.map(rowToJSON);
}

export async function saveTeamMemberToFirestore(memberData, existingId = null) {
  const fs = getFirestore();
  const id = existingId ? String(existingId) : String(Date.now());
  if (isFirebaseReady() && fs) {
    try {
      await fs.collection("team").doc(id).set({
        ...memberData,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      console.log(`[Firestore] Saved coordinator ${id} (${memberData.name}) to Cloud Firestore 🔥`);
    } catch (err) {
      console.warn("[Firestore] Error writing team member:", err.message);
    }
  }
}

// ── 4. Club Details & Activities ──
export async function getClubDetailsFromFirestore() {
  const fs = getFirestore();
  if (isFirebaseReady() && fs) {
    try {
      const doc = await fs.collection("club_details").doc("general").get();
      if (doc.exists) return doc.data();
    } catch (err) {
      console.warn("[Firestore] Error reading club details:", err.message);
    }
  }
  const row = db.prepare("SELECT * FROM club_details WHERE id = 1").get();
  return rowToJSON(row);
}

export async function saveClubDetailsToFirestore(details) {
  const fs = getFirestore();
  if (isFirebaseReady() && fs) {
    try {
      await fs.collection("club_details").doc("general").set({
        ...details,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      console.log(`[Firestore] Updated club details in Cloud Firestore 🔥`);
    } catch (err) {
      console.warn("[Firestore] Error saving club details:", err.message);
    }
  }
}

// ── 5. Sync Existing Data to Cloud Firestore ──
export async function syncAllToFirestore() {
  const fs = getFirestore();
  if (!isFirebaseReady() || !fs) {
    console.log(`[Firestore Sync] Firebase credentials pending. Data persisted locally in readiness for cloud sync.`);
    return { synced: false, reason: "Firebase credentials pending" };
  }

  console.log(`[Firestore Sync] Synchronizing all collections with Firebase Cloud Firestore... 🔥`);
  try {
    // 1. Events
    const events = db.prepare("SELECT * FROM events").all();
    if (events.length > 0) {
      for (const e of events) {
        await fs.collection("events").doc(String(e.id)).set(rowToJSON(e), { merge: true });
      }
    } else {
      // Restore from Cloud Firestore if local DB is empty
      const cloudSnap = await fs.collection("events").get();
      if (!cloudSnap.empty) {
        console.log(`[Firestore Sync] Restoring ${cloudSnap.size} events from Cloud Firestore...`);
        const insertEvent = db.prepare(`
          INSERT OR REPLACE INTO events (id, title, slug, date, end_date, venue, description, summary, image, registration_link, tags, status, featured, capacity, created_at, updated_at)
          VALUES (@id, @title, @slug, @date, @end_date, @venue, @description, @summary, @image, @registration_link, @tags, @status, @featured, @capacity, @created_at, @updated_at)
        `);
        for (const doc of cloudSnap.docs) {
          const d = doc.data();
          insertEvent.run({
            id: Number(doc.id) || d.id,
            title: d.title || "",
            slug: d.slug || ("event-" + doc.id),
            date: d.date || new Date().toISOString(),
            end_date: d.endDate || d.end_date || null,
            venue: d.venue || "",
            description: d.description || "",
            summary: d.summary || "",
            image: d.image || "",
            registration_link: d.registrationLink || d.registration_link || "",
            tags: typeof d.tags === "object" ? JSON.stringify(d.tags) : (d.tags || "[]"),
            status: d.status || "published",
            featured: d.featured ? 1 : 0,
            capacity: Number(d.capacity) || 0,
            created_at: d.createdAt || d.created_at || new Date().toISOString(),
            updated_at: d.updatedAt || d.updated_at || new Date().toISOString(),
          });
        }
      }
    }

    // 2. Team Members
    const team = db.prepare("SELECT * FROM team_members").all();
    if (team.length > 0) {
      for (const m of team) {
        await fs.collection("team").doc(String(m.id)).set(rowToJSON(m), { merge: true });
      }
    } else {
      const cloudTeam = await fs.collection("team").get();
      if (!cloudTeam.empty) {
        console.log(`[Firestore Sync] Restoring ${cloudTeam.size} coordinators from Cloud Firestore...`);
        const insertMember = db.prepare(`
          INSERT OR REPLACE INTO team_members (id, name, role, department, photo, email, phone, linkedin, github, bio, "order", active)
          VALUES (@id, @name, @role, @department, @photo, @email, @phone, @linkedin, @github, @bio, @order, @active)
        `);
        for (const doc of cloudTeam.docs) {
          const d = doc.data();
          insertMember.run({
            id: Number(doc.id) || d.id,
            name: d.name || "",
            role: d.role || "Coordinator",
            department: d.department || "",
            photo: d.photo || "",
            email: d.email || "",
            phone: d.phone || "",
            linkedin: d.linkedin || "",
            github: d.github || "",
            bio: d.bio || "",
            order: Number(d.order) || 0,
            active: d.active ? 1 : 0,
          });
        }
      }
    }

    // 3. Registrations
    const regs = db.prepare("SELECT * FROM event_registrations").all();
    if (regs.length > 0) {
      for (const r of regs) {
        await fs.collection("event_registrations").doc(String(r.id)).set(rowToJSON(r), { merge: true });
      }
    }

    // 4. Club details
    const club = db.prepare("SELECT * FROM club_details WHERE id = 1").get();
    if (club) {
      await fs.collection("club_details").doc("general").set(rowToJSON(club), { merge: true });
    }

    // 5. Activities
    const activities = db.prepare("SELECT * FROM club_activities").all();
    for (const a of activities) {
      await fs.collection("club_activities").doc(String(a.id)).set(rowToJSON(a), { merge: true });
    }

    // 6. Subscribers
    const subscribers = db.prepare("SELECT * FROM subscribers").all();
    for (const s of subscribers) {
      await fs.collection("subscribers").doc(String(s.id)).set(rowToJSON(s), { merge: true });
    }

    const currentEvents = db.prepare("SELECT COUNT(*) as count FROM events").get().count;
    const currentTeam = db.prepare("SELECT COUNT(*) as count FROM team_members").get().count;
    console.log(`[Firestore Sync] Complete! Live state: ${currentEvents} events, ${currentTeam} coordinators in sync.`);
    return { synced: true, events: currentEvents, team: currentTeam };
  } catch (err) {
    console.error(`[Firestore Sync] Error during sync:`, err.message);
    return { synced: false, error: err.message };
  }
}

// ── 6. Additional Sync Handlers for Full Real-Time Coverage ──

export async function deleteRegistrationFromFirestore(regId) {
  const fs = getFirestore();
  if (isFirebaseReady() && fs) {
    try {
      await fs.collection("event_registrations").doc(String(regId)).delete();
      console.log(`[Firestore] Deleted registration ${regId} from Cloud Firestore 🔥`);
    } catch (err) {
      console.warn("[Firestore] Failed to delete registration:", err.message);
    }
  }
}

export async function updateAttendanceInFirestore(regId, attended, attendedAt = null) {
  const fs = getFirestore();
  if (isFirebaseReady() && fs) {
    try {
      await fs.collection("event_registrations").doc(String(regId)).set({
        attended: Boolean(attended),
        attendedAt: attendedAt || (attended ? new Date().toISOString() : null),
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      console.log(`[Firestore] Updated attendance for registration ${regId} (${attended ? 'Present' : 'Absent'}) in Cloud Firestore 🔥`);
    } catch (err) {
      console.warn("[Firestore] Failed to update attendance in Firestore:", err.message);
    }
  }
}

export async function deleteTeamMemberFromFirestore(id) {
  const fs = getFirestore();
  if (isFirebaseReady() && fs) {
    try {
      await fs.collection("team").doc(String(id)).delete();
      await fs.collection("team_members").doc(String(id)).delete();
      console.log(`[Firestore] Deleted team member ${id} from Cloud Firestore 🔥`);
    } catch (err) {
      console.warn("[Firestore] Failed to delete team member:", err.message);
    }
  }
}

export async function clearAllTeamFromFirestore() {
  const fs = getFirestore();
  if (isFirebaseReady() && fs) {
    try {
      const snap = await fs.collection("team_members").get();
      const batch = fs.batch();
      snap.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      console.log(`[Firestore] Cleared all team members from Cloud Firestore 🔥`);
    } catch (err) {
      console.warn("[Firestore] Failed to clear team members:", err.message);
    }
  }
}

export async function saveActivityToFirestore(activityData, existingId = null) {
  const fs = getFirestore();
  const id = existingId ? String(existingId) : String(Date.now());
  if (isFirebaseReady() && fs) {
    try {
      await fs.collection("club_activities").doc(id).set({
        ...activityData,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      console.log(`[Firestore] Saved activity ${id} (${activityData.title}) in Cloud Firestore 🔥`);
    } catch (err) {
      console.warn("[Firestore] Failed to save activity:", err.message);
    }
  }
}

export async function deleteActivityFromFirestore(id) {
  const fs = getFirestore();
  if (isFirebaseReady() && fs) {
    try {
      await fs.collection("club_activities").doc(String(id)).delete();
      console.log(`[Firestore] Deleted activity ${id} from Cloud Firestore 🔥`);
    } catch (err) {
      console.warn("[Firestore] Failed to delete activity:", err.message);
    }
  }
}

export async function saveSubscriberToFirestore(subscriberData) {
  const fs = getFirestore();
  const id = String(subscriberData.id || subscriberData.email);
  if (isFirebaseReady() && fs) {
    try {
      await fs.collection("subscribers").doc(id).set({
        ...subscriberData,
        subscribedAt: new Date().toISOString(),
      }, { merge: true });
      console.log(`[Firestore] Recorded new subscriber ${subscriberData.email} in Cloud Firestore 🔥`);
    } catch (err) {
      console.warn("[Firestore] Failed to save subscriber:", err.message);
    }
  }
}

export async function deleteSubscriberFromFirestore(id) {
  const fs = getFirestore();
  if (isFirebaseReady() && fs) {
    try {
      await fs.collection("subscribers").doc(String(id)).delete();
      console.log(`[Firestore] Deleted subscriber ${id} from Cloud Firestore 🔥`);
    } catch (err) {
      console.warn("[Firestore] Failed to delete subscriber:", err.message);
    }
  }
}

export async function recordUploadInFirestore(fileInfo) {
  const fs = getFirestore();
  if (isFirebaseReady() && fs) {
    try {
      await fs.collection("uploads").add({
        ...fileInfo,
        uploadedAt: new Date().toISOString(),
      });
      console.log(`[Firestore] Recorded uploaded file ${fileInfo.filename} in Cloud Firestore 🔥`);
    } catch (err) {
      console.warn("[Firestore] Failed to record upload in Firestore:", err.message);
    }
  }
}
