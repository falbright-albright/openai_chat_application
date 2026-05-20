import { createInMemoryApp } from "./controllers/main";
import { createSQLApp } from "./controllers/main";
import { createORMApp } from "./controllers/main";
const app = createORMApp();
export default app;
