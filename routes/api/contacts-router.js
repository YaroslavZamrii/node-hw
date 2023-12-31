import express from "express";
import Joi from "joi";
import { validateBody } from "../../decorators/index.js";
import { isValidId, authenticate } from "../../middlewares/index.js";
import * as contactSchemas from "../../models/Contact.js";
import contactsController from "../../controllers/contacts-controller.js";

const contactAddValidate = validateBody(contactSchemas.contactAddSchema);
const contactUpdateFavoriteValidate = validateBody(
  contactSchemas.contactUpdateFavoriteSchema
);

const contactsRouter = express.Router();

contactsRouter.use(authenticate);

contactsRouter.get("/", contactsController.getAll);

contactsRouter.get("/:contactId", isValidId, contactsController.getById);

contactsRouter.post("/", contactAddValidate, contactsController.add);

contactsRouter.put(
  "/:contactId",
  contactAddValidate,
  contactsController.updateById
);

contactsRouter.patch(
  "/:contactId/favorite",
  isValidId,
  contactUpdateFavoriteValidate,
  contactsController.updateStatusContact
);

contactsRouter.delete("/:contactId", isValidId, contactsController.deleteById);

export default contactsRouter;
