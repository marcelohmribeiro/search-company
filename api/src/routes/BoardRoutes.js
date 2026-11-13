import express, { Router } from "express";
import { BoardController } from "#src/controllers";
import { verifyJWT } from "#src/middlewares";

const BoardRouter = Router();
const board = BoardController();
const image = express.raw({ type: ["image/jpeg", "image/png", "image/webp"], limit: "5mb" });

BoardRouter.get("/", verifyJWT, board.show);
BoardRouter.post("/cards", verifyJWT, board.create);
BoardRouter.patch("/cards/:id", verifyJWT, board.update);
BoardRouter.delete("/cards/:id", verifyJWT, board.remove);
BoardRouter.put("/cards/:id/image", verifyJWT, image, board.uploadImage);
BoardRouter.delete("/cards/:id/image", verifyJWT, board.removeImage);

export { BoardRouter };
export default BoardRouter;
