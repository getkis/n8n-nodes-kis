"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.credentials = exports.nodes = void 0;
const KisApi_credentials_1 = require("./credentials/KisApi.credentials");
const KisGetDataTrigger_node_1 = require("./nodes/KisGetDataTrigger.node");
const KisGetAllCollections_node_1 = require("./nodes/KisGetAllCollections.node");
const KisSearchData_node_1 = require("./nodes/KisSearchData.node");
const KisCreateData_node_1 = require("./nodes/KisCreateData.node");
const KisUpdateData_node_1 = require("./nodes/KisUpdateData.node");
const KisDeleteData_node_1 = require("./nodes/KisDeleteData.node");
exports.nodes = [
    KisGetDataTrigger_node_1.KisGetDataTrigger,
    KisGetAllCollections_node_1.KisGetAllCollections,
    KisSearchData_node_1.KisSearchData,
    KisCreateData_node_1.KisCreateData,
    KisUpdateData_node_1.KisUpdateData,
    KisDeleteData_node_1.KisDeleteData,
];
exports.credentials = [KisApi_credentials_1.KisApi];
