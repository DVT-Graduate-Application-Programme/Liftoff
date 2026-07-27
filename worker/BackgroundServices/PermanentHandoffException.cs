namespace Worker.BackgroundServices;

/// <summary>
/// Raised when the hiring agent rejects a hand-off with a non-retryable (4xx)
/// response. Signals the worker to dead-letter the message rather than retry it.
/// </summary>
public sealed class PermanentHandoffException : Exception
{
    public PermanentHandoffException(string message) : base(message)
    {
    }
}
