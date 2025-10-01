namespace BookStore.Common.Instrumentation;

/// <summary>
/// Contains all trace tag constants used for tracing operations following OpenTelemetry semantic conventions.
/// </summary>
public static class TraceTags
{
    // Tag values for request types
    public const string ChatRequestType = "chat";
    public const string ChatStreamRequestType = "chat_stream";
    public const string CompletionRequestType = "completion";
    public const string CompletionStreamRequestType = "completion_stream";
    public const string EmbeddingsRequestType = "embeddings";

    // LLM-specific tags
    public const string TenantVendor = "llm.vendor.tenant";
    public const string LlmRequestTypeKey = "llm.request.type";
    public const string LLMSystem = "llm.system";
    public const string LlmModelNameKey = "llm.model.name";
    public const string LlmOperationNameKey = "llm.operation.name";
    public const string LlmLatencyKey = "llm.latency";

    // GenAI semantic conventions (OpenTelemetry standard)
    public const string GenAiRequestTemperatureKey = "gen_ai.request.temperature";
    public const string GenAiRequestTopPKey = "gen_ai.request.top_p";
    public const string GenAiRequestMaxTokensKey = "gen_ai.request.max_tokens";
    public const string GenAiRequestPromptKey = "gen_ai.request.prompt";
    public const string GenAiRequestInputKey = "gen_ai.request.input";
    public const string GenAiResponseModelKey = "gen_ai.response.model";
    public const string GenAiResponseIdKey = "gen_ai.response.id";
    public const string GenAiUsageInputTokensKey = "gen_ai.usage.input_tokens";
    public const string GenAiUsageOutputTokensKey = "gen_ai.usage.output_tokens";
    public const string GenAiUsageTotalTokensKey = "gen_ai.usage.total_tokens";
    public const string GenAiResponseUsageTotalTokensKey = "gen_ai.response.usage.total_tokens";
    public const string GenAiResponseContentKey = "gen_ai.response.content";
    public const string GenAiResponseTextKey = "gen_ai.response.text";
    public const string GenAiOperationNameKey = "gen_ai.operation.name";

    // Operation type values
    public const string ChatOperation = "chat";
    public const string CompletionOperation = "completion";
    public const string EmbeddingOperation = "embedding";

    // Workflow tags
    public const string WorkflowNameKey = "workflow.name";

    // Traceloop-specific tags
    public const string TraceLoopInputKey = "llm.prompt.0.content";
    public const string TraceLoopOutputKey = "traceloop.output";

    // OpenTelemetry LLM Semantic Conventions for prompts and completions
    public const string LlmPrompt0ContentKey = "llm.prompts.0.content";
    public const string LlmPrompt0RoleKey = "llm.prompts.0.role";
    public const string LlmCompletion0ContentKey = "llm.completions.0.content";
    public const string LlmCompletion0FinishReasonKey = "llm.completions.0.finish_reason";
    public const string LlmCompletion0RoleKey = "llm.completions.0.role";
}
