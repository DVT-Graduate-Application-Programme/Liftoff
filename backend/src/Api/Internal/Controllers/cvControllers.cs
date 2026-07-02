using Backend.Application.Features.Resumes.Queries.GetResumeDocument;
using Backend.Application.Queries.GetResumes;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Api.Controllers;

[ApiController]
[Route("api/resumes")]
public class ResumeController : ControllerBase
{
    private readonly IMediator _mediator;

    public ResumeController(IMediator mediator)
    {
        _mediator = mediator;
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
}