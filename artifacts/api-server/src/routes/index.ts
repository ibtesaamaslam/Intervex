import { Router, type IRouter } from "express";
import healthRouter from "./health";
import sessionsRouter from "./sessions";
import questionsRouter from "./questions";
import analyzeRouter from "./analyze";
import answersRouter from "./answers";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/sessions", sessionsRouter);
router.use("/questions", questionsRouter);
router.use("/analyze", analyzeRouter);
router.use("/answers", answersRouter);
router.use("/dashboard", dashboardRouter);

export default router;
