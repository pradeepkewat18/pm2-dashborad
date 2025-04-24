#!/usr/bin/env node

const config = require("./config");
const { setEnvDataSync } = require("./utils/env.util");
const { generateRandomString } = require("./utils/random.util");
const path = require("path");
const serve = require("koa-static");
const render = require("koa-ejs");
const koaBody = require("koa-body");
const session = require("koa-session");
const Koa = require("koa");
var https = require("https");
var fs = require("fs");
// Init Application

if (!config.APP_USERNAME || !config.APP_PASSWORD) {
  console.log(
    "You must first setup admin user. Run command -> npm run setup-admin-user"
  );
  process.exit(2);
}

if (!config.APP_SESSION_SECRET) {
  const randomString = generateRandomString();
  setEnvDataSync(config.APP_DIR, { APP_SESSION_SECRET: randomString });
  config.APP_SESSION_SECRET = randomString;
}

// Create App Instance
const app = new Koa();

// App Settings
app.proxy = true;
app.keys = [config.APP_SESSION_SECRET];

// Middlewares
app.use(session(app));

app.use(koaBody());

app.use(serve(path.join(__dirname, "public")));

const router = require("./routes");
app.use(router.routes());

render(app, {
  root: path.join(__dirname, "views"),
  layout: "base",
  viewExt: "html",
  cache: false,
  debug: false,
});
const httpsOption = {
  key: fs
    .readFileSync(
      path.resolve(
        process.cwd(),
        "/etc/letsencrypt/live/nimbus.siya.tech/privkey.pem"
      ),
      "utf8"
    )
    .toString(),
  cert: fs
    .readFileSync(
      path.resolve(
        process.cwd(),
        "/etc/letsencrypt/live/nimbus.siya.tech/fullchain.pem"
      ),
      "utf8"
    )
    .toString(),
};
https.createServer(httpsOption, app.callback()).listen(config.PORT);
