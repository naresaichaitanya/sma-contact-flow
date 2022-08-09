export declare function processFlow(smaEvent: any, amazonConnectInstanceID: string, amazonConnectFlowID: string): Promise<{
    SchemaVersion: string;
    Actions: {
        Type: string;
        Parameters: {
            CallId: any;
            SpeechParameters: any;
            FailureSpeechParameters: any;
            MinNumberOfDigits: number;
        };
    }[];
    TransactionAttributes: {
        currentFlowBlock: any;
    };
}>;
