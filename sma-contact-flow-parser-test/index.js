"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sma_contact_flow_parser_1 = require("../sma-contact-flow-parser");
const amazonConnectInstanceID = "arn:aws:connect:us-east-1:352842279943:instance/f059f582-0cb4-4069-b4ac-2d649c883b3b";
const amazonConnectFlowID = "arn:aws:connect:us-east-1:352842279943:instance/f059f582-0cb4-4069-b4ac-2d649c883b3b/contact-flow/22f3d288-aef6-4bc5-b64e-2deef2be0897";
(async () => {
    try {
        console.log("Got Here");
        const flowObject = await (0, sma_contact_flow_parser_1.loadContactFlow)(amazonConnectInstanceID, amazonConnectFlowID);
        console.dir(flowObject, { depth: null });
    }
    catch (e) {
        console.log(e);
    }
})();
