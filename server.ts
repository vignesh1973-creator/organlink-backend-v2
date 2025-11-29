import { createServer } from "./index";

const app = createServer();
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`API available at http://localhost:${port}/api`);
});
