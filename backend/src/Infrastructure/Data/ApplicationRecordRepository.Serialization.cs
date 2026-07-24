using System.Text.Json;

namespace Infrastructure.Data;

public partial class ApplicationRecordRepository
{
    private static double? GetAcademicAverage(JsonDocument? instJson, JsonDocument? scoreJson)
    {
        if (instJson != null)
        {
            try
            {
                var root = instJson.RootElement;
                if (root.TryGetProperty("academic_average", out var avgProp) && avgProp.TryGetDouble(out var val))
                {
                    return val;
                }
                if (root.TryGetProperty("academicAverage", out var avgPropCamel) && avgPropCamel.TryGetDouble(out var valCamel))
                {
                    return valCamel;
                }
            }
            catch { }
        }

        if (scoreJson != null)
        {
            try
            {
                var root = scoreJson.RootElement;
                if (root.TryGetProperty("education", out var eduProp) && 
                    eduProp.TryGetProperty("score", out var scoreProp) && 
                    scoreProp.TryGetDouble(out var val))
                {
                    return val;
                }
            }
            catch { }
        }

        return null;
    }

    private static List<string> ReadFlags(JsonDocument? flagsJson)
    {
        if (flagsJson is null || flagsJson.RootElement.ValueKind != JsonValueKind.Array)
        {
            return [];
        }

        return flagsJson.RootElement
            .EnumerateArray()
            .Where(flag => flag.ValueKind == JsonValueKind.String)
            .Select(flag => flag.GetString()!)
            .ToList();
    }
}
