namespace Backend.Application.Interfaces;

public interface ICvStorage
{
    Task<string> SaveFileAsync(Stream stream, string fileName, CancellationToken cancellationToken);
    Task<Stream?> GetFileAsync(string fileId, CancellationToken cancellationToken);
}

