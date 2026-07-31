using Backend.Application.Interfaces;
using Microsoft.Extensions.Configuration;

namespace Backend.Infrastructure.Storage;

public class LocalStorage : ICvStorage
{
    private readonly string _basePath;

    public LocalStorage(IConfiguration configuration)
    {
        _basePath = configuration["Storage:LocalPath"]
            ?? Path.Combine(AppContext.BaseDirectory, "Data", "SeedDocuments");
        Directory.CreateDirectory(_basePath);
    }

    public async Task<string> SaveFileAsync(Stream stream, string fileName, CancellationToken cancellationToken)
    {
        var filePath = Path.Combine(_basePath, fileName);
        await using var fileStream = new FileStream(filePath, FileMode.Create);
        await stream.CopyToAsync(fileStream, cancellationToken);
        return filePath;
    }

    public Task<Stream?> GetFileAsync(string fileId, CancellationToken cancellationToken)
    {
        if (!File.Exists(fileId)) return Task.FromResult<Stream?>(null);
        return Task.FromResult<Stream?>(File.OpenRead(fileId));
    }
}