import { authJwt } from "../middlewares/index.js";
import * as userController from "../controllers/user.controller.js";

export default function(app) {
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  app.get("/api/test/all", userController.allAccess);
  app.get("/api/test/user", [authJwt.verifyToken], userController.userBoard);
  app.get("/api/test/mod", [authJwt.verifyToken, authJwt.isModerator], userController.moderatorBoard);
  app.get("/api/test/admin", [authJwt.verifyToken, authJwt.isAdmin], userController.adminBoard);
}
