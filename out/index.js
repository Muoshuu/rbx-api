"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const proxy_1 = require("./proxy");
const _1 = require("./reflection/.");
const app = express();
{
    proxy_1.serveProxy(app);
    _1.serveReflection(app);
}
app.listen(process.env.PORT || 5000);
//# sourceMappingURL=index.js.map