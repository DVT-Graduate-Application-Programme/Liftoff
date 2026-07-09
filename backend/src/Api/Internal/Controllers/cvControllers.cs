using Backend.Application.Features.Resumes.Queries.GetResumeDocument;
using Backend.Application.Queries.GetCandidate;
using Backend.Application.Queries.GetResumes;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Api.Controllers;

[ApiController]
[Route("api/resumes")]
public class ResumeController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly Backend.Application.Interfaces.IResumeStorage _storage;

    public ResumeController(IMediator mediator, Backend.Application.Interfaces.IResumeStorage storage)
    {
        _mediator = mediator;
        _storage = storage;
    }

    [HttpGet]
    public async Task<IActionResult> GetResumes(
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(
            new GetResumesQuery(),
            cancellationToken);

        return Ok(result);
    }

    [HttpGet("{id}/document")]
    public async Task<IActionResult> GetDocument(
        int id,
        CancellationToken cancellationToken)
    {
        var document = await _mediator.Send(
            new GetResumeDocumentQuery(id),
            cancellationToken);

        if (document is null)
            return NotFound();

        return File(
            document.Content,
            document.ContentType,
            document.FileName);
    }

    [HttpGet("{id}/transcript")]
    public async Task<IActionResult> GetTranscript(
        int id,
        CancellationToken cancellationToken)
    {
        var document = await _storage.GetTranscriptAsync(id, cancellationToken);

        if (document is null)
            return NotFound();

        return File(
            document.Content,
            document.ContentType,
            document.FileName);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetCandidate(
    int id,
    CancellationToken cancellationToken)
    {
        var candidate = await _mediator.Send(
            new GetCandidateQuery(id),
            cancellationToken);

        if (candidate is null)
            return NotFound();

        return Ok(candidate);
    }
}