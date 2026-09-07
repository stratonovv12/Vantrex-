import { Router, type IRouter } from "express";
import healthRouter from "./health";
import vantrexRouter from "./vantrex";

const router: IRouter = Router();

router.use(healthRouter);
router.use(vantrexRouter);

export default router;
