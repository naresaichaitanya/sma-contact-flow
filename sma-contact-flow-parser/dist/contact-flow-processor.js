"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processFlow = void 0;
const contact_flow_loader_1 = require("./contact-flow-loader");
function processFlow(smaEvent, amazonConnectInstanceID, amazonConnectFlowID) {
    return __awaiter(this, void 0, void 0, function* () {
        const contactFlow = yield (0, contact_flow_loader_1.loadContactFlow)(amazonConnectInstanceID, amazonConnectFlowID);
        console.log("Loaded Contact Flow");
        const transactionAttributes = smaEvent.TransactionAttributes;
        if (transactionAttributes == null || transactionAttributes.currentFlowBlock == null) {
            // We're at the root start from there
            return yield processRootFlowBlock(smaEvent, contactFlow, transactionAttributes);
        }
    });
}
exports.processFlow = processFlow;
function processRootFlowBlock(smaEvent, contactFlow, transactionAttributes) {
    return __awaiter(this, void 0, void 0, function* () {
        // OK, time to figure out the root of the flow
        if (contactFlow.StartAction !== null) {
            const actions = contactFlow.Actions;
            if (actions !== null && actions.length > 0) {
                const currentAction = findActionByID(actions, contactFlow.StartAction);
                if (currentAction !== null) {
                    return yield processFlowAction(smaEvent, currentAction);
                }
            }
        }
    });
}
function processFlowAction(smaEvent, action) {
    return __awaiter(this, void 0, void 0, function* () {
        switch (action.Type) {
            case 'GetParticipantInput':
                return yield processFlowActionGetParticipantInput(smaEvent, action);
            default:
                return null;
        }
    });
}
function processFlowActionGetParticipantInput(smaEvent, action) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    return __awaiter(this, void 0, void 0, function* () {
        const legA = getLegACallDetails(smaEvent);
        let smaAction = {
            Type: "SpeakAndGetDigits",
            Parameters: {
                "CallId": legA.CallId,
                "SpeechParameters": getSpeechParameters(action),
                "FailureSpeechParameters": getSpeechParameters(action),
                "MinNumberOfDigits": 1
            }
        };
        console.log(action.Parameters);
        console.log(action.Parameters.InputValidation);
        console.log(action.Parameters.InputValidation.CustomValidation);
        if ((_a = action.Parameters) === null || _a === void 0 ? void 0 : _a.InputValidation) {
            if ((_c = (_b = action.Parameters) === null || _b === void 0 ? void 0 : _b.InputValidation) === null || _c === void 0 ? void 0 : _c.CustomValidation) {
                if ((_f = (_e = (_d = action.Parameters) === null || _d === void 0 ? void 0 : _d.InputValidation) === null || _e === void 0 ? void 0 : _e.CustomValidation) === null || _f === void 0 ? void 0 : _f.MaximumLength) {
                    smaAction.Parameters['MaxNumberOfDigits'] = (_j = (_h = (_g = action.Parameters) === null || _g === void 0 ? void 0 : _g.InputValidation) === null || _h === void 0 ? void 0 : _h.CustomValidation) === null || _j === void 0 ? void 0 : _j.MaximumLength;
                }
            }
        }
        if (action.Parameters.DTMFConfiguration && action.Parameters.DTMFConfiguration.InputTerminationSequence) {
            smaAction.Parameters["TerminatorDigits"] = action.Parameters.DTMFConfiguration.InputTerminationSequence;
        }
        if (action.Parameters.InputTimeLimitSeconds) {
            const timeLimit = Number.parseInt(action.Parameters.InputTimeLimitSeconds);
            smaAction.Parameters["RepeatDurationInMilliseconds"] = timeLimit * 1000;
        }
        return {
            "SchemaVersion": "1.0",
            "Actions": [
                smaAction
            ],
            "TransactionAttributes": {
                "currentFlowBlock": action
            }
        };
    });
}
function getSpeechParameters(action) {
    let rv = null;
    if (action.Text !== null || action.SSML !== null) {
        let text;
        let type;
        if (action.Parameters.Text !== null) {
            text = action.Parameters.Text;
            type = "text";
        }
        else if (action.Parameters.SSML !== null) {
            text = action.Parameters.SSML;
            type == "ssml";
        }
        rv = {
            Text: text,
            TextType: type
        };
    }
    console.log(rv);
    return rv;
}
function findActionByID(actions, identifier) {
    return actions.find((action) => action.Identifier === identifier);
}
function getLegACallDetails(event) {
    let rv = null;
    if (event && event.CallDetails && event.CallDetails.Participants && event.CallDetails.Participants.length > 0) {
        for (let i = 0; i < event.CallDetails.Participants.length; i++) {
            if (event.CallDetails.Participants[i].ParticipantTag === 'LEG-A') {
                rv = event.CallDetails.Participants[i];
                break;
            }
        }
    }
    return rv;
}
