export interface AI21CompleteResponse {
    id:          string;
    prompt:      Prompt;
    completions: Completion[];
}

export interface Completion {
    data:         Prompt;
    finishReason: FinishReason;
}

export interface Prompt {
    text:   string;
    tokens: Token[];
}

export interface Token {
    generatedToken: GeneratedToken;
    topTokens:      null;
    textRange:      TextRange;
}

export interface GeneratedToken {
    token:       string;
    logprob:     number;
    raw_logprob: number;
}

export interface TextRange {
    start: number;
    end:   number;
}

export interface FinishReason {
    reason: string;
}
