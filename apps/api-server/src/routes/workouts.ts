import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, workoutsTable } from "@fitness/db";
import { eq, and, desc } from "drizzle-orm";
import { LogWorkoutBody, ListWorkoutsQueryParams, GetWorkoutParams, DeleteWorkoutParams } from "@fitness/api-zod";

const router = Router();

const requireAuth = (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
};

router.get("/workouts", requireAuth, async (req: any, res) => {
  try {
    const query = ListWorkoutsQueryParams.parse(req.query);
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;
    const workouts = await db
      .select()
      .from(workoutsTable)
      .where(eq(workoutsTable.userId, req.userId))
      .orderBy(desc(workoutsTable.date))
      .limit(limit)
      .offset(offset);
    res.json(workouts);
  } catch (err) {
    req.log.error({ err }, "Failed to list workouts");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/workouts", requireAuth, async (req: any, res) => {
  try {
    const body = LogWorkoutBody.parse(req.body);
    const dateStr = body.date.toISOString().split("T")[0];
    const [workout] = await db
      .insert(workoutsTable)
      .values({ ...body, date: dateStr, userId: req.userId })
      .returning();
    res.status(201).json(workout);
  } catch (err) {
    req.log.error({ err }, "Failed to log workout");
    res.status(400).json({ error: "Invalid request" });
  }
});

router.get("/workouts/:id", requireAuth, async (req: any, res) => {
  try {
    const { id } = GetWorkoutParams.parse({ id: parseInt(req.params.id) });
    const [workout] = await db
      .select()
      .from(workoutsTable)
      .where(and(eq(workoutsTable.id, id), eq(workoutsTable.userId, req.userId)))
      .limit(1);
    if (!workout) return res.status(404).json({ error: "Workout not found" });
    res.json(workout);
  } catch (err) {
    req.log.error({ err }, "Failed to get workout");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/workouts/:id", requireAuth, async (req: any, res) => {
  try {
    const { id } = DeleteWorkoutParams.parse({ id: parseInt(req.params.id) });
    await db
      .delete(workoutsTable)
      .where(and(eq(workoutsTable.id, id), eq(workoutsTable.userId, req.userId)));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete workout");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
