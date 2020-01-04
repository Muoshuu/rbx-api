"use strict";
// To parse this data:
//
//   import { Convert, API } from "./file";
//
//   const aPI = Convert.toAPI(json);
Object.defineProperty(exports, "__esModule", { value: true });
class Convert {
    static toAPI(json) {
        return JSON.parse(json);
    }
    static toJSON(value) {
        return JSON.stringify(value);
    }
}
exports.Convert = Convert;
//# sourceMappingURL=defaults.js.map