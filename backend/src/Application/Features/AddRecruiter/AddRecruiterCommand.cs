using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using FluentValidation;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.AddRecruiter;

public record AddRecruiterCommand(RecruiterPostDto Recruiter) : IRequest<RecruiterPostDto>;

public class AddRecruiterCommandValidator : AbstractValidator<AddRecruiterCommand>
{
    public AddRecruiterCommandValidator()
    {
        RuleFor(x => x.Recruiter.FirstName).NotEmpty().WithMessage("Recruiter First Name is required.");
        RuleFor(x => x.Recruiter.LastName).NotEmpty().WithMessage("Recruiter Last Name is required.");
        RuleFor(x => x.Recruiter.Email).NotEmpty().EmailAddress().WithMessage("Valid Recruiter Email is required.");
    }
}

public class AddRecruiterHandler : IRequestHandler<AddRecruiterCommand, RecruiterPostDto>
{
    private readonly IRecruiterRepository _recruiterRepository;

    public AddRecruiterHandler(IRecruiterRepository recruiterRepository)
    {
        _recruiterRepository = recruiterRepository;
    }

    public async Task<RecruiterPostDto> Handle(AddRecruiterCommand request, CancellationToken cancellationToken)
    {
        await _recruiterRepository.AddRecruiterAsync(request.Recruiter, cancellationToken);
        await _recruiterRepository.SaveChangesAsync(cancellationToken);
        return request.Recruiter;
    }
}
