import { loadContactFlow } from "./contact-flow-loader";

const connectContextStore: string = "ConnectContextStore";

export async function processFlow(smaEvent: any, amazonConnectInstanceID: string, amazonConnectFlowID: string) {
    const contactFlow = await loadContactFlow(amazonConnectInstanceID, amazonConnectFlowID);
    console.log("Loaded Contact Flow");
    
    const transactionAttributes = smaEvent.CallDetails.TransactionAttributes;
    if (transactionAttributes && transactionAttributes.currentFlowBlock) {
        if (smaEvent.InvocationEventType === 'ACTION_SUCCESSFUL') {
            return await processFlowActionSuccess(smaEvent, transactionAttributes.currentFlowBlock, contactFlow);
        }
        else {
            return await processFlowActionFailure(smaEvent, transactionAttributes.currentFlowBlock, contactFlow);
        }
    }
    else {
        // We're at the root start from there
        return await processRootFlowBlock(smaEvent, contactFlow, transactionAttributes);
    }
}

async function processRootFlowBlock(smaEvent: any, contactFlow: any, transactionAttributes: any) {
    // OK, time to figure out the root of the flow
    if (contactFlow.StartAction !== null) {
        const actions: any[] = contactFlow.Actions;
        if (actions !== null && actions.length > 0) {
            const currentAction = findActionByID(actions, contactFlow.StartAction);
            if (currentAction !== null) {
                return await processFlowAction(smaEvent, currentAction);
            }
        }
    }
}

async function processFlowActionFailure(smaEvent: any, action: any, contactFlow: any) {
    switch (action.Type) {
        case 'GetParticipantInput':
            return await processFlowActionGetParticipantInput(smaEvent, action);
        default:
            return null;
    }
}

async function processFlowActionSuccess(smaEvent: any, action: any, contactFlow: any) {
    switch (action.Type) {
        case 'GetParticipantInput':
            return await processFlowActionGetParticipantInput(smaEvent, action);
        default:
            return null;
    }
}

async function processFlowAction(smaEvent: any, action: any) {
    switch (action.Type) {
        case 'GetParticipantInput':
            return await processFlowActionGetParticipantInput(smaEvent, action);
        default:
            return null;
    }
}

async function processFlowActionGetParticipantInput(smaEvent: any, action: any) {
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

    if (action.Parameters?.InputValidation) {
        if (action.Parameters?.InputValidation?.CustomValidation) {
            if (action.Parameters?.InputValidation?.CustomValidation?.MaximumLength) {
                smaAction.Parameters['MaxNumberOfDigits'] = action.Parameters?.InputValidation?.CustomValidation?.MaximumLength;
            }
        }
    }
    if (action.Parameters.DTMFConfiguration && action.Parameters.DTMFConfiguration.InputTerminationSequence) {
        smaAction.Parameters["TerminatorDigits"] = action.Parameters.DTMFConfiguration.InputTerminationSequence;
    }
    if (action.Parameters.InputTimeLimitSeconds) {
        const timeLimit: number = Number.parseInt(action.Parameters.InputTimeLimitSeconds);
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
    }
}

async function processFlowActionGetParticipantInputSuccess(smaEvent: any, action: any, contactFlow: any) {
    const legA = getLegACallDetails(smaEvent);
    let transactionAttributes = smaEvent.CallDetails.TransactionAttributes;

    if (action.Parameters && action.Parameters.StoreInput == "True") {
        smaEvent.CallDetails.TransactionAttributes = updateConnectContextStore(transactionAttributes, "StoredCustomerInput", smaEvent.ActionData.ReceivedDigits);
    }

    const nextAction = findActionByID(contactFlow.Actions, action.Transitions.NextAction);
    return await processFlowAction(smaEvent, nextAction);
}

async function processFlowActionGetParticipantInputFailure(smaEvent: any, action: any, contactFlow: any) {
    return null;
}

function updateConnectContextStore(transactionAttributes: any, key: string, value: any) {
    if (transactionAttributes[connectContextStore]) transactionAttributes[connectContextStore][key] = value;
    else {
        transactionAttributes[connectContextStore] = { };
        transactionAttributes[connectContextStore][key] = value;
    }
    return transactionAttributes;
}

function getSpeechParameters(action: any) {
    let rv = null;
    if (action.Text !== null || action.SSML !== null) {
        let text: string;
        let type: string;
        if (action.Parameters.Text !== null) {
            text = action.Parameters.Text;
            type = "text"
        }
        else if (action.Parameters.SSML !== null) {
            text = action.Parameters.SSML;
            type == "ssml";
        }
        rv = {
            Text: text,
            TextType: type
        }
    }
    console.log(rv);
    return rv;
}

function findActionByID(actions: any[], identifier: string) {
    return actions.find((action: any) => action.Identifier === identifier);
}

function getLegACallDetails(event: any) {
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