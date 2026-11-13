import express from "express";
import { handleError } from "#src/utils"
import { settings } from "#src/config";
import { UsageRouter, SearchRouter, LeadRouter, AuthRouter, MeRouter, AdminRouter, BoardRouter } from "#src/routes";
import cors from "cors";
import { LOCAL_UPLOADS_DIR } from "#src/services";

const app = express();
const port = settings.PORT;
app.use(cors({
  origin: settings.FRONTEND_URL,
}));
app.use(express.json());
app.get("/", (req, res) => {
  res.json("Servidor rodando");
});
app.use("/auth", AuthRouter);
app.use("/me", MeRouter);
app.use("/usage", UsageRouter);
app.use("/searches", SearchRouter);
app.use("/leads", LeadRouter);
app.use("/admin", AdminRouter);
app.use("/board", BoardRouter);
app.use("/uploads", express.static(LOCAL_UPLOADS_DIR));
app.use(handleError);

app.listen(port, settings.HOST, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
