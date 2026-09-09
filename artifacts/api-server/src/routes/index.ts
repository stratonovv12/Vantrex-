import { Router, type IRouter } from "express";
import healthRouter from "./health";
import vantrexRouter from "./vantrex";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(vantrexRouter);
router.use(storageRouter);

export default router;
