import express from "express";
import { handleError } from "#src/utils"
import { settings } from "#src/config";
import cors from "cors";

const app = express();
const port = settings.PORT;
app.use(cors({
  origin: settings.FRONTEND_URL,
}));
app.use(express.json());
app.get("/", (req, res) => {
  res.json("Servidor rodando");
});
app.use(handleError);

app.listen(port, () => {
  console.log(`Servidor rodando na porta http://localhost:${port}`);
});
