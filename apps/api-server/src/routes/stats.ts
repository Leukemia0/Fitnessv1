import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, workoutsTable, nutritionTable, weightEntriesTable, profilesTable } from "@fitness/db";
import { eq, and, gte, desc } from "drizzle-orm";
import { LogWeightBody } from "@fitness/api-zod";

const router = Router();

const requireAuth = (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
};

function getStartOfWeek(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(d.setDate(diff));
  return mon.toISOString().split("T")[0];
}

function getTodayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function getLast30Days(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split("T")[0];
}

function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

router.get("/stats/dashboard", requireAuth, async (req: any, res) => {
  try {
    const userId = req.userId;
    const weekStart = getStartOfWeek();
    const today = getTodayStr();

    const weekWorkouts = await db
      .select()
      .from(workoutsTable)
      .where(and(eq(workoutsTable.userId, userId), gte(workoutsTable.date, weekStart)));

    const todayWorkouts = weekWorkouts.filter((w) => w.date === today);

    const todayNutrition = await db
      .select()
      .from(nutritionTable)
      .where(and(eq(nutritionTable.userId, userId), eq(nutritionTable.date, today)));

    const [latestWeight] = await db
      .select()
      .from(weightEntriesTable)
      .where(eq(weightEntriesTable.userId, userId))
      .orderBy(desc(weightEntriesTable.date))
      .limit(1);

    const [profile] = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.clerkUserId, userId))
      .limit(1);

    const totalWorkoutsThisWeek = weekWorkouts.length;
    const totalCaloriesBurnedThisWeek = weekWorkouts.reduce((s, w) => s + w.caloriesBurned, 0);
    const totalWorkoutsToday = todayWorkouts.length;
    const totalCaloriesBurnedToday = todayWorkouts.reduce((s, w) => s + w.caloriesBurned, 0);
    const totalCaloriesConsumedToday = todayNutrition.reduce((s, n) => s + n.calories, 0);
    const totalProteinToday = todayNutrition.reduce((s, n) => s + (n.protein ?? 0), 0);
    const totalCarbsToday = todayNutrition.reduce((s, n) => s + (n.carbs ?? 0), 0);
    const totalFatToday = todayNutrition.reduce((s, n) => s + (n.fat ?? 0), 0);
    const currentWeightKg = latestWeight?.weightKg ?? profile?.weightKg ?? 0;

    const allWorkoutDates = (await db
      .select({ date: workoutsTable.date })
      .from(workoutsTable)
      .where(eq(workoutsTable.userId, userId))
      .orderBy(desc(workoutsTable.date))).map(w => w.date);

    const uniqueDates = [...new Set(allWorkoutDates)];
    let streak = 0;
    const todayDate = new Date();
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(todayDate);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split("T")[0];
      if (uniqueDates.includes(dateStr)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    const goalProgress = Math.min(100, Math.round((totalWorkoutsThisWeek / 5) * 100));

    res.json({
      totalWorkoutsThisWeek,
      totalCaloriesBurnedThisWeek,
      totalCaloriesConsumedToday,
      currentWeightKg,
      workoutStreak: streak,
      goalProgress,
      totalWorkoutsToday,
      totalCaloriesBurnedToday,
      totalProteinToday,
      totalCarbsToday,
      totalFatToday,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get dashboard stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/stats/weekly", requireAuth, async (req: any, res) => {
  try {
    const userId = req.userId;
    const last7 = getLast7Days();
    const earliest = last7[0];

    const workouts = await db
      .select()
      .from(workoutsTable)
      .where(and(eq(workoutsTable.userId, userId), gte(workoutsTable.date, earliest)));

    const nutrition = await db
      .select()
      .from(nutritionTable)
      .where(and(eq(nutritionTable.userId, userId), gte(nutritionTable.date, earliest)));

    const stats = last7.map((date) => {
      const dayWorkouts = workouts.filter((w) => w.date === date);
      const dayNutrition = nutrition.filter((n) => n.date === date);
      return {
        date,
        caloriesBurned: dayWorkouts.reduce((s, w) => s + w.caloriesBurned, 0),
        caloriesConsumed: dayNutrition.reduce((s, n) => s + n.calories, 0),
        workoutMinutes: dayWorkouts.reduce((s, w) => s + w.durationMinutes, 0),
      };
    });

    res.json(stats);
  } catch (err) {
    req.log.error({ err }, "Failed to get weekly stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/stats/weight-history", requireAuth, async (req: any, res) => {
  try {
    const userId = req.userId;
    const since = getLast30Days();
    const entries = await db
      .select()
      .from(weightEntriesTable)
      .where(and(eq(weightEntriesTable.userId, userId), gte(weightEntriesTable.date, since)))
      .orderBy(weightEntriesTable.date);
    res.json(entries);
  } catch (err) {
    req.log.error({ err }, "Failed to get weight history");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/stats/weight-history", requireAuth, async (req: any, res) => {
  try {
    const body = LogWeightBody.parse(req.body);
    const dateStr = body.date.toISOString().split("T")[0];
    const [entry] = await db
      .insert(weightEntriesTable)
      .values({ ...body, date: dateStr, userId: req.userId })
      .returning();
    res.status(201).json(entry);
  } catch (err) {
    req.log.error({ err }, "Failed to log weight");
    res.status(400).json({ error: "Invalid request" });
  }
});

export default router;
