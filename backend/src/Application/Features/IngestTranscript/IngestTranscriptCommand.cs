using MediatR;

namespace Application.Features.IngestTranscript;

public class IngestTranscriptCommand : IRequest<IngestTranscriptResult>
{
    public string DegreeName { get; set; } = string.Empty;
    public int NqfLevel { get; set; }
    public int MinimumYears { get; set; }
    public int StartYear { get; set; }
    public int GraduationYear { get; set; }
    public List<YearAverageDto> YearAverages { get; set; } = [];
    public List<ModuleDto> Modules { get; set; } = [];
    public List<AdditionalDegreeDto> Degrees { get; set; } = [];
}

public class YearAverageDto
{
    public int Year { get; set; }
    public double Average { get; set; }
}

public class ModuleDto
{
    public int Year { get; set; }
    public string Name { get; set; } = string.Empty;
    public double Mark { get; set; }
}

public class AdditionalDegreeDto
{
    public string DegreeName { get; set; } = string.Empty;
    public int NqfLevel { get; set; }
    public int MinimumYears { get; set; }
    public int StartYear { get; set; }
    public int GraduationYear { get; set; }
    public List<YearAverageDto> YearAverages { get; set; } = [];
    public List<ModuleDto> Modules { get; set; } = [];
}