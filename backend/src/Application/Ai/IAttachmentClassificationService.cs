using System.Threading;
using System.Threading.Tasks;

namespace Application.Ai;

public interface IAttachmentClassificationService
{
    Task<string> ClassifyAttachmentAsync(byte[] fileBytes, string fileName, string mimeType, CancellationToken token = default);
}
