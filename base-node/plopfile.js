const required = (value) =>
  value?.trim() ? true : "Este campo é obrigatório";

export default function (plop) {
  plop.setGenerator("resource", {
    description: "Cria Controller e Routes usando Prisma",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "Nome do recurso",
        validate: required,
      },
      {
        type: "input",
        name: "model",
        message: "Nome do model no Prisma Client",
        default: ({ name }) => plop.getHelper("camelCase")(name),
        validate: required,
      },
      {
        type: "confirm",
        name: "useAuth",
        message: "Proteger as rotas com verifyJWT?",
        default: true,
      },
    ],
    actions: [
      {
        type: "add",
        path: "src/controllers/{{pascalCase name}}Controller.js",
        templateFile: "plop/component/_controller.hbs",
      },
      {
        type: "add",
        path: "src/routes/{{pascalCase name}}Routes.js",
        templateFile: "plop/component/_routes.hbs",
      },
      {
        type: "append",
        path: "src/controllers/index.js",
        template:
          'export * from "#src/controllers/{{pascalCase name}}Controller.js";',
        unique: true,
      },
      {
        type: "append",
        path: "src/routes/index.js",
        template: 'export * from "./{{pascalCase name}}Routes.js";',
        unique: true,
      },
    ],
  });
}
