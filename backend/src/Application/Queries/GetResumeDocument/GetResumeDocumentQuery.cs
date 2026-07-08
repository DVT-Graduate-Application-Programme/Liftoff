using Backend.Application.Queries.GetResumeDocument;
using MediatR;

namespace Backend.Application.Features.Resumes.Queries.GetResumeDocument;

public record GetResumeDocumentQuery(Guid Id) : IRequest<ResumeDocumentDto>;