public class EvaluationResponse
{
     public required string Summary { get; init; }
    public required double ValidityScore { get; init; }   // 0.0–1.0
    public required ConfidenceLevel Confidence { get; init; }
    public required ExtractedFields ExtractedFields { get; init; }
    public required IReadOnlyList<string> DisqualificationReasons { get; init; }
}

public sealed record ExtractedFields
{
    public string? CandidateName { get; init; }
    public double? YearsExperience { get; init; }
    public string? HighestQualification { get; init; }
    public required IReadOnlyList<string> RelevantSkills { get; init; }
    public required bool HasTranscript { get; init; }
}