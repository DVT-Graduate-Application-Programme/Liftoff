using Backend.Application.Queries.GetResumeDocument;
using MediatR;

namespace Backend.Application.Features.Resumes.Queries.GetResumeDocument;

public record GetResumeDocumentQuery(int Id) : IRequest<ResumeDocumentDto>;